import { createFileRoute, Outlet } from "@tanstack/react-router"
import { analyticsSearchSchema } from "@/components/analytics/search"
import { routesQuery } from "@/components/transit/queries"
import { assertPage } from "@/lib/pages"

/** Analytics section: one search schema for every view, so filters survive switching views. */
export const Route = createFileRoute("/_app/n/$network/analytics")({
  validateSearch: analyticsSearchSchema,
  beforeLoad: ({ context }) => assertPage("network.analytics", context),
  loader: ({ context }) =>
    context.queryClient.query(routesQuery(context.network.id)).catch(() => undefined),
  component: Outlet,
})
