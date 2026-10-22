import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, it, vi } from "vitest"
import { server } from "../../tests/setup/msw"
import {
  API,
  channelBus,
  fakeLocks,
  fakeWeb,
  makeClient,
  ORIGIN,
  tokenBody,
} from "./__tests__/helpers"
import type { AuthEvent } from "./config"
import { AuthError, isAuthError } from "./errors"
import { challengeS256 } from "./pkce"
import { SELECT_ACCOUNT_FLAG, STEP_UP_MESSAGE } from "./session"
import { memoryStorage } from "./storage"
import { TXN_PREFIX } from "./transaction"

const TOKEN_URL = `${API}/v1/oauth/token`
const REVOKE_URL = `${API}/v1/oauth/revoke`

function tokenRoute(handler: (body: URLSearchParams) => Response | Promise<Response>) {
  const calls: URLSearchParams[] = []
  server.use(
    http.post(TOKEN_URL, async ({ request }) => {
      const body = new URLSearchParams(await request.text())
      calls.push(body)
      return handler(body)
    }),
  )
  return calls
}

const okToken = (sub = "01USER") => HttpResponse.json(tokenBody(sub))
const invalidGrant = () => HttpResponse.json({ error: "invalid_grant" }, { status: 400 })

async function signIn(client: ReturnType<typeof makeClient>["client"]) {
  const calls = tokenRoute(() => okToken())
  await client.getAccessToken()
  return calls
}

afterEach(() => {
  vi.useRealTimers()
})

describe("login and callback", () => {
  it("sends every authorize parameter the contract requires, with S256", async () => {
    const storage = memoryStorage()
    const { client, web } = makeClient({ storage })
    await client.login({ returnTo: `${ORIGIN}/admin/users?q=x` })

    const url = new URL(web.navigated[0]!)
    expect(url.origin + url.pathname).toBe("https://oauth.test/authorize")
    const p = url.searchParams
    expect(p.get("client_id")).toBe("dashboard")
    expect(p.get("redirect_uri")).toBe(`${ORIGIN}/auth/callback`)
    expect(p.get("response_type")).toBe("code")
    expect(p.get("scope")).toBe("openid profile email offline_access dash")
    expect(p.get("code_challenge_method")).toBe("S256")
    expect(p.get("ui_locales")).toBe("tr")
    expect(p.get("prompt")).toBeNull()

    const state = p.get("state")!
    const txn = JSON.parse((await storage.get(TXN_PREFIX + state))!) as {
      verifier: string
      returnTo: string
    }
    expect(p.get("code_challenge")).toBe(await challengeS256(txn.verifier))
    expect(txn.returnTo).toBe("/admin/users?q=x")
  })

  it("exchanges the code, strips code and state from the URL before the token request", async () => {
    const order: string[] = []
    const web = fakeWeb()
    const replace = web.replaceUrl
    web.replaceUrl = (u) => {
      order.push("replaceState")
      replace(u)
    }
    const { client } = makeClient({ web })
    await client.login({ returnTo: "/admin" })
    const state = new URL(web.navigated[0]!).searchParams.get("state")!
    const calls = tokenRoute((body) => {
      order.push("token")
      expect(body.get("grant_type")).toBe("authorization_code")
      expect(body.get("code")).toBe("abc")
      expect(body.get("code_verifier")).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(body.get("redirect_uri")).toBe(`${ORIGIN}/auth/callback`)
      return okToken()
    })

    const result = await client.handleCallback(`${ORIGIN}/auth/callback?code=abc&state=${state}`)
    expect(result).toEqual({ returnTo: "/admin", kind: "login" })
    expect(order).toEqual(["replaceState", "token"])
    expect(web.href).toBe(`${ORIGIN}/auth/callback`)
    expect(calls).toHaveLength(1)
    expect(client.status()).toBe("signed_in")
  })

  it.each([
    ["missing state", "?code=abc"],
    ["unknown state", "?code=abc&state=nope"],
  ])(
    "rejects a %s with state_mismatch and never calls the token endpoint",
    async (_name, query) => {
      const { client } = makeClient()
      const calls = tokenRoute(() => okToken())
      const error = await client
        .handleCallback(`${ORIGIN}/auth/callback${query}`)
        .catch((e: unknown) => e)
      expect(isAuthError(error, "state_mismatch")).toBe(true)
      expect(calls).toHaveLength(0)
    },
  )

  it("rejects a transaction older than 10 minutes", async () => {
    let now = 1_000_000
    const { client, web } = makeClient({ now: () => now })
    await client.login()
    const state = new URL(web.navigated[0]!).searchParams.get("state")!
    now += 10 * 60 * 1000 + 1
    const calls = tokenRoute(() => okToken())
    const error = await client
      .handleCallback(`${ORIGIN}/auth/callback?code=a&state=${state}`)
      .catch((e: unknown) => e)
    expect(isAuthError(error, "state_mismatch")).toBe(true)
    expect(calls).toHaveLength(0)
  })

  it("surfaces error=access_denied as a typed error", async () => {
    const { client, web } = makeClient()
    await client.login()
    const state = new URL(web.navigated[0]!).searchParams.get("state")!
    const error = await client
      .handleCallback(`${ORIGIN}/auth/callback?error=access_denied&state=${state}`)
      .catch((e: unknown) => e)
    expect(isAuthError(error, "access_denied")).toBe(true)
  })

  it("uses prompt=select_account on the first login after an explicit sign-out", async () => {
    const { client, web, flags } = makeClient()
    server.use(http.post(REVOKE_URL, () => new HttpResponse(null, { status: 200 })))
    await client.logout()
    expect(flags.get(SELECT_ACCOUNT_FLAG)).toBe("1")
    await client.login()
    expect(new URL(web.navigated.at(-1)!).searchParams.get("prompt")).toBe("select_account")
    await client.login()
    expect(new URL(web.navigated.at(-1)!).searchParams.get("prompt")).toBeNull()
  })
})

