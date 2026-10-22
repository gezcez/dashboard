import { http as rawHttp, HttpResponse, type HttpHandler } from "msw"
import { challengeS256, randomBase64Url } from "@/auth/pkce"
import { toListItem } from "../fixtures"
import { mockSession } from "../session"
import {
  ACCESS_TTL,
  byString,
  errorBody,
  jwt,
  matches,
  nowSec,
  paginate,
  type Ctx,
} from "./context"

/** OAuth token/revoke (RFC shapes), me, overview, health, networks and audit. */
export function coreHandlers(ctx: Ctx): HttpHandler[] {
  const { apiUrl, http, db, wait, caller, authorize } = ctx
  return [
    // The refresh "cookie" is the mock session in localStorage.
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
            networks_total: db.networkList.length,
            users_total: db.users.length,
            signups_7d: 23,
            active_sessions_24h: 61,
            open_issues: 7,
          },
          recent_events: db.audit.slice(0, 8),
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
        ? db.networkList
        : db.networkList.filter((n) => c.me.networks.some((m) => m.id === n.id))
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
      const n = ctx.network(params.networkId)
      if (!n) return response(404).json(errorBody("NOT_FOUND", "network not found"))
      return response(200).json({ ok: true, data: n })
    }),
    http.get("/v1/dash/networks/{networkId}/overview", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/overview", params.networkId)
      if (c instanceof Response) return c
      const n = ctx.network(params.networkId)
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

    http.get("/v1/dash/audit", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/audit")
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: auditPage(ctx, request) })
    }),
    http.get("/v1/dash/networks/{networkId}/audit", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/audit", params.networkId)
      if (c instanceof Response) return c
      const n = ctx.network(params.networkId)
      if (!n) return response(404).json(errorBody("NOT_FOUND", "network not found"))
      return response(200).json({ ok: true, data: auditPage(ctx, request, n.id) })
    }),

    http.get("/v1/dash/users", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users")
      if (c instanceof Response) return c
      const q = query.get("q")
      const status = query.get("status")
      const role = query.get("role")
      const networkId = query.get("network_id")
      const items = db.users
        .filter((u) => !status || u.status === status)
        .filter((u) => !role || u.roles.some((a) => a.role.key === role))
        .filter((u) => !networkId || u.roles.some((a) => String(a.network?.id) === networkId))
        .filter((u) => matches(q, u.id, u.display_name, u.username, u.email_masked))
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
  ]
}

function auditPage(ctx: Ctx, request: Request, networkId?: number) {
  const query = new URL(request.url).searchParams
  const action = query.get("action")
  const q = query.get("q")
  const targetId = query.get("target_id")
  const targetType = query.get("target_type")
  const actor = query.get("actor")
  const items = ctx.db.audit
    .filter((e) => networkId === undefined || e.network_id === networkId)
    .filter((e) => !action || e.action.startsWith(action))
    .filter((e) => !targetId || e.target_id === targetId)
    .filter((e) => !targetType || e.target_type === targetType)
    .filter((e) => !actor || e.actor?.id === actor)
    .filter((e) => matches(q, e.action, e.actor?.display_name, e.target_label, e.request_id))
  return paginate(items, new URL(request.url), { at: byString((e) => e.at) }, "at:desc")
}
