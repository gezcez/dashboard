import type { HttpHandler } from "msw"
import type { components } from "@/api/schema.gen"
import { privacyFor, personaEmail } from "../fixtures-admin"
import { byString, errorBody, paginate, type Ctx } from "./context"

type S = components["schemas"]

/** User detail and its tabs: sessions, emails, activity, privacy, moderation, global roles. */
export function userHandlers(ctx: Ctx): HttpHandler[] {
  const { http, db, wait, authorize, record } = ctx
  const notFound = () => errorBody("NOT_FOUND", "user not found")
  const label = (u: S["DashUser"]) => ({ type: "user", id: u.id, label: u.display_name })

  return [
    http.get("/v1/dash/users/{userId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users/{userId}")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      return response(200).json({ ok: true, data: u })
    }),
    http.post("/v1/dash/users/{userId}/reveal-email", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/reveal-email")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      const email =
        personaEmail(u.id) ?? `${u.display_name.toLowerCase().replace(/\s+/g, ".")}@example.com`
      record(c, "user.email.reveal", label(u))
      return response(200).json({ ok: true, data: { email } })
    }),

    http.post("/v1/dash/users/{userId}/ban", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/ban")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      if (u.id === c.persona.userId)
        return response(403).json(errorBody("ROLE_LEVEL_TOO_LOW", "cannot ban yourself"))
      const body = await request.json()
      const days = { "1d": 1, "7d": 7, "30d": 30, permanent: null }[body.duration]
      const ban: S["Ban"] = {
        public_reason: body.public_reason,
        private_reason: body.private_reason ?? null,
        until: days === null ? null : new Date(Date.now() + days * 86_400_000).toISOString(),
        created_at: new Date().toISOString(),
        created_by: c.ref,
      }
      const before = u.status
      u.ban = ban
      u.status = "banned"
      db.setSessions(u.id, [])
      db.moderation.unshift({
        id: `mod_live_${String(db.moderation.length)}`,
        action: "ban",
        user: { id: u.id, display_name: u.display_name, username: u.username },
        by: c.ref,
        public_reason: ban.public_reason,
        private_reason: ban.private_reason,
        until: ban.until,
        active: true,
        at: ban.created_at,
      })
      record(
        c,
        "user.ban",
        label(u),
        {
          before: { status: before },
          after: { status: "banned", duration: body.duration, public_reason: body.public_reason },
        },
        { severity: "warn" },
      )
      return response(200).json({ ok: true, data: ban })
    }),
    http.post("/v1/dash/users/{userId}/unban", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/unban")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      const body = await request.json()
      u.ban = null
      u.status = "active"
      for (const m of db.moderation) if (m.user.id === u.id) m.active = false
      db.moderation.unshift({
        id: `mod_live_${String(db.moderation.length)}`,
        action: "unban",
        user: { id: u.id, display_name: u.display_name, username: u.username },
        by: c.ref,
        public_reason: body.reason,
        private_reason: null,
        until: null,
        active: false,
        at: new Date().toISOString(),
      })
      record(c, "user.unban", label(u), {
        before: { status: "banned" },
        after: { status: "active", reason: body.reason },
      })
      return response(200).json({ ok: true, data: { unbanned: true } })
    }),

    http.get("/v1/dash/users/{userId}/sessions", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users/{userId}/sessions")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      return response(200).json({ ok: true, data: db.sessions(u.id) })
    }),
    http.delete(
      "/v1/dash/users/{userId}/sessions/{sessionId}",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(request, "DELETE /v1/dash/users/{userId}/sessions/{sessionId}")
        if (c instanceof Response) return c
        const u = db.user(params.userId)
        if (!u) return response(404).json(notFound())
        const body = await request.json()
        const list = db.sessions(u.id)
        const target = list.find((s) => s.id === params.sessionId)
        if (!target) return response(404).json(errorBody("NOT_FOUND", "session not found"))
        // Revoking an SSO session also ends the refresh families started from it (same suffix).
        const suffix = target.id.slice(4)
        const keep = list.filter((s) => s.id.slice(4) !== suffix)
        db.setSessions(u.id, keep)
        record(c, "user.session.revoke", label(u), {
          after: { session: target.id, device: target.device, reason: body.reason },
        })
        return response(200).json({ ok: true, data: { revoked: list.length - keep.length } })
      },
    ),
    http.post(
      "/v1/dash/users/{userId}/sessions/revoke-all",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(request, "POST /v1/dash/users/{userId}/sessions/revoke-all")
        if (c instanceof Response) return c
        const u = db.user(params.userId)
        if (!u) return response(404).json(notFound())
        const body = await request.json()
        const n = db.sessions(u.id).length
        db.setSessions(u.id, [])
        record(
          c,
          "user.session.revoke_all",
          label(u),
          { after: { revoked: n, reason: body.reason } },
          { severity: "warn" },
        )
        return response(200).json({ ok: true, data: { revoked: n } })
      },
    ),

    http.get("/v1/dash/users/{userId}/emails", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users/{userId}/emails")
      if (c instanceof Response) return c
      if (!db.user(params.userId)) return response(404).json(notFound())
      const items = db.deliveries.filter((d) => d.user?.id === params.userId)
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
    http.get("/v1/dash/users/{userId}/activity", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users/{userId}/activity")
      if (c instanceof Response) return c
      if (!db.user(params.userId)) return response(404).json(notFound())
      const items = db.audit.filter(
        (e) => e.actor?.id === params.userId || e.target_id === params.userId,
      )
      return response(200).json({
        ok: true,
        data: paginate(items, new URL(request.url), { at: byString((e) => e.at) }, "at:desc"),
      })
    }),
    http.get("/v1/dash/users/{userId}/privacy", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/users/{userId}/privacy")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      return response(200).json({ ok: true, data: privacyFor(u) })
    }),

    http.post("/v1/dash/users/{userId}/roles", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/users/{userId}/roles")
      if (c instanceof Response) return c
      const u = db.user(params.userId)
      if (!u) return response(404).json(notFound())
      const body = await request.json()
      const results = body.operations.map((op) => applyRoleOp(ctx, c, u, op.role_id, op.op, null))
      return response(200).json({
        ok: true,
        data: { results: results.map((r, i) => ({ ...body.operations[i]!, ...r })) },
      })
    }),
  ]
}