describe("refresh (race rules 9.8)", () => {
  it("rule 1: 100 concurrent getAccessToken calls cause one token request", async () => {
    const { client } = makeClient()
    const calls = tokenRoute(() => okToken())
    const tokens = await Promise.all(Array.from({ length: 100 }, () => client.getAccessToken()))
    expect(calls).toHaveLength(1)
    expect(calls[0]!.get("grant_type")).toBe("refresh_token")
    expect(calls[0]!.get("client_id")).toBe("dashboard")
    expect(calls[0]!.has("refresh_token")).toBe(false) // the gz_rt cookie carries it
    expect(new Set(tokens).size).toBe(1)
  })

  it("rule 2: two tabs refresh one after the other and the second sends the rotated cookie", async () => {
    // A fake cookie jar: the browser attaches the current gz_rt when the request starts.
    const jar = { gz_rt: "rt-0" }
    let rotation = 0
    const presented: string[] = []
    const cookieFetch: typeof fetch = async (input, init) => {
      const sent = jar.gz_rt
      presented.push(sent)
      await new Promise((r) => setTimeout(r, 20))
      if (sent !== `rt-${rotation}`)
        return Response.json({ error: "invalid_grant" }, { status: 400 })
      rotation += 1
      jar.gz_rt = `rt-${rotation}`
      return fetch(input, init)
    }
    tokenRoute(() => okToken())
    const locks = fakeLocks()
    const tabA = makeClient({ locks, fetch: cookieFetch }).client
    const tabB = makeClient({ locks, fetch: cookieFetch }).client

    await Promise.all([tabA.getAccessToken(), tabB.getAccessToken()])
    expect(presented).toEqual(["rt-0", "rt-1"])
    expect(locks.log).toEqual([
      "acquire gz.auth.refresh.dashboard",
      "acquire gz.auth.refresh.dashboard",
    ])
  })

  it("rule 3: tolerates a duplicate refresh answered with the same successor", async () => {
    const same = tokenBody()
    tokenRoute(() => HttpResponse.json(same))
    const { client } = makeClient({ locks: null })
    const a = await client.getAccessToken()
    ;(client as unknown as { access: null }).access = null
    const b = await client.getAccessToken()
    expect(a).toBe(b)
    expect(client.status()).toBe("signed_in")
  })

  it("rule 4: invalid_grant signs out once even with several waiters", async () => {
    const { client } = makeClient()
    await signIn(client)
    ;(client as unknown as { access: null }).access = null
    const events: AuthEvent[] = []
    client.onEvent((e) => events.push(e))
    tokenRoute(() => invalidGrant())

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => client.getAccessToken()),
    )
    expect(
      results.every((r) => r.status === "rejected" && isAuthError(r.reason, "signed_out")),
    ).toBe(true)
    expect(events).toEqual([{ type: "signed_out", reason: "expired" }])
    expect(client.status()).toBe("signed_out")
  })

  it("rule 4: network errors never sign out", async () => {
    const { client } = makeClient()
    await signIn(client)
    ;(client as unknown as { access: null }).access = null
    server.use(http.post(TOKEN_URL, () => HttpResponse.error()))
    const error = await client.getAccessToken().catch((e: unknown) => e)
    expect(isAuthError(error, "network")).toBe(true)
    expect(client.status()).toBe("signed_in")
  })

  it("tryRestore reports false without a session and does not emit 'expired' at boot", async () => {
    const { client } = makeClient()
    const events: AuthEvent[] = []
    client.onEvent((e) => events.push(e))
    tokenRoute(() => invalidGrant())
    expect(await client.tryRestore()).toBe(false)
    expect(client.status()).toBe("signed_out")
    expect(events).toEqual([])
  })

  it("rule 8: proactive refresh pauses while hidden and runs once on visibilitychange", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    const web = fakeWeb()
    const { client } = makeClient({ web })
    const calls = tokenRoute(() =>
      HttpResponse.json(tokenBody("01USER", 900, Math.floor(Date.now() / 1000))),
    )
    await client.getAccessToken()
    expect(calls).toHaveLength(1)

    web.hidden = true
    await vi.advanceTimersByTimeAsync(900_000 - 60_000 + 10)
    expect(calls).toHaveLength(1)

    web.visible()
    web.visible()
    await vi.advanceTimersByTimeAsync(50)
    expect(calls).toHaveLength(2)
  })
})

