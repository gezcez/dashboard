import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { NotFoundState } from "@/components/states/states"
import { useApplyTheme, useResolvedTheme } from "@/lib/theme"
import type { RouterContext } from "@/router"

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  // URLs outside the app shell (no sidebar) still get a framed 404.
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center bg-surface-cream px-4 py-12">
      <NotFoundState />
    </div>
  ),
})

function RootComponent() {
  useApplyTheme()
  const theme = useResolvedTheme()
  return (
    <TooltipProvider delayDuration={300}>
      <Outlet />
      <Toaster theme={theme} position="bottom-right" />
    </TooltipProvider>
  )
}
