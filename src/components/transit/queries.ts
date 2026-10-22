import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { components } from "@/api/schema.gen"
import { apiQuery } from "@/lib/api"

export type RouteSummary = components["schemas"]["RoutePageDto"]["items"][number]
export type StopSummary = components["schemas"]["StopPageDto"]["items"][number]
export type Binding = components["schemas"]["DashBindingDto"]
export type BindingStatus = components["schemas"]["TrackerOverviewDto"]["bindings"][number]

const id = (n: number | string) => String(n)

/** Static catalogue reads change at most once per sync, so they stay fresh for 10 minutes. */
const CATALOG_STALE_MS = 10 * 60_000

export const networkManifestQuery = (networkId: number) => ({
  ...apiQuery("/v1/networks/{networkId}", { params: { path: { networkId: id(networkId) } } }),
  staleTime: CATALOG_STALE_MS,
})

export const routesQuery = (networkId: number) => ({
  ...apiQuery("/v1/networks/{networkId}/routes", {
    params: { path: { networkId: id(networkId) }, query: { limit: 200 } },
  }),
  staleTime: CATALOG_STALE_MS,
})

export const routeQuery = (routeId: string) => ({
  ...apiQuery("/v1/routes/{routeId}", { params: { path: { routeId } } }),
  staleTime: CATALOG_STALE_MS,
})

export const shapeQuery = (routeId: string) => ({
  ...apiQuery("/v1/routes/{routeId}/shape", { params: { path: { routeId } } }),
  staleTime: CATALOG_STALE_MS,
})

export const timetableQuery = (
  routeId: string,
  dayType: "weekday" | "saturday" | "sunday",
  direction?: number,
) => ({
  ...apiQuery("/v1/routes/{routeId}/timetable", {
    params: {
      path: { routeId },
      query: { day_type: dayType, ...(direction === undefined ? {} : { direction }) },
    },
  }),
  staleTime: CATALOG_STALE_MS,
})

export const stopQuery = (stopId: string) => ({
  ...apiQuery("/v1/stops/{stopId}", { params: { path: { stopId } } }),
  staleTime: CATALOG_STALE_MS,
})

export const departuresQuery = (stopId: string) => ({
  ...apiQuery("/v1/stops/{stopId}/departures", {
    params: { path: { stopId }, query: { limit: 12 } },
  }),
  refetchInterval: 30_000,
})

export const vehicleQuery = (vehicleId: string) =>
  apiQuery("/v1/vehicles/{vehicleId}", { params: { path: { vehicleId } } })

export const bindingsQuery = (networkId: number) =>
  apiQuery("/v1/dash/networks/{networkId}/bindings", {
    params: { path: { networkId: id(networkId) } },
  })

export const trackerQuery = (networkId: number) => ({
  ...apiQuery("/v1/dash/networks/{networkId}/tracker", {
    params: { path: { networkId: id(networkId) } },
  }),
  refetchInterval: 30_000,
})

export const providersQuery = () => ({
  ...apiQuery("/v1/dash/providers"),
  staleTime: CATALOG_STALE_MS,
})

/** All routes of a network, indexed by public id and by external code (analytics rows). */
export function useRouteIndex(networkId: number) {
  const query = useQuery(routesQuery(networkId))
  const index = useMemo(() => {
    const byId = new Map<string, RouteSummary>()
    const byExt = new Map<string, RouteSummary>()
    for (const r of query.data?.items ?? []) {
      byId.set(r.id, r)
      byExt.set(externalId(r.id), r)
    }
    return { byId, byExt, list: query.data?.items ?? [] }
  }, [query.data])
  return { ...index, isPending: query.isPending, error: query.error }
}

/** Public ids are `${bindingId}.${external}` (backend transit ids); analytics speaks external. */
export function externalId(publicId: string): string {
  const dot = publicId.indexOf(".")
  return dot < 0 ? publicId : publicId.slice(dot + 1)
}

/** Natural sort for route codes ("2" before "10", "41C" after "41"). */
export function compareRouteCodes(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}
