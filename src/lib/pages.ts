import {
  GaugeIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"
import type { ParseKeys } from "i18next"
import type { FileRoutesByTo } from "@/routeTree.gen"
import { can, ForbiddenError, type PermissionKey } from "./permissions"
import type { Me } from "./me"

type RoutePath = keyof FileRoutesByTo

export interface PageDef {
  to: RoutePath
  perm: PermissionKey
  scope: "global" | "network"
  group: "network" | "platform"
  label: ParseKeys
  icon: LucideIcon
}

/**
 * Every page in the app with its permission. The sidebar, the command palette, the `/` redirect
 * and each route's beforeLoad guard all read this one table, so hidden nav and blocked routes can
 * never disagree. Keys come from backend 6.4.1; a page only appears here once its route exists.
 */
export const PAGES = {
  "network.overview": {
    to: "/n/$network",
    perm: "network.overview.read",
    scope: "network",
    group: "network",
    label: "nav.networkOverview",
    icon: LayoutDashboardIcon,
  },
  "admin.overview": {
    to: "/admin",
    perm: "system.health.read",
    scope: "global",
    group: "platform",
    label: "nav.systemOverview",
    icon: GaugeIcon,
  },
  "admin.users": {
    to: "/admin/users",
    perm: "users.read",
    scope: "global",
    group: "platform",
    label: "nav.users",
    icon: UsersIcon,
  },
  "admin.roles": {
    to: "/admin/roles",
    perm: "roles.read",
    scope: "global",
    group: "platform",
    label: "nav.roles",
    icon: ShieldCheckIcon,
  },
  "admin.permissions": {
    to: "/admin/permissions",
    perm: "permissions.read",
    scope: "global",
    group: "platform",
    label: "nav.permissions",
    icon: KeyRoundIcon,
  },
  "admin.audit": {
    to: "/admin/audit",
    perm: "audit.read",
    scope: "global",
    group: "platform",
    label: "nav.audit",
    icon: ScrollTextIcon,
  },
} as const satisfies Record<string, PageDef>

export type PageId = keyof typeof PAGES

export const PAGE_IDS = Object.keys(PAGES) as PageId[]

export interface NetworkContext {
  id: number
  slug: string
  name: string
}

export function canSeePage(
  me: Me | undefined,
  id: PageId,
  network?: NetworkContext | null,
): boolean {
  const page: PageDef = PAGES[id]
  if (page.scope === "global") return can(me, page.perm, "global") === true
  if (!network) return false
  return can(me, page.perm, { network: network.id }) === true
}

export function visiblePages(
  me: Me | undefined,
  group: PageDef["group"],
  network?: NetworkContext | null,
): PageId[] {
  return PAGE_IDS.filter((id) => PAGES[id].group === group && canSeePage(me, id, network))
}

/** Route guard for beforeLoad. Throws ForbiddenError (rendered as a 403 in place). */
export function assertPage(id: PageId, context: { me: Me; network?: NetworkContext }): void {
  const page: PageDef = PAGES[id]
  if (!canSeePage(context.me, id, context.network)) {
    throw new ForbiddenError(
      page.perm,
      page.scope === "network" ? (context.network?.name ?? null) : null,
    )
  }
}
