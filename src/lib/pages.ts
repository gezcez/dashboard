import {
  Building2Icon,
  ChartLineIcon,
  CirclePlayIcon,
  LibraryBigIcon,
  MapIcon,
  RadioTowerIcon,
  GaugeIcon,
  KeyRoundIcon,
  AppWindowIcon,
  GavelIcon,
  MailIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  UsersRoundIcon,
  HistoryIcon,
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
  /** false keeps a page out of the sidebar and palette (reached from another page). */
  nav?: false
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
  "network.live": {
    to: "/n/$network/live",
    perm: "vehicles.live.read",
    scope: "network",
    group: "network",
    label: "nav.live",
    icon: MapIcon,
  },
  "network.playback": {
    to: "/n/$network/live/playback",
    perm: "vehicles.history.read",
    scope: "network",
    group: "network",
    label: "nav.playback",
    icon: CirclePlayIcon,
    nav: false,
  },
  "network.tracker": {
    to: "/n/$network/tracker",
    perm: "tracker.read",
    scope: "network",
    group: "network",
    label: "nav.tracker",
    icon: RadioTowerIcon,
  },
  "network.analytics": {
    to: "/n/$network/analytics",
    perm: "analytics.read",
    scope: "network",
    group: "network",
    label: "nav.analytics",
    icon: ChartLineIcon,
  },
  "network.catalog": {
    to: "/n/$network/catalog",
    perm: "catalog.read",
    scope: "network",
    group: "network",
    label: "nav.catalog",
    icon: LibraryBigIcon,
  },
  "network.members": {
    to: "/n/$network/members",
    perm: "members.read",
    scope: "network",
    group: "network",
    label: "nav.members",
    icon: UsersRoundIcon,
  },
  "network.audit": {
    to: "/n/$network/audit",
    perm: "audit.read",
    scope: "network",
    group: "network",
    label: "nav.networkAudit",
    icon: HistoryIcon,
  },
  "admin.overview": {
    to: "/admin",
    perm: "system.health.read",
    scope: "global",
    group: "platform",
    label: "nav.systemOverview",
    icon: GaugeIcon,
  },
  "admin.catalog": {
    to: "/admin/catalog",
    perm: "catalog.read",
    scope: "global",
    group: "platform",
    label: "nav.networksCities",
    icon: Building2Icon,
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
  "admin.apps": {
    to: "/admin/apps",
    perm: "apps.read",
    scope: "global",
    group: "platform",
    label: "nav.apps",
    icon: AppWindowIcon,
  },
  "admin.moderation": {
    to: "/admin/moderation",
    perm: "moderation.read",
    scope: "global",
    group: "platform",
    label: "nav.moderation",
    icon: GavelIcon,
  },
  "admin.audit": {
    to: "/admin/audit",
    perm: "audit.read",
    scope: "global",
    group: "platform",
    label: "nav.audit",
    icon: ScrollTextIcon,
  },
  "admin.email": {
    to: "/admin/email",
    perm: "email.read",
    scope: "global",
    group: "platform",
    label: "nav.email",
    icon: MailIcon,
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
  return PAGE_IDS.filter((id) => {
    const page: PageDef = PAGES[id]
    return page.group === group && page.nav !== false && canSeePage(me, id, network)
  })
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