describe("fetch", () => {
  it("rule 5: retries a 401 AUTH_TOKEN_EXPIRED exactly once with a fresh token", async () => {
    const { client } = makeClient()
    let n = 0
    tokenRoute(() => okToken(`01USER${++n}`))
    const seen: string[] = []
    server.use(
      http.get(`${API}/v1/me`, ({ request }) => {
        seen.push(request.headers.get("authorization") ?? "")
        return HttpResponse.json(
          { ok: false, error: { code: "AUTH_TOKEN_EXPIRED", message: "expired", request_id: "r" } },
          { status: 401 },
        )
      }),
    )
    const res = await client.fetch(`${API}/v1/me`)
    expect(res.status).toBe(401)
    expect(seen).toHaveLength(2)
    expect(seen[0]).not.toBe(seen[1])
    expect(seen.every((h) => h.startsWith("Bearer "))).toBe(true)
  })

  it("replays the request body on the retry", async () => {
    const { client } = makeClient()
    tokenRoute(() => okToken())
    const bodies: string[] = []
    server.use(
      http.patch(`${API}/v1/me`, async ({ request }) => {
        bodies.push(await request.text())
        return bodies.length === 1
          ? HttpResponse.json(
              { ok: false, error: { code: "AUTH_TOKEN_EXPIRED", message: "", request_id: "r" } },
              { status: 401 },
            )
          : HttpResponse.json({ ok: true, data: {} })
      }),
    )
    const res = await client.fetch(`${API}/v1/me`, {
      method: "PATCH",
      body: JSON.stringify({ locale: "en" }),
    })
    expect(res.status).toBe(200)
    expect(bodies).toEqual(['{"locale":"en"}', '{"locale":"en"}'])
  })

  it("rule 5: never retries AUTH_STEP_UP_REQUIRED and emits step_up_required", async () => {
    const { client } = makeClient()
    tokenRoute(() => okToken())
    let hits = 0
    server.use(
      http.post(`${API}/v1/dash/users/01U/ban`, () => {
        hits += 1
        return HttpResponse.json(
          {
            ok: false,
            error: {
              code: "AUTH_STEP_UP_REQUIRED",
              message: "",
              details: { max_age: 600 },
              request_id: "r",
            },
          },
          { status: 403 },
        )
      }),
    )
    const events: AuthEvent[] = []
    client.onEvent((e) => events.push(e))
    const res = await client.fetch(`${API}/v1/dash/users/01U/ban`, { method: "POST", body: "{}" })
    expect(res.status).toBe(403)
    expect(hits).toBe(1)
    expect(events).toContainEqual({ type: "step_up_required", maxAge: 600 })
  })

  it("throws signed_out when there is no session", async () => {
    const { client } = makeClient()
    tokenRoute(() => invalidGrant())
    await expect(client.fetch(`${API}/v1/me`)).rejects.toSatisfy((e) =>
      isAuthError(e, "signed_out"),
    )
  })
})

