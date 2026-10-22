import { delay, http as rawHttp, HttpResponse, type HttpHandler } from "msw"
import { createOpenApiHttp } from "openapi-msw"
import { OPERATION_AUTH } from "@/api/permission-keys.gen"
import type { components, paths } from "@/api/schema.gen"
import { base64UrlEncode, challengeS256, randomBase64Url } from "@/auth/pkce"
import { decodeAccessToken } from "@/auth/jwt"
import {
  AUDIT,
  findPersona,
  meFor,
  NETWORKS,
  ROLE_PERMISSIONS,
  ROLES,
  toListItem,
  USERS,
  type Persona,
} from "./fixtures"
import { mockSession } from "./session"

type S = components["schemas"]
type ErrorCode = S["ErrorCode"]

const ACCESS_TTL = 15 * 60
const STEP_UP_MAX_AGE = 600

function jwt(claims: Record<string, unknown>): string {
  const enc = (o: unknown) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(o)))
  return `${enc({ alg: "none", typ: "JWT", kid: "mock" })}.${enc(claims)}.mock`
}

function errorBody(code: ErrorCode, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      request_id: `mock_${randomBase64Url(6)}`,
      ...(details ? { details } : {}),
    },
  }
}

function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return HttpResponse.json(errorBody(code, message, details), { status })
}

const nowSec = () => Math.floor(Date.now() / 1000)

interface Caller {
  persona: Persona
  me: S["Me"]
  authTime: number
}

function caller(request: Request): Caller | Response {
  const header = request.headers.get("authorization") ?? ""
  const claims = header.startsWith("Bearer ") ? decodeAccessToken(header.slice(7)) : null
  if (!claims) return apiError(401, "AUTH_REQUIRED", "missing bearer token")
  if (claims.exp < nowSec()) return apiError(401, "AUTH_TOKEN_EXPIRED", "access token expired")
  const persona = findPersona(claims.sub.replace(/^persona:/, ""))
  if (!persona) return apiError(401, "AUTH_TOKEN_INVALID", "unknown subject")
  return { persona, me: meFor(persona, claims.authTime), authTime: claims.authTime }
}

/** Enforces x-gezcez-permission and x-gezcez-sudo exactly as the generated OPERATION_AUTH says. */
function authorize(
  request: Request,
  operation: keyof typeof OPERATION_AUTH,
  networkId?: string,
): Caller | Response {
  const c = caller(request)
  if (c instanceof Response) return c
  const rule = OPERATION_AUTH[operation]
  const global = c.me.global.permissions as string[]
  let allowed = global.includes(rule.key)
  if (!allowed && rule.scope === "network" && networkId !== undefined) {
    const n = c.me.networks.find((x) => String(x.id) === networkId || x.slug === networkId)
    allowed = (n?.permissions as string[] | undefined)?.includes(rule.key) ?? false
  }
  if (!allowed)
    return apiError(403, "PERMISSION_MISSING", `missing ${rule.key}`, { permission: rule.key })
  if (rule.sudo && nowSec() - c.authTime > STEP_UP_MAX_AGE) {
    return apiError(403, "AUTH_STEP_UP_REQUIRED", "re-authenticate", { max_age: STEP_UP_MAX_AGE })
  }
  return c
}

// ---- pagination (backend 7.0) ----------------------------------------------------------------

function paginate<T>(
  items: T[],
  url: URL,
  sorters: Record<string, (a: T, b: T) => number>,
  defaultSort: string,
) {
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 200)
  const sort = url.searchParams.get("sort") ?? defaultSort
  const [field = "", dir = "asc"] = sort.split(":")
  const cmp = sorters[field]
  const sorted = cmp ? [...items].sort((a, b) => (dir === "desc" ? -cmp(a, b) : cmp(a, b))) : items
  const offset = Number(atob(url.searchParams.get("cursor") ?? "") || 0) || 0
  const page = sorted.slice(offset, offset + limit)
  return {
    items: page,
    next_cursor: offset + limit < sorted.length ? btoa(String(offset + limit)) : null,
    prev_cursor: offset > 0 ? btoa(String(Math.max(offset - limit, 0))) : null,
    total: sorted.length > 10_000 ? null : sorted.length,
  }
}

