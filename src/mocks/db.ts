import { PERMISSION_KEYS, type PermissionKey } from "@/api/permission-keys.gen"
import type { components } from "@/api/schema.gen"
import {
  APPS,
  DELIVERIES,
  MODERATION,
  ORPHANED_KEYS,
  SUPPRESSIONS,
  sessionsFor,
} from "./fixtures-admin"
import {
  AUDIT,
  FIXTURE_NOW,
  NETWORKS,
  ROLE_PERMISSIONS,
  ROLES,
  USERS,
  type Persona,
} from "./fixtures"

type S = components["schemas"]

export interface MockRole {
  id: number
  key: string
  name: string
  description: string
  level: number
  immutable: boolean
  permissions: PermissionKey[]
  created_at: string
  updated_at: string
}

const clone = <T>(value: T): T => structuredClone(value)

/**
 * The mock API's mutable state. One per handler set, so a page reload (new service worker
 * handlers) or a new test starts from the fixtures again.
 */
export function createDb() {
  const roles: MockRole[] = Object.entries(ROLES).map(([key, r]) => ({
    ...r,
    permissions: [...ROLE_PERMISSIONS[key as keyof typeof ROLES]],
    created_at: new Date(FIXTURE_NOW - 420 * 86_400_000).toISOString(),
    updated_at: new Date(FIXTURE_NOW - 30 * 86_400_000).toISOString(),
  }))
  const users: S["DashUser"][] = clone(USERS)
  const sessions = new Map<string, S["UserSession"][]>()

  const db = {
    roles,
    users,
    apps: clone(APPS),
    deliveries: clone(DELIVERIES),
    suppressions: clone(SUPPRESSIONS),
    moderation: clone(MODERATION),
    /** Newest first; written entries go in front of the fixtures. */
    audit: clone(AUDIT),
    orphans: clone(ORPHANED_KEYS),
    networkList: NETWORKS,

    user(id: string) {
      return users.find((u) => u.id === id)
    },
    role(id: number) {
      return roles.find((r) => r.id === id)
    },
    roleRef(r: MockRole): S["RoleRef"] {
      return { id: r.id, key: r.key, name: r.name, level: r.level }
    },
    toRole(r: MockRole): S["Role"] {
      return {
        id: r.id,
        key: r.key,
        name: r.name,
        description: r.description,
        level: r.level,
        immutable: r.immutable,
        permission_count: r.key === "root" ? PERMISSION_KEYS.length : r.permissions.length,
        member_count: users.filter((u) => u.roles.some((a) => a.role.id === r.id)).length,
      }
    },
    sessions(userId: string) {
      let list = sessions.get(userId)
      if (!list) {
        list = sessionsFor(userId)
        sessions.set(userId, list)
      }
      return list
    },
    setSessions(userId: string, list: S["UserSession"][]) {
      sessions.set(userId, list)
    },
    permissionsOf(roleIds: number[]): PermissionKey[] {
      const keys = new Set<PermissionKey>()
      for (const id of roleIds) {
        const r = roles.find((x) => x.id === id)
        if (!r) continue
        for (const k of r.key === "root" ? PERMISSION_KEYS : r.permissions) keys.add(k)
      }
      return [...keys].sort()
    },
    /** Effective level in a scope: max of global roles and that network's roles. */
    levelOf(userId: string, networkId: number | null): number {
      const u = users.find((x) => x.id === userId)
      if (!u) return 0
      return Math.max(
        0,
        ...u.roles
          .filter((a) => a.network === null || (networkId !== null && a.network.id === networkId))
          .map((a) => roles.find((r) => r.id === a.role.id)?.level ?? 0),
      )
    },
    /** `GET /v1/me` computed from this db, so role edits show up on the next refetch. */
    meOf(persona: Persona, authTime: number): S["Me"] {
      const u = users.find((x) => x.id === persona.userId)
      const assignments = u?.roles ?? []
      const globalRoles = assignments.filter((a) => a.network === null).map((a) => a.role.id)
      const byNetwork = new Map<number, number[]>()
      for (const a of assignments) {
        if (!a.network) continue
        byNetwork.set(a.network.id, [...(byNetwork.get(a.network.id) ?? []), a.role.id])
      }
      const ref = (id: number) => {
        const r = roles.find((x) => x.id === id)
        return r ? [{ id: r.id, key: r.key, name: r.name, level: r.level }] : []
      }
      return {
        user: {
          id: persona.userId,
          display_name: persona.name,
          username: persona.username,
          email_masked: u?.email_masked ?? "",
          locale: "tr",
          avatar_initials: persona.name
            .split(/\s+/)
            .map((p) => p.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        },
        auth_time: authTime,
        amr: ["otp"],
        global: { roles: globalRoles.flatMap(ref), permissions: db.permissionsOf(globalRoles) },
        networks: [...byNetwork.entries()].flatMap(([networkId, roleIds]) => {
          const n = NETWORKS.find((x) => x.id === networkId)
          if (!n) return []
          return [
            {
              id: n.id,
              slug: n.slug,
              name: n.name,
              city: n.city,
              roles: roleIds.flatMap(ref),
              permissions: db.permissionsOf(roleIds),
            },
          ]
        }),
      }
    },
  }
  return db
}

export type MockDb = ReturnType<typeof createDb>
