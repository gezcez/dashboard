import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Eyebrow } from "@/components/ui/eyebrow"
import { useMe } from "@/lib/me"
import { visiblePages } from "@/lib/pages"
import { cn } from "@/lib/utils"
import { NavLink } from "./nav-link"
import { NetworkSwitcher } from "./network-switcher"
import { useCurrentNetwork } from "./use-shell"
import { UserMenu } from "./user-menu"

/** Navy sidebar (both themes), generated from the page registry and the user's permissions. */
export function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const network = useCurrentNetwork()
  const networkPages = visiblePages(me, "network", network)
  const platformPages = visiblePages(me, "platform")

  return (
    <div className="flex h-full flex-col gap-4 bg-sidebar p-3 text-sidebar-foreground">
      <Link
        to="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 px-2 pt-1 font-bold tracking-tight",
          collapsed && "justify-center px-0",
        )}
      >
        <img src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-lg" />
        {!collapsed && (
          <span className="flex items-baseline gap-2">
            <span className="text-base">{t("brand")}</span>
            <span className="text-[11px] font-semibold tracking-widest text-sidebar-active uppercase">
              {t("brandSuffix")}
            </span>
          </span>
        )}
      </Link>

      {(me?.networks.length ?? 0) > 0 || networkPages.length > 0 ? (
        <NetworkSwitcher collapsed={collapsed} onNavigate={onNavigate} />
      ) : null}

      <nav
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
        aria-label={t("nav.home")}
      >
        {network && networkPages.length > 0 && (
          <NavGroup label={t("nav.groupNetwork")} collapsed={collapsed}>
            {networkPages.map((id) => (
              <NavLink
                key={id}
                id={id}
                network={network.slug}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </NavGroup>
        )}
        {platformPages.length > 0 && (
          <NavGroup label={t("nav.groupPlatform")} collapsed={collapsed}>
            {platformPages.map((id) => (
              <NavLink key={id} id={id} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </NavGroup>
        )}
      </nav>

      <div className="border-t border-sidebar-border pt-3">
        <UserMenu collapsed={collapsed} />
      </div>
    </div>
  )
}

function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      {collapsed ? (
        <div className="mx-auto my-1 h-px w-6 bg-sidebar-border" />
      ) : (
        <Eyebrow className="px-3 pb-1 text-[11px] text-sidebar-muted">{label}</Eyebrow>
      )}
      {children}
    </div>
  )
}
