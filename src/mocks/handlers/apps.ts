import type { HttpHandler } from "msw"
import type { components } from "@/api/schema.gen"
import { randomBase64Url } from "@/auth/pkce"
import { checkRedirectUris } from "@/lib/redirect-uris"
import { SCOPES, toAppListItem } from "../fixtures-admin"
import { byNumber, byString, errorBody, matches, paginate, type Ctx } from "./context"

type S = components["schemas"]

const GRACE_MS = { none: 0, "24h": 86_400_000, "7d": 7 * 86_400_000 } as const

export function appHandlers(ctx: Ctx): HttpHandler[] {
  const { http, db, wait, authorize, record } = ctx
  const find = (id: string) => db.apps.find((a) => a.client_id === id)
  const target = (a: S["AppDetail"]) => ({ type: "app", id: a.client_id, label: a.name })
  const invalidUris = (uris: string[], platform: S["AppPlatform"]) => {
    const bad = checkRedirectUris(uris, platform).filter((c) => c.problem)
    return bad.length
      ? errorBody("VALIDATION_FAILED", "invalid redirect URIs", {
          fields: { redirect_uris: bad.map((b) => `${b.uri}: ${b.problem ?? ""}`).join("; ") },
        })
      : null
  }
  const newSecret = () => `gzs_${randomBase64Url(24)}`

  return [
    http.get("/v1/oauth/scopes", async ({ response }) => {
      await wait()
      return response(200).json({ ok: true, data: SCOPES })
    }),
    http.get("/v1/dash/apps", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/apps")
      if (c instanceof Response) return c
      const q = query.get("q")
      const items = db.apps.filter((a) => matches(q, a.client_id, a.name)).map(toAppListItem)
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          new URL(request.url),
          {
            name: byString((a) => a.name),
            tokens_24h: byNumber((a) => a.tokens_24h),
            created_at: byString((a) => a.created_at),
          },
          "created_at:asc",
        ),
      })
    }),
    http.post("/v1/dash/apps", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/apps")
      if (c instanceof Response) return c
      const body = await request.json()
      const invalid = invalidUris(body.redirect_uris, body.platform)
      if (invalid) return response(400).json(invalid)
      const base = body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      const clientId = find(base) ? `${base}-${randomBase64Url(3).toLowerCase()}` : base
      const now = new Date().toISOString()
      const secret = body.type === "confidential" ? newSecret() : null
      const app: S["AppDetail"] = {
        client_id: clientId,
        name: body.name,
        description: body.description,
        logo_url: null,
        homepage_url: body.homepage_url,
        type: body.type,
        platform: body.platform,
        first_party: false,
        system: false,
        redirect_uris: body.redirect_uris,
        scopes: ["openid", "profile"],
        access_ttl_s: 900,
        refresh_ttl_s: (body.platform === "native" ? 90 : 30) * 86_400,
        refresh_max_s: 180 * 86_400,
        secrets: secret
          ? [
              {
                id: `sec_${randomBase64Url(4)}`,
                prefix: secret.slice(0, 8),
                state: "current",
                created_at: now,
                last_used_at: null,
                expires_at: null,
              },
            ]
          : [],
        active_families: 0,
        tokens_24h: 0,
        usage: [],
        created_at: now,
        updated_at: now,
      }
      db.apps.push(app)
      record(c, "app.create", target(app), { after: { name: app.name, type: app.type } })
      return response(200).json({ ok: true, data: { app, secret } })
    }),
    http.get("/v1/dash/apps/{appId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/apps/{appId}")
      if (c instanceof Response) return c
      const a = find(params.appId)
      if (!a) return response(404).json(errorBody("NOT_FOUND", "app not found"))
      return response(200).json({ ok: true, data: a })
    }),
    http.patch("/v1/dash/apps/{appId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "PATCH /v1/dash/apps/{appId}")
      if (c instanceof Response) return c
      const a = find(params.appId)
      if (!a) return response(404).json(errorBody("NOT_FOUND", "app not found"))
      const body = await request.json()
      // Backend 6.2: redirect URIs and the first-party toggle additionally need sudo.
      if ((body.redirect_uris !== undefined || body.first_party !== undefined) && !ctx.fresh(c))
        return ctx.stepUpError()
      if (body.redirect_uris) {
        const invalid = invalidUris(body.redirect_uris, a.platform)
        if (invalid) return response(400).json(invalid)
      }
      const before: Record<string, unknown> = {}
      for (const k of Object.keys(body)) before[k] = a[k as keyof S["AppDetail"]]
      Object.assign(a, body, { updated_at: new Date().toISOString() })
      record(
        c,
        "app.update",
        target(a),
        { before, after: { ...body } },
        {
          severity: body.first_party !== undefined ? "critical" : "warn",
        },
      )
      return response(200).json({ ok: true, data: a })
    }),
    http.post("/v1/dash/apps/{appId}/secret", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/apps/{appId}/secret")
      if (c instanceof Response) return c
      const a = find(params.appId)
      if (!a) return response(404).json(errorBody("NOT_FOUND", "app not found"))
      if (a.type !== "confidential")
        return response(409).json(errorBody("CONFLICT", "public clients have no secret"))
      const body = await request.json()
      const now = Date.now()
      const secret = newSecret()
      const current = a.secrets.find((s) => s.state === "current")
      const grace = GRACE_MS[body.grace]
      // The backend keeps at most two: the new current one and, during grace, the previous.
      a.secrets = [
        {
          id: `sec_${randomBase64Url(4)}`,
          prefix: secret.slice(0, 8),
          state: "current",
          created_at: new Date(now).toISOString(),
          last_used_at: null,
          expires_at: null,
        },
        ...(current && grace > 0
          ? [
              {
                ...current,
                state: "previous" as const,
                expires_at: new Date(now + grace).toISOString(),
              },
            ]
          : []),
      ]
      record(
        c,
        "app.secret.rotate",
        target(a),
        { after: { grace: body.grace } },
        { severity: "critical" },
      )
      return response(200).json({ ok: true, data: { secret, meta: a.secrets[0]! } })
    }),
    http.delete("/v1/dash/apps/{appId}/secret/previous", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "DELETE /v1/dash/apps/{appId}/secret/previous")
      if (c instanceof Response) return c
      const a = find(params.appId)
      if (!a) return response(404).json(errorBody("NOT_FOUND", "app not found"))
      const had = a.secrets.some((s) => s.state === "previous")
      a.secrets = a.secrets.filter((s) => s.state !== "previous")
      if (had) record(c, "app.secret.revoke_previous", target(a), {}, { severity: "critical" })
      return response(200).json({ ok: true, data: { revoked: had } })
    }),
    http.post("/v1/dash/apps/{appId}/revoke-all", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/apps/{appId}/revoke-all")
      if (c instanceof Response) return c
      const a = find(params.appId)
      if (!a) return response(404).json(errorBody("NOT_FOUND", "app not found"))
      const body = await request.json()
      const n = a.active_families
      a.active_families = 0
      record(
        c,
        "app.tokens.revoke_all",
        target(a),
        { after: { revoked: n, reason: body.reason } },
        { severity: "critical" },
      )
      return response(200).json({ ok: true, data: { revoked: n } })
    }),
  ]
}
