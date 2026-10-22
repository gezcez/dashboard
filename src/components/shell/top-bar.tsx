import {
  ChevronRightIcon,
  MenuIcon,
  MoonIcon,
  PanelLeftIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { env, isMock } from "@/env"
import { PAGES, type PageDef } from "@/lib/pages"
import { usePrefs } from "@/lib/prefs-store"
import { useResolvedTheme } from "@/lib/theme"
import { SudoPill } from "./step-up"
import { useCurrentNetwork, useCurrentPageId } from "./use-shell"

export function TopBar({
  onOpenMenu,
  onOpenCommand,
}: {
  onOpenMenu: () => void
  onOpenCommand: () => void
}) {
  const { t } = useTranslation()
  const network = useCurrentNetwork()
  const pageId = useCurrentPageId()
  const page: PageDef | null = pageId ? PAGES[pageId] : null
  const theme = useResolvedTheme()
  const setTheme = usePrefs((s) => s.setTheme)
  const collapsed = usePrefs((s) => s.sidebarCollapsed)
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed)
  const envBadge = isMock
    ? t("env.mock")
    : env.VITE_ENV === "production"
      ? null
      : t(`env.${env.VITE_ENV}`)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label={t("nav.openMenu")}
      >
        <MenuIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="hidden lg:inline-flex"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={t("nav.toggleSidebar")}
        aria-pressed={collapsed}
      >
        <PanelLeftIcon />
      </Button>

      <nav
        aria-label={t("topbar.breadcrumb")}
        className="flex min-w-0 items-center gap-1.5 text-sm"
      >
        <span className="truncate text-muted-foreground">
          {network ? network.name : page?.group === "platform" ? t("topbar.platform") : null}
        </span>
        {page && (network || page.group === "platform") && (
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {page && <span className="truncate font-semibold">{t(page.label)}</span>}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <SudoPill />
        {envBadge && (
          <Badge variant="brand" className="hidden font-mono uppercase sm:inline-flex">
            {envBadge}
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommand}
          className="hidden w-64 justify-start font-normal text-muted-foreground md:inline-flex"
        >
          <SearchIcon />
          <span className="min-w-0 flex-1 truncate text-left">{t("command.open")}</span>
          <kbd className="rounded-md border px-1.5 font-mono text-[11px]">
            {t("command.shortcut")}
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenCommand}
          aria-label={t("command.open")}
        >
          <SearchIcon />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("theme.toggle")}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("theme.toggle")}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
