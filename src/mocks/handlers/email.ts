import type { HttpHandler } from "msw"
import { randomBase64Url } from "@/auth/pkce"
import { EMAIL_TEMPLATES, maskEmail, personaEmail, renderTemplate } from "../fixtures-admin"
import { byString, errorBody, matches, paginate, type Ctx } from "./context"

/** Email templates, previews, deliveries, suppressions, test sends; and the moderation log. */
export function emailHandlers(ctx: Ctx): HttpHandler[] {
  const { http, db, wait, authorize, record, holds } = ctx
  return [
    http.get("/v1/dash/email/templates", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/email/templates")
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: EMAIL_TEMPLATES })
    }),
    http.post("/v1/dash/email/templates/{key}/preview", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/email/templates/{key}/preview")
      if (c instanceof Response) return c
      if (!EMAIL_TEMPLATES.some((t) => t.key === params.key))
        return response(404).json(errorBody("NOT_FOUND", "template not found"))
      const body = await request.json()
      return response(200).json({
        ok: true,
        data: renderTemplate(params.key, body.locale, body.variables),
      })
    }),
    http.get("/v1/dash/email/deliveries", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/email/deliveries")
      if (c instanceof Response) return c
      const status = query.get("status")
      const template = query.get("template")
      const q = query.get("q")
      const items = db.deliveries
        .filter((d) => !status || d.status === status)
        .filter((d) => !template || d.template === template)
        .filter((d) => matches(q, d.to_masked, d.subject, d.user?.display_name, d.id))
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          new URL(request.url),
          { created_at: byString((d) => d.created_at) },
          "created_at:desc",
        ),
      })
    }),
    http.get("/v1/dash/email/suppressions", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/email/suppressions")
      if (c instanceof Response) return c
      const q = query.get("q")
      const items = db.suppressions.filter((s) => matches(q, s.email_masked))
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          new URL(request.url),
          { created_at: byString((s) => s.created_at) },
          "created_at:desc",
        ),
      })
    }),
    http.delete("/v1/dash/email/suppressions/{id}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "DELETE /v1/dash/email/suppressions/{id}")
      if (c instanceof Response) return c
      const i = db.suppressions.findIndex((s) => s.id === params.id)
      if (i < 0) return response(404).json(errorBody("NOT_FOUND", "suppression not found"))
      const body = await request.json()
      const [removed] = db.suppressions.splice(i, 1)
      record(
        c,
        "email.suppression.delete",
        { type: "email", id: params.id, label: removed?.email_masked ?? null },
        {
          before: { reason: removed?.reason ?? null },
          after: { reason: body.reason },
        },
      )
      return response(200).json({ ok: true, data: { deleted: true } })
    }),
    http.post("/v1/dash/email/test", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/email/test")
      if (c instanceof Response) return c
      const body = await request.json()
      if (body.to && !holds(c, "email.test.send.any"))
        return response(403).json(
          errorBody("PERMISSION_MISSING", "missing email.test.send.any", {
            permission: "email.test.send.any",
          }),
        )
      const tpl = EMAIL_TEMPLATES.find((t) => t.key === body.template)
      if (!tpl) return response(404).json(errorBody("NOT_FOUND", "template not found"))
      const to = body.to ?? personaEmail(c.persona.userId) ?? "unknown@example.com"
      const now = new Date().toISOString()
      const id = `eml_test_${randomBase64Url(4)}`
      const vars = Object.fromEntries(tpl.variables.map((v) => [v.name, v.example]))
      db.deliveries.unshift({
        id,
        template: tpl.key,
        subject: `[TEST] ${renderTemplate(tpl.key, body.locale, vars).subject}`,
        to_masked: maskEmail(to),
        locale: body.locale,
        status: "delivered",
        user: body.to ? null : c.ref,
        created_at: now,
        updated_at: now,
      })
      if (body.to)
        record(
          c,
          "email.test.send_any",
          { type: "email", id, label: maskEmail(to) },
          {
            after: { template: tpl.key, locale: body.locale },
          },
        )
      return response(200).json({ ok: true, data: { delivery_id: id, to_masked: maskEmail(to) } })
    }),

    http.get("/v1/dash/moderation", async ({ request, query, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/moderation")
      if (c instanceof Response) return c
      const action = query.get("action")
      const active = query.get("active") === "true"
      const q = query.get("q")
      const items = db.moderation
        .filter((m) => !action || m.action === action)
        .filter((m) => !active || (m.action === "ban" && m.active))
        .filter((m) => matches(q, m.user.display_name, m.user.username, m.public_reason))
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          new URL(request.url),
          { at: byString((m) => m.at), until: byString((m) => m.until ?? "9999") },
          "at:desc",
        ),
      })
    }),
  ]
}