describe("logout", () => {
  it("rule 7: revokes first, then clears, broadcasts and hops to the oauth /logout", async () => {
    const bus = channelBus()
    const tabA = makeClient({ channel: bus.create() })
    const tabB = makeClient({ channel: bus.create() })
    await signIn(tabA.client)
    await signIn(tabB.client)

    const order: string[] = []
    server.use(
      http.post(REVOKE_URL, async ({ request }) => {
        order.push(`revoke while ${tabA.client.status()}`)
        expect(new URLSearchParams(await request.text()).get("client_id")).toBe("dashboard")
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const hook = vi.fn()
    tabA.client.onLogout(hook)
    const bEvents: AuthEvent[] = []
    tabB.client.onEvent((e) => bEvents.push(e))

    await tabA.client.logout()

    expect(order).toEqual(["revoke while signed_in"])
    expect(tabA.client.status()).toBe("signed_out")
    expect(tabA.client.claims()).toBeNull()
    expect(hook).toHaveBeenCalledOnce()
    const logoutUrl = new URL(tabA.web.navigated.at(-1)!)
    expect(logoutUrl.origin + logoutUrl.pathname).toBe("https://oauth.test/logout")
    expect(logoutUrl.searchParams.get("client_id")).toBe("dashboard")
    expect(logoutUrl.searchParams.get("post_logout_redirect_uri")).toBe(`${ORIGIN}/auth/logged-out`)
    expect(logoutUrl.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{22}$/)

    // rule 6: the other tab drops its in-memory token
    expect(tabB.client.status()).toBe("signed_out")
    expect(tabB.client.claims()).toBeNull()
    expect(bEvents).toContainEqual({ type: "signed_out", reason: "user" })
  })

  it("rule 7: clears local state even when revoke fails", async () => {
    const { client, web } = makeClient()
    await signIn(client)
    server.use(http.post(REVOKE_URL, () => HttpResponse.error()))
    await client.logout()
    expect(client.status()).toBe("signed_out")
    expect(web.navigated.at(-1)).toContain("https://oauth.test/logout")
  })
})

describe("step-up", () => {
  function popupWindow() {
    return {
      closed: false,
      close() {
        this.closed = true
      },
    }
  }

  it("opens the authorize popup with max_age=600 and the step-up redirect URI, then refreshes", async () => {
    const web = fakeWeb()
    const popup = popupWindow()
    web.popup = popup
    let opened = ""
    web.openPopup = (url) => {
      opened = url
      return popup as unknown as Window
    }
    const { client } = makeClient({ web })
    await signIn(client)
    const calls = tokenRoute(() => okToken())

    const pending = client.stepUp()
    await vi.waitFor(() => expect(opened).not.toBe(""))
    const params = new URL(opened).searchParams
    expect(params.get("max_age")).toBe("600")
    expect(params.get("redirect_uri")).toBe(`${ORIGIN}/auth/step-up`)

    // A message from another origin or another window is ignored.
    web.message({
      origin: "https://evil.test",
      source: popup as unknown as Window,
      data: { type: STEP_UP_MESSAGE, ok: true },
    })
    web.message({ origin: ORIGIN, source: {} as Window, data: { type: STEP_UP_MESSAGE, ok: true } })
    await new Promise((r) => setTimeout(r, 10))
    expect(calls).toHaveLength(0)

    web.message({
      origin: ORIGIN,
      source: popup as unknown as Window,
      data: { type: STEP_UP_MESSAGE, ok: true },
    })
    await expect(pending).resolves.toEqual({ type: "elevated" })
    expect(calls).toHaveLength(1) // fresh access token with the new auth_time
  })

  it("falls back to a full redirect when the popup is blocked", async () => {
    const web = fakeWeb()
    web.openPopup = () => null
    const { client } = makeClient({ web })
    await expect(client.stepUp({ returnTo: "/admin/users/01U" })).resolves.toEqual({
      type: "redirected",
    })
    const url = new URL(web.navigated.at(-1)!)
    expect(url.searchParams.get("max_age")).toBe("600")
    expect(url.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/auth/step-up`)
  })

  it("resolves cancelled when the popup is closed", async () => {
    const web = fakeWeb()
    const popup = popupWindow()
    web.openPopup = () => popup as unknown as Window
    const { client } = makeClient({ web })
    const pending = client.stepUp().catch((e: unknown) => e)
    await new Promise((r) => setTimeout(r, 10))
    popup.close()
    const error = await pending
    expect(error).toBeInstanceOf(AuthError)
    expect((error as AuthError).kind).toBe("cancelled")
  })

  it("the popup page reports back to its opener with a strict target origin", () => {
    const { client } = makeClient()
    const opener = { postMessage: vi.fn() }
    client.reportStepUp(true, opener as unknown as Window)
    expect(opener.postMessage).toHaveBeenCalledWith({ type: STEP_UP_MESSAGE, ok: true }, ORIGIN)
  })
})
