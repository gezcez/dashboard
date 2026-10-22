import type { PermissionKey } from "@/api/permission-keys.gen"
import type { PermissionScope } from "@/auth/react"
import { useMe, type Me } from "./me"

export type { PermissionKey }
export type Scope = PermissionScope

/**
 * Backend rule (6.4): a global permission check passes only on the global set; a network check
 * passes on the global set or that network's set. Returns undefined while `me` is unknown.
 */
export function can(me: Me | undefined, key: PermissionKey, scope: Scope): boolean | undefined {
  if (!me) return undefined
  if (me.global.permissions.includes(key)) return true
  if (scope === "global") return false
  const network = me.networks.find((n) => n.id === scope.network || n.slug === scope.network)
  return network?.permissions.includes(key) ?? false
}

export function hasAnyGlobalPermission(me: Me | undefined): boolean {
  return (me?.global.permissions.length ?? 0) > 0
}

export function useCan(key: PermissionKey, scope: Scope): boolean | undefined {
  const { data } = useMe()
  return can(data, key, scope)
}

/** Thrown from a route's beforeLoad; rendered as a friendly 403, not a redirect. */
export class ForbiddenError extends Error {
  readonly permission: PermissionKey
  readonly networkName: string | null

  constructor(permission: PermissionKey, networkName: string | null = null) {
    super(`missing permission ${permission}`)
    this.name = "ForbiddenError"
    this.permission = permission
    this.networkName = networkName
  }
}

/** Highest role level the viewer holds in a scope (global roles count everywhere). */
export function levelOf(me: Me | undefined, scope: Scope): number {
  if (!me) return 0
  const global = me.global.roles.map((r) => r.level)
  const network =
    scope === "global"
      ? []
      : (me.networks
          .find((n) => n.id === scope.network || n.slug === scope.network)
          ?.roles.map((r) => r.level) ?? [])
  return Math.max(0, ...global, ...network)
}

/** Root bypasses level rules in the backend (audited), so the UI must not pre-filter for it. */
export function isRoot(me: Me | undefined): boolean {
  return me?.global.roles.some((r) => r.key === "root") ?? false
}