const byString =
  <T>(get: (x: T) => string | null) =>
  (a: T, b: T) =>
    (get(a) ?? "").localeCompare(get(b) ?? "")

// ---- handlers --------------------------------------------------------------------------------

export function createHandlers(apiUrl: string, options: { latency?: boolean } = {}): HttpHandler[] {
  const http = createOpenApiHttp<paths>({ baseUrl: apiUrl })
  const wait = () => (options.latency ? delay(120 + Math.random() * 200) : Promise.resolve())

  // In-memory mutations for the session (bans), layered over the fixtures.
  const bans = new Map<string, S["Ban"] | null>()
  /** Entries written by this session's mutations, newest first, shown above the fixtures. */
  const written: S["AuditEntry"][] = []
  const record = (
    c: Caller,
    action: string,
    target: S["DashUser"] | undefined,
    after: S["AuditEntry"]["after"],
    before: S["AuditEntry"]["before"] = null,
  ) => {
    written.unshift({
      id: `aud_live_${String(written.length + 1)}`,
      at: new Date().toISOString(),
      action,
      severity: action === "user.ban" ? "warn" : "info",
      actor: { id: c.persona.userId, display_name: c.persona.name, username: c.persona.username },
      target_type: "user",
      target_id: target?.id ?? null,
      target_label: target?.display_name ?? null,
      network_id: null,
      ip_prefix: "127.0.0.0/24",
      request_id: `req_live_${String(written.length + 1)}`,
      before,
      after,
    })
  }
  const userWithState = (u: S["DashUser"]): S["DashUser"] => {
    if (!bans.has(u.id)) return u
    const ban = bans.get(u.id) ?? null
    return { ...u, ban, status: ban ? "banned" : u.status === "banned" ? "active" : u.status }
  }

  return [
    // OAuth (RFC shapes, no envelope). The refresh "cookie" is the mock session.
    rawHttp.post(`${apiUrl}/v1/oauth/token`, async ({ request }) => {
      await wait()
      const body = new URLSearchParams(await request.text())
      const grant = body.get("grant_type")
      let session = mockSession.get()
      if (grant === "authorization_code") {
        const code = mockSession.takeCode(body.get("code") ?? "")
        const verifier = body.get("code_verifier") ?? ""
        if (
          !code ||
          code.redirectUri !== body.get("redirect_uri") ||
          (await challengeS256(verifier)) !== code.challenge
        ) {
          return HttpResponse.json({ error: "invalid_grant" }, { status: 400 })
        }
        session = {
          persona: code.persona,
          authTime: code.authTime,
          sid: `sid_${randomBase64Url(8)}`,
        }
        mockSession.set(session)
      } else if (grant !== "refresh_token" || !session) {
        return HttpResponse.json({ error: "invalid_grant" }, { status: 400 })
      }
      const iat = nowSec()
      return HttpResponse.json({
        access_token: jwt({
          iss: apiUrl,
          sub: `persona:${session.persona}`,
          aud: body.get("client_id"),
          scope: "openid profile email offline_access dash",
          sid: session.sid,
          auth_time: session.authTime,
          amr: ["otp"],
          iat,
          exp: iat + ACCESS_TTL,
        }),
        token_type: "Bearer",
        expires_in: ACCESS_TTL,
        scope: "openid profile email offline_access dash",
      })
    }),
    rawHttp.post(`${apiUrl}/v1/oauth/revoke`, async () => {
      await wait()
      mockSession.set(null)
      return new HttpResponse(null, { status: 200 })
    }),

    http.get("/v1/me", async ({ request, response }) => {
      await wait()
      const c = caller(request)
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: c.me })
    }),
    http.patch("/v1/me", async ({ request, response }) => {
      const c = caller(request)
      if (c instanceof Response) return c
      const body = await request.json()
      return response(200).json({ ok: true, data: { ...c.me.user, ...body } })
    }),

    http.get("/v1/dash/overview", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/overview")
      if (c instanceof Response) return c
      return response(200).json({
        ok: true,
        data: {
          kpis: {
            active_vehicles: 509,
            networks_live: 2,
            networks_total: NETWORKS.length,
            users_total: USERS.length,
            signups_7d: 23,
            active_sessions_24h: 61,
            open_issues: 7,
          },
          recent_events: AUDIT.slice(0, 8),
        },
      })
    }),
    http.get("/v1/dash/system/health", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/system/health")
      if (c instanceof Response) return c
      return response(200).json({
        ok: true,
        data: {
          version: "0.1.0-mock",
          git_sha: "mock000",
          mode: "all",
          uptime_s: 3 * 86_400 + 5 * 3600,
          checks: [
            { key: "event_loop_lag_p95", status: "ok", value: "4 ms", threshold: "50 ms" },
            { key: "core_db", status: "ok", value: "212 MB (WAL 3 MB)", threshold: "WAL 64 MB" },
            { key: "vts_db", status: "warn", value: "6.8 GB (WAL 81 MB)", threshold: "WAL 64 MB" },
            { key: "disk_free", status: "ok", value: "61 GB", threshold: "10 GB" },
            { key: "backup_age", status: "ok", value: "4 min", threshold: "15 min" },
            {
              key: "archive_export",
              status: "ok",
              value: "2026-10-21, 1.9 M rows",
              threshold: "daily",
            },
            {
              key: "email_provider",
              status: "ok",
              value: "last send ok",
              threshold: "bounce < 5 %",
            },
          ],
        },
      })
    }),

    http.get("/v1/dash/networks", async ({ request, response }) => {
      await wait()
      const c = caller(request)
      if (c instanceof Response) return c
      const all = (c.me.global.permissions as string[]).includes("networks.read.all")
      const visible = all
        ? NETWORKS
        : NETWORKS.filter((n) => c.me.networks.some((m) => m.id === n.id))
      return response(200).json({
        ok: true,
        data: paginate(
          visible,
          new URL(request.url),
          { name: byString((n) => n.name) },
          "name:asc",
        ),
      })
    }),
    http.get("/v1/dash/networks/{networkId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}", params.networkId)
      if (c instanceof Response) return c
      const n = NETWORKS.find(
        (x) => x.slug === params.networkId || String(x.id) === params.networkId,
      )
      if (!n) return response(404).json(errorBody("NOT_FOUND", "network not found"))
      return response(200).json({ ok: true, data: n })
    }),
    http.get("/v1/dash/networks/{networkId}/overview", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/overview", params.networkId)
      if (c instanceof Response) return c
      const n = NETWORKS.find(
        (x) => x.slug === params.networkId || String(x.id) === params.networkId,
      )
      if (!n) return response(404).json(errorBody("NOT_FOUND", "network not found"))
      const live = n.binding_count > 0
      return response(200).json({
        ok: true,
        data: {
          network: n,
          kpis: {
            vehicles_now: live ? (n.id === 4 ? 412 : 97) : null,
            routes_running: live ? (n.id === 4 ? 138 : 41) : null,
            median_feed_lag_s: live ? 14 : null,
            quality_score: live ? (n.id === 4 ? 92 : 78) : null,
            open_issues: n.id === 4 ? 4 : 3,
          },
        },
      })
    }),

    http.get("/v1/dash/users", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users")
      if (c instanceof Response) return c
      const q = (query.get("q") ?? "").toLowerCase()
      const status = query.get("status")
      const items = USERS.map(userWithState)
        .filter((u) => !status || u.status === status)
        .filter(
          (u) =>
            !q ||
            [u.id, u.display_name, u.username ?? "", u.email_masked].some((v) =>
              v.toLowerCase().includes(q),
            ),
        )
        .map(toListItem)
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          new URL(request.url),
          {
            created_at: byString((u) => u.created_at),
            last_active_at: byString((u) => u.last_active_at),
            display_name: byString((u) => u.display_name),
          },
          "created_at:desc",
        ),
      })
    }),
    http.get("/v1/dash/users/{userId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users/{userId}")
      if (c instanceof Response) return c
      const u = USERS.find((x) => x.id === params.userId)
      if (!u) return response(404).json(errorBody("NOT_FOUND", "user not found"))
      return response(200).json({ ok: true, data: userWithState(u) })
    }),
    http.post("/v1/dash/users/{userId}/reveal-email", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/reveal-email")
      if (c instanceof Response) return c
      const u = USERS.find((x) => x.id === params.userId)
      if (!u) return response(404).json(errorBody("NOT_FOUND", "user not found"))
      const p = findPersona(PERSONAS_BY_USER.get(u.id))
      const email = p?.email ?? `${u.display_name.toLowerCase().replace(/\s+/g, ".")}@example.com`
      return response(200).json({ ok: true, data: { email } })
    }),
    http.post("/v1/dash/users/{userId}/ban", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/ban")
      if (c instanceof Response) return c
      if (params.userId === c.persona.userId)
        return response(403).json(errorBody("ROLE_LEVEL_TOO_LOW", "cannot ban yourself"))
      const body = await request.json()
      const days = { "1d": 1, "7d": 7, "30d": 30, permanent: null }[body.duration]
      const ban: S["Ban"] = {
        public_reason: body.public_reason,
        private_reason: body.private_reason ?? null,
        until: days === null ? null : new Date(Date.now() + days * 86_400_000).toISOString(),
        created_at: new Date().toISOString(),
        created_by: {
          id: c.persona.userId,
          display_name: c.persona.name,
          username: c.persona.username,
        },
      }
      bans.set(params.userId, ban)
      record(
        c,
        "user.ban",
        USERS.find((u) => u.id === params.userId),
        { status: "banned", duration: body.duration, public_reason: body.public_reason },
        { status: "active" },
      )
      return response(200).json({ ok: true, data: ban })
    }),
    http.post("/v1/dash/users/{userId}/unban", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/unban")
      if (c instanceof Response) return c
      bans.set(params.userId, null)
      record(
        c,
        "user.unban",
        USERS.find((u) => u.id === params.userId),
        { status: "active" },
        {
          status: "banned",
        },
      )
      return response(200).json({ ok: true, data: { unbanned: true } })
    }),

    http.get("/v1/dash/roles", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/roles")
      if (c instanceof Response) return c
      const data = Object.entries(ROLES).map(([key, r]) => ({
        ...r,
        permission_count: ROLE_PERMISSIONS[key as keyof typeof ROLES].length,
        member_count: USERS.filter((u) => u.roles.some((x) => x.role.key === key)).length,
      }))
      return response(200).json({ ok: true, data })
    }),

    http.get("/v1/dash/audit", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/audit")
      if (c instanceof Response) return c
      const action = query.get("action")
      const q = (query.get("q") ?? "").toLowerCase()
      const targetId = query.get("target_id")
      const targetType = query.get("target_type")
      const items = [...written, ...AUDIT]
        .filter((e) => !action || e.action.startsWith(action))
        .filter((e) => !targetId || e.target_id === targetId)
        .filter((e) => !targetType || e.target_type === targetType)
        .filter(
          (e) =>
            !q ||
            [e.action, e.actor?.display_name ?? "", e.target_label ?? "", e.request_id ?? ""].some(
              (v) => v.toLowerCase().includes(q),
            ),
        )
      return response(200).json({
        ok: true,
        data: paginate(items, new URL(request.url), { at: byString((e) => e.at) }, "at:desc"),
      })
    }),
  ]
}

const PERSONAS_BY_USER = new Map(
  ["founder", "network-admin", "analyst", "moderator"].map((id) => [
    findPersona(id)?.userId ?? "",
    id,
  ]),
)
