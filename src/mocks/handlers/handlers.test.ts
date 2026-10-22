import { beforeEach, describe, expect, it } from "vitest"
import { challengeS256, randomBase64Url } from "@/auth/pkce"
import { server } from "../../../tests/setup/msw"
import { createHandlers } from "."
import { mockSession } from "../session"

const API = "https://api.test"
const REDIRECT = "http://localhost:3000/auth/callback"

async function signIn(persona: string, authTime = Math.floor(Date.now() / 1000)) {
  const verifier = randomBase64Url(32)
  const code = randomBase64Url(16)
  mockSession.issueCode({
    code,
    persona,
    challenge: await challengeS256(verifier),
    redirectUri: REDIRECT,
    authTime,
    expiresAt: Date.now() + 60_000,
  })
  const res = await fetch(`${API}/v1/oauth/token`, {
    method: "POST",
    body: form({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
      client_id: "dashboard-test",
    }),
  })
  expect(res.status).toBe(200)
  const body = (await res.json()) as { access_token: string }
  return body.access_token
}

/** jsdom's URLSearchParams is not undici's, so send the encoded string. */
const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString()

const get = (path: string, token: string) =>
  fetch(`${API}${path}`, { headers: { authorization: `Bearer ${token}` } })

beforeEach(() => {
  localStorage.clear()
  server.use(...createHandlers(API))
})

describe("mock API", () => {
  it("rejects a code exchange with the wrong verifier", async () => {
    mockSession.issueCode({
      code: "c1",
      persona: "founder",
      challenge: await challengeS256(randomBase64Url(32)),
      redirectUri: REDIRECT,
      authTime: 0,
      expiresAt: Date.now() + 60_000,
    })
    const res = await fetch(`${API}/v1/oauth/token`, {
      method: "POST",
      body: form({
        grant_type: "authorization_code",
        code: "c1",
        code_verifier: randomBase64Url(32),
        redirect_uri: REDIRECT,
      }),
    })
    expect(res.status).toBe(400)
  })

  it("refreshes from the mock session and stops after revoke", async () => {
    await signIn("analyst")
    const refresh = () =>
      fetch(`${API}/v1/oauth/token`, {
        method: "POST",
        body: form({ grant_type: "refresh_token" }),
      })
    expect((await refresh()).status).toBe(200)
    await fetch(`${API}/v1/oauth/revoke`, { method: "POST" })
    expect((await refresh()).status).toBe(400)
  })

  it("serves me for the signed-in persona", async () => {
    const token = await signIn("network-admin")
    const res = await get("/v1/me", token)
    const body = (await res.json()) as { data: { user: { username: string } } }
    expect(body.data.user.username).toBe("elif")
  })

  it("enforces x-gezcez-permission with the error envelope", async () => {
    const token = await signIn("analyst")
    const res = await get("/v1/dash/overview", token)
    expect(res.status).toBe(403)
    const body = (await res.json()) as { ok: boolean; error: { code: string } }
    expect(body).toMatchObject({ ok: false, error: { code: "PERMISSION_MISSING" } })
    expect((await get("/v1/dash/networks/kocaeli/overview", token)).status).toBe(200)
    expect((await get("/v1/dash/networks/istanbul-iett/overview", token)).status).toBe(403)
  })

  it("requires a recent sign-in for sudo operations", async () => {
    const stale = await signIn("founder", Math.floor(Date.now() / 1000) - 3600)
    const users = (await (await get("/v1/dash/users?limit=5", stale)).json()) as {
      data: { items: { id: string }[] }
    }
    const id = users.data.items.find((u) => !u.id.endsWith("FOUNDR"))?.id ?? ""
    const ban = (token: string) =>
      fetch(`${API}/v1/dash/users/${id}/ban`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ duration: "7d", public_reason: "test" }),
      })
    const res = await ban(stale)
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: { code: "AUTH_STEP_UP_REQUIRED" } })
    const fresh = await signIn("founder")
    expect((await ban(fresh)).status).toBe(200)
  })

  it("paginates with opaque cursors", async () => {
    const token = await signIn("founder")
    const first = (await (await get("/v1/dash/users?limit=50", token)).json()) as {
      data: { items: { id: string }[]; next_cursor: string | null; total: number }
    }
    expect(first.data.items).toHaveLength(50)
    expect(first.data.next_cursor).toBeTruthy()
    const second = (await (
      await get(`/v1/dash/users?limit=50&cursor=${first.data.next_cursor ?? ""}`, token)
    ).json()) as { data: { items: { id: string }[] } }
    expect(second.data.items[0]?.id).not.toBe(first.data.items[0]?.id)
  })
})

