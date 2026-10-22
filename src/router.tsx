import type { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { RouteError } from "@/components/states/route-error"
import { NotFoundState, PageSkeleton } from "@/components/states/states"
import type { AuthClient } from "@/auth/session"
import type { PageId } from "@/lib/pages"
import { routeTree } from "./routeTree.gen"

export interface RouterContext {
  queryClient: QueryClient
  auth: AuthClient
}

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: "intent",
    // Query owns caching; the router always asks it.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: () => <NotFoundState />,
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 300,
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
  interface StaticDataRouteOption {
    /** Ties a route to its entry in src/lib/pages.ts (nav, breadcrumbs, network switching). */
    pageId?: PageId
  }
}
