import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useApplyTheme, useResolvedTheme } from "@/lib/theme"
import type { RouterContext } from "@/router"

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
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