const send = (method: string, path: string, token: string, body?: unknown) =>
  fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

describe("mock API admin rules", () => {
  it("applies role level rules to network members", async () => {
    const token = await signIn("network-admin")
    const short = (await (
      await get("/v1/dash/networks/kocaeli/members/candidates?q=a", token)
    ).json()) as { data: { id: string }[] }
    expect(short.data).toEqual([])
    let found: { id: string }[] = []
    for (const prefix of ["ay", "me", "ah", "ze", "ca", "em", "fa"]) {
      const res = (await (
        await get(`/v1/dash/networks/kocaeli/members/candidates?q=${prefix}`, token)
      ).json()) as { data: { id: string }[] }
      found = res.data
      if (found.length) break
    }
    const target = found[0]?.id ?? ""
    expect(target).not.toBe("")
    const grant = (roleId: number) =>
      send("POST", `/v1/dash/networks/kocaeli/members/${target}/roles`, token, {
        operations: [{ role_id: roleId, op: "grant" }],
      })
    const analyst = (await (await grant(5)).json()) as { data: { results: { ok: boolean }[] } }
    expect(analyst.data.results[0]?.ok).toBe(true)
    const peer = (await (await grant(3)).json()) as {
      data: { results: { ok: boolean; error_code: string }[] }
    }
    expect(peer.data.results[0]).toMatchObject({ ok: false, error_code: "ROLE_LEVEL_TOO_LOW" })
    // Sakarya is not Elif's network.
    expect((await get("/v1/dash/networks/sakarya/members", token)).status).toBe(403)
  })

  it("refuses edits to built-in roles in the matrix batch", async () => {
    const token = await signIn("founder")
    const res = (await (
      await send("POST", "/v1/dash/roles/permissions:batch", token, {
        operations: [
          { role_id: 5, permission_key: "vehicles.history.read", op: "grant" },
          { role_id: 1, permission_key: "users.read", op: "revoke" },
        ],
      })
    ).json()) as { data: { results: { ok: boolean; error_code: string | null }[] } }
    expect(res.data.results.map((r) => r.error_code)).toEqual([null, "ROLE_IMMUTABLE"])
  })

  it("needs a fresh sign-in for redirect URI changes and validates them", async () => {
    const stale = await signIn("founder", Math.floor(Date.now() / 1000) - 3600)
    const patch = (token: string, body: unknown) =>
      send("PATCH", "/v1/dash/apps/kocaeli-open-data", token, body)
    expect((await patch(stale, { redirect_uris: ["https://ok.example/cb"] })).status).toBe(403)
    expect((await patch(stale, { name: "Renamed" })).status).toBe(200)
    const fresh = await signIn("founder")
    expect((await patch(fresh, { redirect_uris: ["http://insecure.example/cb"] })).status).toBe(400)
    expect((await patch(fresh, { redirect_uris: ["https://ok.example/cb"] })).status).toBe(200)
  })

  it("rotates a secret keeping the previous one during grace", async () => {
    const token = await signIn("founder")
    const res = (await (
      await send("POST", "/v1/dash/apps/kocaeli-open-data/secret", token, { grace: "24h" })
    ).json()) as { data: { secret: string } }
    expect(res.data.secret).toMatch(/^gzs_/)
    const app = (await (await get("/v1/dash/apps/kocaeli-open-data", token)).json()) as {
      data: { secrets: { state: string }[] }
    }
    expect(app.data.secrets.map((s) => s.state)).toEqual(["current", "previous"])
  })
})
