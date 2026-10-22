import { createFileRoute, Outlet } from "@tanstack/react-router"
import { assertPage } from "@/lib/pages"

/** Transit catalogue of one network: profile and bindings, routes, stops, issues (plan 6.7). */
export const Route = createFileRoute("/_app/n/$network/catalog")({
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  component: Outlet,
})
