import { Outlet } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { usePrefs } from "@/lib/prefs-store"
import { cn } from "@/lib/utils"
import { SidebarContent } from "./app-sidebar"
import { CommandPalette } from "./command-palette"
import { SessionBanner } from "./session-banner"
import { StepUpDialog } from "./step-up"
import { TopBar } from "./top-bar"

export function AppShell() {
  const { t } = useTranslation()
  const collapsed = usePrefs((s) => s.sidebarCollapsed)
  const [menuOpen, setMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 lg:block",
          collapsed ? "w-[4.25rem]" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left">
          <SheetTitle className="sr-only">{t("nav.openMenu")}</SheetTitle>
          <SheetDescription className="sr-only">{t("appName")}</SheetDescription>
          <SidebarContent collapsed={false} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMenuOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
        <SessionBanner />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <StepUpDialog />
    </div>
  )
}