/**
 * Backend 6.4 assignment rules: nobody edits themselves; the executor's level in the scope must
 * be strictly above the role's level and the target's current level. Root bypasses.
 */
export function applyRoleOp(
  ctx: Ctx,
  c: Parameters<Ctx["record"]>[0],
  u: S["DashUser"],
  roleId: number,
  op: "grant" | "revoke",
  networkId: number | null,
): { ok: boolean; error_code: S["ErrorCode"] | null } {
  const { db } = ctx
  const role = db.role(roleId)
  if (!role) return { ok: false, error_code: "NOT_FOUND" }
  if (u.id === c.persona.userId) return { ok: false, error_code: "ROLE_LEVEL_TOO_LOW" }
  if (!ctx.isRoot(c)) {
    const mine = db.levelOf(c.persona.userId, networkId)
    if (mine <= role.level || mine <= db.levelOf(u.id, networkId))
      return { ok: false, error_code: "ROLE_LEVEL_TOO_LOW" }
  }
  const n = networkId === null ? null : ctx.network(String(networkId))
  const has = (a: S["RoleAssignment"]) =>
    a.role.id === roleId && (a.network?.id ?? null) === networkId
  if (op === "grant") {
    if (!u.roles.some(has))
      u.roles.push({
        network: n ? { id: n.id, slug: n.slug, name: n.name } : null,
        role: db.roleRef(role),
        granted_at: new Date().toISOString(),
        granted_by: c.ref,
      })
  } else {
    u.roles = u.roles.filter((a) => !has(a))
  }
  ctx.record(
    c,
    op === "grant" ? "role.grant" : "role.revoke",
    { type: "user", id: u.id, label: u.display_name },
    op === "grant"
      ? { after: { role: role.key, network: n?.slug ?? "global" } }
      : { before: { role: role.key, network: n?.slug ?? "global" } },
    { severity: op === "grant" ? "warn" : "info", networkId },
  )
  return { ok: true, error_code: null }
}
