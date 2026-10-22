import { z } from "zod"
import type { Vehicle } from "@/lib/realtime"

/**
 * Live map filters (plan 6.3). They live in the URL so a view is linkable; counts per value are
 * computed client side from the store, each facet counted with the other facets applied.
 */

export const MOTIONS = ["moving", "stopped", "stale"] as const
export type Motion = (typeof MOTIONS)[number]

/** Below this a vehicle counts as stopped even when the feed says "in transit". */
const STOPPED_BELOW_MS = 0.6

export function motionOf(v: Pick<Vehicle, "stale" | "status" | "speed">): Motion {
  if (v.stale) return "stale"
  if (v.status === 1 || (v.speed !== null && v.speed < STOPPED_BELOW_MS)) return "stopped"
  return "moving"
}

export const liveSearchSchema = z.object({
  routes: z.array(z.string()).optional().catch(undefined),
  dir: z.union([z.literal(0), z.literal(1)]).optional().catch(undefined),
  motion: z.enum(MOTIONS).optional().catch(undefined),
  agency: z.string().optional(),
  q: z.string().optional(),
  trip: z.boolean().optional().catch(undefined),
  vehicle: z.string().optional(),
  follow: z.boolean().optional().catch(undefined),
  stops: z.boolean().optional().catch(undefined),
  labels: z.boolean().optional().catch(undefined),
})
export type LiveSearch = z.infer<typeof liveSearchSchema>

export interface RouteInfo {
  short_name: string
  agency: string | null
}

type Facet = "routes" | "dir" | "motion" | "agency"

function passes(
  v: Vehicle,
  f: LiveSearch,
  routes: ReadonlyMap<string, RouteInfo>,
  skip?: Facet,
): boolean {
  if (skip !== "routes" && f.routes?.length && !f.routes.includes(v.route_id ?? "")) return false
  if (skip !== "dir" && f.dir !== undefined && v.dir !== f.dir) return false
  if (skip !== "motion" && f.motion && motionOf(v) !== f.motion) return false
  if (skip !== "agency" && f.agency) {
    const agency = v.route_id ? routes.get(v.route_id)?.agency : null
    if (agency !== f.agency) return false
  }
  if (f.trip && !v.trip_id) return false
  if (f.q) {
    const q = f.q.toLocaleLowerCase()
    const code = v.route_id ? (routes.get(v.route_id)?.short_name ?? "") : ""
    const hay = [v.plate ?? "", v.id, code, v.headsign ?? ""].join(" ").toLocaleLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

export function filterVehicles(
  vehicles: Iterable<Vehicle>,
  f: LiveSearch,
  routes: ReadonlyMap<string, RouteInfo>,
): Vehicle[] {
  const out: Vehicle[] = []
  for (const v of vehicles) if (passes(v, f, routes)) out.push(v)
  return out
}

export interface FacetCounts {
  routes: Map<string, number>
  dir: [number, number]
  motion: Record<Motion, number>
  agency: Map<string, number>
}

export function facetCounts(
  vehicles: Iterable<Vehicle>,
  f: LiveSearch,
  routes: ReadonlyMap<string, RouteInfo>,
): FacetCounts {
  const out: FacetCounts = {
    routes: new Map(),
    dir: [0, 0],
    motion: { moving: 0, stopped: 0, stale: 0 },
    agency: new Map(),
  }
  for (const v of vehicles) {
    if (v.route_id && passes(v, f, routes, "routes"))
      out.routes.set(v.route_id, (out.routes.get(v.route_id) ?? 0) + 1)
    if ((v.dir === 0 || v.dir === 1) && passes(v, f, routes, "dir")) out.dir[v.dir]++
    if (passes(v, f, routes, "motion")) out.motion[motionOf(v)]++
    const agency = v.route_id ? routes.get(v.route_id)?.agency : null
    if (agency && passes(v, f, routes, "agency"))
      out.agency.set(agency, (out.agency.get(agency) ?? 0) + 1)
  }
  return out
}

export function isFiltered(f: LiveSearch): boolean {
  return Boolean(
    f.routes?.length || f.dir !== undefined || f.motion || f.agency || f.q || f.trip,
  )
}
