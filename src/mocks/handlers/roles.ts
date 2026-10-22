import type { HttpHandler } from "msw"
import { PERMISSION_KEYS, type PermissionKey } from "@/api/permission-keys.gen"
import type { components } from "@/api/schema.gen"
import { permissionInfo, routesFor } from "../fixtures-admin"
import { applyRoleOp } from "./users"
import { byNumber, byString, errorBody, matches, paginate, type Ctx } from "./context"

type S = components["schemas"]

/** Roles, permission matrix, permission registry and network members. */
export function roleHandlers(ctx: Ctx): HttpHandler[] {
  const { http, db, wait, authorize, record, holds } = ctx

  const roleDetail = (id: number): S["RoleDetail"] | null => {
    const r = db.role(id)
    if (!r) return null
    const counts = new Map<string, { network: S["NetworkRef"] | null; count: number }>()
    for (const u of db.users)
      for (const a of u.roles)
        if (a.role.id === id) {
          const k = String(a.network?.id ?? "global")
          counts.set(k, { network: a.network, count: (counts.get(k)?.count ?? 0) + 1 })
        }
    return {
      ...db.toRole(r),
      permissions: r.key === "root" ? [...PERMISSION_KEYS] : [...r.permissions].sort(),
      members_by_network: [...counts.values()],
      created_at: r.created_at,
      updated_at: r.updated_at,
    }
  }

  return [
    http.get("/v1/dash/roles", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/roles")
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: db.roles.map((r) => db.toRole(r)) })
    }),
    http.post("/v1/dash/roles", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/roles")
      if (c instanceof Response) return c
      const body = await request.json()
      if (db.roles.some((r) => r.key === body.key))
        return response(409).json(
          errorBody("CONFLICT", "role key exists", { fields: { key: "taken" } }),
        )
      if (!ctx.isRoot(c) && db.levelOf(c.persona.userId, null) <= body.level)
        return response(403).json(errorBody("ROLE_LEVEL_TOO_LOW", "level must be below yours"))
      const now = new Date().toISOString()
      const role = {
        id: Math.max(...db.roles.map((r) => r.id)) + 1,
        key: body.key,
        name: body.name,
        description: body.description,
        level: body.level,
        immutable: false,
        permissions: [] as PermissionKey[],
        created_at: now,
        updated_at: now,
      }
      db.roles.push(role)
      record(
        c,
        "role.create",
        { type: "role", id: String(role.id), label: role.name },
        {
          after: { key: role.key, name: role.name, level: role.level },
        },
      )
      return response(200).json({ ok: true, data: db.toRole(role) })
    }),
    http.get("/v1/dash/roles/{roleId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/roles/{roleId}")
      if (c instanceof Response) return c
      const r = roleDetail(Number(params.roleId))
      if (!r) return response(404).json(errorBody("NOT_FOUND", "role not found"))
      return response(200).json({ ok: true, data: r })
    }),
    http.patch("/v1/dash/roles/{roleId}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "PATCH /v1/dash/roles/{roleId}")
      if (c instanceof Response) return c
      const r = db.role(Number(params.roleId))
      if (!r) return response(404).json(errorBody("NOT_FOUND", "role not found"))
      if (r.immutable) return response(403).json(errorBody("ROLE_IMMUTABLE", "built-in role"))
      const body = await request.json()
      if (
        body.level !== undefined &&
        !ctx.isRoot(c) &&
        db.levelOf(c.persona.userId, null) <= body.level
      )
        return response(403).json(errorBody("ROLE_LEVEL_TOO_LOW", "level must be below yours"))
      const before = { name: r.name, description: r.description, level: r.level }
      Object.assign(r, body, { updated_at: new Date().toISOString() })
      record(
        c,
        "role.update",
        { type: "role", id: String(r.id), label: r.name },
        {
          before,
          after: { name: r.name, description: r.description, level: r.level },
        },
      )
      return response(200).json({ ok: true, data: db.toRole(r) })
    }),
    http.get("/v1/dash/roles/permission-matrix", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/roles/permission-matrix")
      if (c instanceof Response) return c
      return response(200).json({
        ok: true,
        data: {
          roles: db.roles.map((r) => db.toRole(r)),
          permissions: PERMISSION_KEYS.map(permissionInfo),
          grants: db.roles.map((r) => ({
            role_id: r.id,
            permissions: r.key === "root" ? [...PERMISSION_KEYS] : [...r.permissions],
          })),
        },
      })
    }),
    http.post("/v1/dash/roles/permissions:batch", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/roles/permissions:batch")
      if (c instanceof Response) return c
      const body = await request.json()
      const results = body.operations.map((op) => {
        const r = db.role(op.role_id)
        if (!r) return { ...op, ok: false, error_code: "NOT_FOUND" as const }
        if (r.immutable) return { ...op, ok: false, error_code: "ROLE_IMMUTABLE" as const }
        // No granting what you don't hold yourself (backend 6.4).
        if (op.op === "grant" && !holds(c, op.permission_key))
          return { ...op, ok: false, error_code: "PERMISSION_MISSING" as const }
        const had = r.permissions.includes(op.permission_key)
        if (op.op === "grant" && !had) r.permissions.push(op.permission_key)
        if (op.op === "revoke" && had)
          r.permissions = r.permissions.filter((k) => k !== op.permission_key)
        r.updated_at = new Date().toISOString()
        return { ...op, ok: true, error_code: null }
      })
      const done = results.filter((r) => r.ok)
      if (done.length > 0)
        record(
          c,
          "role.permissions.update",
          { type: "role", id: null, label: `${String(done.length)} changes` },
          {
            after: {
              added: done
                .filter((r) => r.op === "grant")
                .map((r) => `${String(r.role_id)}:${r.permission_key}`),
              removed: done
                .filter((r) => r.op === "revoke")
                .map((r) => `${String(r.role_id)}:${r.permission_key}`),
            },
          },
          { severity: "warn" },
        )
      return response(200).json({ ok: true, data: { results } })
    }),

    http.get("/v1/dash/permissions", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/permissions")
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: PERMISSION_KEYS.map(permissionInfo) })
    }),
    http.get("/v1/dash/permissions/registry", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/permissions/registry")
      if (c instanceof Response) return c
      const boot = new Date(Date.now() - 3 * 3600_000).toISOString()
      const live: S["PermissionRegistryEntry"][] = PERMISSION_KEYS.map((key) => {
        const info = permissionInfo(key)
        return {
          ...info,
          routes: routesFor(key),
          roles: db.roles
            .filter((r) => r.key === "root" || r.permissions.includes(key))
            .map((r) => db.roleRef(r)),
          first_registered_at: db.roles[0]!.created_at,
          last_seen_at: boot,
          orphaned_at: null,
        }
      })
      const orphans: S["PermissionRegistryEntry"][] = db.orphans.map((o) => ({
        ...o,
        scope: "global",
        sudo: false,
        routes: [],
        roles: db.roles.filter((r) => r.key === "admin").map((r) => db.roleRef(r)),
      }))
      return response(200).json({ ok: true, data: [...live, ...orphans] })
    }),
    http.delete("/v1/dash/permissions/{key}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "DELETE /v1/dash/permissions/{key}")
      if (c instanceof Response) return c
      const i = db.orphans.findIndex((o) => o.key === params.key)
      if (i < 0)
        return response(409).json(errorBody("CONFLICT", "only orphaned keys can be deleted"))
      db.orphans.splice(i, 1)
      record(
        c,
        "permission.delete",
        { type: "permission", id: params.key, label: params.key },
        {},
        { severity: "warn" },
      )
      return response(200).json({ ok: true, data: { deleted: true } })
    }),

    // ---- members ------------------------------------------------------------------------------
    http.get(
      "/v1/dash/networks/{networkId}/members",
      async ({ request, params, query, response }) => {
        await wait()
        const c = authorize(request, "GET /v1/dash/networks/{networkId}/members", params.networkId)
        if (c instanceof Response) return c
        const n = ctx.network(params.networkId)
        if (!n) return response(404).json(errorBody("NOT_FOUND", "network not found"))
        const role = query.get("role")
        const q = query.get("q")
        const items: S["Member"][] = db.users
          .filter((u) => u.roles.some((a) => a.network?.id === n.id))
          .filter((u) => matches(q, u.display_name, u.username))
          .map((u) => ({
            user: { id: u.id, display_name: u.display_name, username: u.username },
            email_masked: u.email_masked,
            last_active_at: u.last_active_at,
            roles: u.roles
              .filter((a) => a.network?.id === n.id)
              .map((a) => ({ role: a.role, granted_at: a.granted_at, granted_by: a.granted_by })),
          }))
          .filter((m) => !role || m.roles.some((r) => r.role.key === role))
        return response(200).json({
          ok: true,
          data: paginate(
            items,
            new URL(request.url),
            {
              display_name: byString((m) => m.user.display_name),
              level: byNumber((m) => Math.max(...m.roles.map((r) => r.role.level))),
            },
            "level:desc",
          ),
        })
      },
    ),
    http.get(
      "/v1/dash/networks/{networkId}/members/candidates",
      async ({ request, params, query, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/members/candidates",
          params.networkId,
        )
        if (c instanceof Response) return c
        const q = (query.get("q") ?? "").toLowerCase().replace(/^@/, "")
        if (q.length < 2) return response(200).json({ ok: true, data: [] })
        const data = db.users
          .filter((u) => u.status === "active" && (u.username ?? "").startsWith(q))
          .slice(0, 8)
          .map((u) => ({ id: u.id, display_name: u.display_name, username: u.username }))
        return response(200).json({ ok: true, data })
      },
    ),
    http.get(
      "/v1/dash/networks/{networkId}/members/assignable-roles",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/members/assignable-roles",
          params.networkId,
        )
        if (c instanceof Response) return c
        const n = ctx.network(params.networkId)
        if (!n) return response(404).json(errorBody("NOT_FOUND", "network not found"))
        const mine = ctx.isRoot(c) ? 101 : db.levelOf(c.persona.userId, n.id)
        const data = db.roles
          .filter(
            (r) => r.level < mine && r.key !== "root" && r.key !== "admin" && r.key !== "moderator",
          )
          .sort((a, b) => b.level - a.level)
          .map((r) => db.roleRef(r))
        return response(200).json({ ok: true, data })
      },
    ),
    http.post(
      "/v1/dash/networks/{networkId}/members/{userId}/roles",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "POST /v1/dash/networks/{networkId}/members/{userId}/roles",
          params.networkId,
        )
        if (c instanceof Response) return c
        const n = ctx.network(params.networkId)
        const u = db.user(params.userId)
        if (!n || !u) return response(404).json(errorBody("NOT_FOUND", "not found"))
        const body = await request.json()
        const results = body.operations.map((op) => ({
          ...op,
          ...applyRoleOp(ctx, c, u, op.role_id, op.op, n.id),
        }))
        return response(200).json({ ok: true, data: { results } })
      },
    ),
  ]
}
