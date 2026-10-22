import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PAGES, type PageDef, type PageId } from "@/lib/pages"
import { cn } from "@/lib/utils"
import { useCurrentPageId } from "./use-shell"

export function NavLink({
  id,
  network,
  collapsed,
  onNavigate,
}: {
  id: PageId
  network?: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const page: PageDef = PAGES[id]
  const Icon = page.icon
  const label = t(page.label)
  // Active by page id (route staticData), so detail pages light up their section and
  // /admin does not stay lit under /admin/users.
  const active = useCurrentPageId() === id
  const className = cn(
    "flex h-9 items-center gap-3 rounded-full px-3 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
    active &&
      "bg-sidebar-active text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
    collapsed && "justify-center px-0",
  )
  const common = {
    className,
    onClick: onNavigate,
    "aria-label": collapsed ? label : undefined,
    "aria-current": active ? ("page" as const) : undefined,
    activeProps: {},
  }
  const link =
    page.to === "/n/$network" ? (
      <Link to="/n/$network" params={{ network: network ?? "" }} {...common}>
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    ) : (
      <Link to={page.to} {...common}>
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
