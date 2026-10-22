import { http as rawHttp, HttpResponse } from "msw"
import { createOpenApiHttp } from "openapi-msw"
import { server } from "../../tests/setup/msw"
import { createGezcezClient } from "./client"
import { GezcezApiError, isApiError } from "./envelope"
import { apiCall, apiKey, apiQueryOptions } from "./query"
import type { paths } from "./schema.gen"

const BASE = "https://api.test"
const http = createOpenApiHttp<paths>({ baseUrl: BASE })
const client = createGezcezClient({ baseUrl: BASE, fetch: (r) => fetch(r) })

const me = {
  user: {
    id: "01J9ZK6Q4M8W3N2V7T5R1Y0XAB",
    display_name: "phasenull",
    username: "phasenull",
    email_masked: "p*****@gezcez.com",
    locale: "tr" as const,
    avatar_initials: "PN",
  },
  auth_time: 1_760_000_000,
  amr: ["otp" as const],
  global: { roles: [], permissions: ["users.read" as const] },
  networks: [],
}

describe("src/api client", () => {
  it("unwraps the { ok, data } envelope", async () => {
    server.use(http.get("/v1/me", ({ response }) => response(200).json({ ok: true, data: me })))
    const data = await apiCall(client, "get", "/v1/me")
    expect(data.user.display_name).toBe("phasenull")
  })

  it("throws a typed GezcezApiError from the error envelope", async () => {
    server.use(
      http.get("/v1/dash/users", ({ response }) =>
        response(403).json({
          ok: false,
          error: {
            code: "PERMISSION_MISSING",
            message: "missing users.read",
            details: { permission: "users.read" },
            request_id: "req_123",
          },
        }),
      ),
    )
    const error = await apiCall(client, "get", "/v1/dash/users").catch((e: unknown) => e)
    expect(isApiError(error, "PERMISSION_MISSING")).toBe(true)
    const apiError = error as GezcezApiError
    expect(apiError.status).toBe(403)
    expect(apiError.requestId).toBe("req_123")
    expect(apiError.permission).toBe("users.read")
  })

  it("maps a non-envelope error to UNKNOWN and keeps the x-request-id header", async () => {
    server.use(
      rawHttp.get(`${BASE}/v1/dash/roles`, () =>
        HttpResponse.text("bad gateway", { status: 502, headers: { "x-request-id": "cf-ray-1" } }),
      ),
    )
    const error = (await apiCall(client, "get", "/v1/dash/roles").catch(
      (e: unknown) => e,
    )) as GezcezApiError
    expect(error.code).toBe("UNKNOWN")
    expect(error.status).toBe(502)
    expect(error.requestId).toBe("cf-ray-1")
  })

  it("maps a failed fetch to NETWORK", async () => {
    server.use(rawHttp.get(`${BASE}/v1/me`, () => HttpResponse.error()))
    const error = (await apiCall(client, "get", "/v1/me").catch(
      (e: unknown) => e,
    )) as GezcezApiError
    expect(error.code).toBe("NETWORK")
  })

  it("adds an Idempotency-Key to mutations only", async () => {
    const seen: Record<string, string | null> = {}
    server.use(
      http.get("/v1/me", ({ request, response }) => {
        seen.get = request.headers.get("idempotency-key")
        return response(200).json({ ok: true, data: me })
      }),
      http.patch("/v1/me", ({ request, response }) => {
        seen.patch = request.headers.get("idempotency-key")
        return response(200).json({ ok: true, data: me.user })
      }),
    )
    await apiCall(client, "get", "/v1/me")
    await apiCall(client, "patch", "/v1/me", { body: { locale: "en" } })
    expect(seen.get).toBeNull()
    expect(seen.patch).toMatch(/^[0-9a-f-]{32,36}$/)
  })

  it("passes path and query params", async () => {
    let url = ""
    server.use(
      http.get("/v1/dash/users/{userId}", ({ request, response }) => {
        url = request.url
        return response(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "no user", request_id: "r" },
        })
      }),
    )
    await apiCall(client, "get", "/v1/dash/users/{userId}", {
      params: { path: { userId: "01ABC" } },
    }).catch(() => undefined)
    expect(url).toBe(`${BASE}/v1/dash/users/01ABC`)
  })

  it("builds token-free query keys from path and params", () => {
    expect(apiKey("/v1/me")).toEqual(["api", "/v1/me", null])
    const options = apiQueryOptions(client, "/v1/dash/users", {
      params: { query: { q: "phase", limit: 50 } },
    })
    expect(options.queryKey).toEqual([
      "api",
      "/v1/dash/users",
      { query: { q: "phase", limit: 50 } },
    ])
  })
})
