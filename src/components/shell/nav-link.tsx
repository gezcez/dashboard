import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PAGES, type PageDef, type PageId } from "@/lib/pages"
import { cn } from "@/lib/utils"

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
  const className = cn(
    "flex h-9 items-center gap-3 rounded-full px-3 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
    "data-[status=active]:bg-sidebar-active data-[status=active]:text-sidebar-active-foreground",
    collapsed && "justify-center px-0",
  )
  const link =
    page.to === "/n/$network" ? (
      <Link
        to="/n/$network"
        params={{ network: network ?? "" }}
        activeOptions={{ exact: true }}
        className={className}
        onClick={onNavigate}
        aria-label={collapsed ? label : undefined}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    ) : (
      <Link
        to={page.to}
        className={className}
        onClick={onNavigate}
        aria-label={collapsed ? label : undefined}
      >
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
