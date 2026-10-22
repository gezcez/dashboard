import { latLngToCell } from "h3-js"
import type { components } from "@/api/schema.gen"
import { haversine } from "@/lib/geo"
import type { NetworkDef } from "./networks"
import { hash, LAYOVER_S, networkSim, serviceLevel, type SimRoute } from "./sim"

type S = components["schemas"]
type Result = S["MetricResultDto"]
type Cell = string | number | boolean | null
export type Metric = Result["meta"]["metric"]

/**
 * Synthetic analytics for mock mode with exactly the columns of the backend's DuckDB queries
 * (gezcez/backend `src/services/analytics/analytics.queries.ts`), all derived from the
 * simulator so the pages tell one consistent story: rush-hour slowdowns on the D-100, a bunching
 * 200, Sakarya without a timetable, a nightly poll gap. Route and stop columns carry upstream
 * (`*_ext`) ids, as in the backend.
 */

export interface AnalyticsParams {
  from: string
  to: string
  dayType: "all" | "weekday" | "saturday" | "sunday"
  /** Inclusive, 0 to 23. */
  hourFrom: number
  hourTo: number
  /** External route codes (public `<binding>.<ext>` ids are accepted and stripped). */
  routes: string[]
  direction: number | null
  granularity: "5m" | "1h" | "1d"
  stopId: string | null
  res: number
  hour: number | null
  minSamples: number
  limit: number
}

export const MAX_DAYS = 90
const DAY = 86_400
const TZ = 3 * 3600

/** Local midnight (unix s) of a YYYY-MM-DD in Europe/Istanbul. */
export function dayStart(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000) - TZ
}

export function localDate(t: number): string {
  return new Date((t + TZ) * 1000).toISOString().slice(0, 10)
}

const localIso = (t: number, len = 19) => new Date((t + TZ) * 1000).toISOString().slice(0, len)

function weekday(t: number): number {
  return new Date((t + TZ) * 1000).getUTCDay()
}

function dayMatches(t: number, type: AnalyticsParams["dayType"]): boolean {
  const w = weekday(t)
  if (type === "weekday") return w >= 1 && w <= 5
  if (type === "saturday") return w === 6
  if (type === "sunday") return w === 0
  return true
}

function days(p: AnalyticsParams): number[] {
  const out: number[] = []
  for (let t = dayStart(p.from); t <= dayStart(p.to); t += DAY)
    if (dayMatches(t, p.dayType)) out.push(t)
  return out
}

const dayFactor = (t: number) => {
  const w = weekday(t)
  return w === 0 ? 0.62 : w === 6 ? 0.8 : 1
}

/** Rush hours slow buses down: 1 is free flow. */
export function congestion(hour: number): number {
  if (hour >= 7 && hour <= 9) return 1.35
  if (hour >= 16 && hour <= 19) return 1.45
  if (hour >= 10 && hour <= 15) return 1.15
  return 1
}

function routesOf(network: NetworkDef, p: AnalyticsParams): SimRoute[] {
  return networkSim(network).routes.filter(
    (r) => !r.def.staff && (!p.routes.length || p.routes.includes(r.def.code)),
  )
}

const hours = (p: AnalyticsParams) => {
  const out: number[] = []
  for (let h = Math.max(p.hourFrom, 5); h <= p.hourTo; h++) out.push(h)
  return out
}

const r1 = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d

function result(
  metric: Metric,
  network: NetworkDef,
  columns: string[],
  rows: Cell[][],
  p: AnalyticsParams,
  n?: number,
): Result {
  const today = localDate(Math.floor(Date.now() / 1000))
  const weekAgo = localDate(Math.floor(Date.now() / 1000) - 7 * DAY)
  return {
    columns,
    rows,
    meta: {
      metric,
      n: n ?? rows.length,
      generated_at: new Date().toISOString(),
      source: p.to >= today ? "hot" : p.from < weekAgo ? "archive" : "rollup",
      timezone: "Europe/Istanbul",
      from: p.from,
      to: p.to,
      binding_ids: [network.bindingId],
    },
  }
}

// ---- generators -------------------------------------------------------------------------------

function fleetHourly(network: NetworkDef, p: AnalyticsParams): Result {
  const step = { "5m": 300, "1h": 3600, "1d": DAY }[p.granularity]
  const fleet = routesOf(network, p).reduce((s, r) => s + r.def.fleet * 2, 0)
  const now = Math.floor(Date.now() / 1000)
  const rows: Cell[][] = []
  for (const d of days(p)) {
    if (step === DAY) {
      let vh = 0
      let peak = 0
      for (let h = 0; h < 24; h++) {
        const level = serviceLevel(d + h * 3600) * dayFactor(d)
        vh += level * fleet
        peak = Math.max(peak, level)
      }
      rows.push([localDate(d), Math.round(fleet * dayFactor(d)), r1(vh), Math.round(peak * fleet)])
      continue
    }
    for (let t = d; t < d + DAY && t <= now; t += step) {
      const hour = Math.floor(((t + TZ) % DAY) / 3600)
      if (hour < p.hourFrom || hour > p.hourTo) continue
      const noise = 0.94 + hash(`${network.slug}:${String(t)}`) * 0.1
      const active = Math.round(serviceLevel(t) * fleet * dayFactor(d) * noise)
      rows.push([localIso(t, 16), active, r1((active * step) / 3600), Math.round(active * 0.97)])
    }
  }
  return result(
    "fleet.hourly",
    network,
    ["bucket", "vehicles", "vehicle_hours", "peak_vehicles"],
    rows,
    p,
  )
}

function vehicleDays(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  const rows: Cell[][] = []
  const list = days(p)
  for (const d of list) {
    for (const v of sim.vehicles) {
      if (v.route.def.staff || (p.routes.length && !p.routes.includes(v.route.def.code))) continue
      let first: number | null = null
      let last: number | null = null
      let samples = 0
      for (let h = 0; h < 24; h++) {
        if (v.rank < serviceLevel(d + h * 3600) * dayFactor(d)) {
          first ??= d + h * 3600 + Math.floor(hash(`${v.id}:${String(d)}:f`) * 1800)
          last = d + h * 3600 + 3599 - Math.floor(hash(`${v.id}:${String(d)}:l`) * 1800)
          samples += 360
        }
      }
      if (first === null || last === null) continue
      rows.push([
        localDate(d),
        network.bindingId,
        v.id,
        v.ext,
        v.plate,
        localIso(first),
        localIso(last),
        r1((last - first) / 3600),
        samples,
        1,
        d === list[0] ? false : hash(`${v.id}:new`) < 0.01,
        false,
      ])
    }
  }
  return result(
    "fleet.vehicle-days",
    network,
    [
      "date",
      "binding_id",
      "vehicle_id",
      "vehicle_ext",
      "plate",
      "first_seen",
      "last_seen",
      "duty_hours",
      "samples",
      "routes",
      "new_in_window",
      "retired_in_window",
    ],
    rows,
    p,
  )
}

function runtime(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  const nDays = days(p).length
  for (const r of routesOf(network, p)) {
    for (const dir of [0, 1]) {
      if (p.direction !== null && dir !== p.direction) continue
      for (const h of hours(p)) {
        const base = (r.travelS * congestion(h) * (r.def.code === "42200" ? 1.1 : 1)) / 60
        const runs = Math.round(
          serviceLevel(h * 3600 - TZ) * r.def.fleet * (3600 / r.cycleS) * nDays * 2,
        )
        if (runs < 1) continue
        const skew = 1.18 + hash(`${r.id}:${String(dir)}:${String(h)}`) * 0.25
        rows.push([r.def.code, dir, h, runs, r1(base), r1(base * skew), r1(base * 1.04)])
      }
    }
  }
  return result(
    "runs.runtime",
    network,
    ["route_ext", "direction", "hour", "runs", "p50_min", "p90_min", "mean_min"],
    rows,
    p,
  )
}

function departures(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  for (const d of days(p))
    for (const r of routesOf(network, p))
      for (const dir of [0, 1])
        if (p.direction === null || p.direction === dir)
          rows.push([localDate(d), r.def.code, dir, Math.round(r.def.fleet * 9 * dayFactor(d))])
  return result(
    "runs.departures",
    network,
    ["date", "route_ext", "direction", "departures"],
    rows,
    p,
  )
}

function headwaysObserved(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  const nDays = days(p).length
  for (const r of routesOf(network, p)) {
    const scheduled = r.cycleS / (r.def.fleet * 2) / 60
    const bunchy = r.def.code === "42200" ? 0.22 : r.def.code === "42041" ? 0.14 : 0.05
    for (const dir of [0, 1] as const) {
      if (p.direction !== null && dir !== p.direction) continue
      const stops = r.directions[dir].stops
      stops.forEach((stop, i) => {
        for (const h of hours(p)) {
          const level = serviceLevel(h * 3600 - TZ)
          const n = Math.round(nDays * level * r.def.fleet * 1.5)
          if (n < 1) continue
          const along = i / stops.length
          const share = Math.min(0.6, bunchy * (0.5 + along) * congestion(h))
          const median = scheduled / Math.max(level, 0.3)
          rows.push([
            r.def.code,
            dir,
            stop.ext,
            h,
            n,
            r1(median),
            r1(median * (1.6 + along + share)),
            r1(share, 3),
            r1(share * 0.7, 3),
          ])
        }
      })
    }
  }
  return result(
    "headways.observed",
    network,
    [
      "route_ext",
      "direction",
      "stop_ext",
      "hour",
      "n",
      "median_headway_min",
      "p90_headway_min",
      "bunching_share",
      "gap_share",
    ],
    rows,
    p,
  )
}

function marey(network: NetworkDef, p: AnalyticsParams): Result | string {
  if (p.routes.length !== 1) return "route_id is required (one route)"
  if (p.direction === null) return "direction is required"
  if (p.from !== p.to) return "one day only (date, or from = to)"
  const sim = networkSim(network)
  const route = sim.routes.find((r) => r.def.code === p.routes[0])
  const rows: Cell[][] = []
  const columns = ["vehicle_id", "trip_ext", "t", "stop_seq"]
  if (!route) return result("headways.marey", network, columns, rows, p)
  const dir = p.direction as 0 | 1
  const d = dayStart(p.from)
  const n = route.directions[dir].stops.length - 1
  const now = Math.floor(Date.now() / 1000)
  for (const v of sim.vehicles) {
    if (v.route !== route) continue
    // Trip k of this vehicle in this direction starts when its cycle position crosses the
    // direction's start (0 for dir 0, travel + layover for dir 1).
    const offset = dir === 0 ? 0 : route.travelS + LAYOVER_S
    const firstCycle = Math.ceil((d - offset) / route.cycleS + v.phase)
    for (let k = firstCycle; ; k++) {
      const start = (k - v.phase) * route.cycleS + offset
      if (start >= d + DAY || start > now) break
      if (start < d || v.rank >= serviceLevel(start)) continue
      const hour = Math.floor(((start + TZ) % DAY) / 3600)
      if (hour < p.hourFrom || hour > p.hourTo) continue
      const slow = (hash(`${v.id}:${String(k)}`) - 0.3) * 0.3 + (congestion(hour) - 1) * 0.5
      const trip = `${route.def.code}.${String(dir)}.${String(k)}`
      for (let i = 0; i <= n; i++) {
        const t = start + (route.travelS * i * (1 + slow * (i / n))) / n
        if (t > now) break
        rows.push([v.id, trip, Math.round(t), i + 1])
      }
    }
  }
  return result("headways.marey", network, columns, rows, p)
}

function adherence(network: NetworkDef, p: AnalyticsParams): Result {
  const columns = [
    "route_ext",
    "short_name",
    "direction",
    "hour",
    "runs",
    "median_delay_min",
    "p90_delay_min",
    "on_time_share",
    "early_share",
    "late_share",
  ]
  // No timetable: trip_runs has no start_delay_s, so the query returns nothing.
  if (!network.timetable) return result("adherence.departure", network, columns, [], p)
  const rows: Cell[][] = []
  const nDays = days(p).length
  for (const r of routesOf(network, p)) {
    for (const dir of [0, 1]) {
      if (p.direction !== null && dir !== p.direction) continue
      for (const h of hours(p)) {
        if (h < 6) continue
        const key = `${r.id}:${String(dir)}:${String(h)}`
        const late =
          (congestion(h) - 1) * 4 + (r.def.code === "42200" ? 2.5 : 0) + hash(key) * 1.5 - 0.4
        const onTime = Math.max(0.2, Math.min(0.97, 0.92 - late * 0.09))
        const early = r1(Math.max(0.01, 0.06 - late * 0.01), 3)
        rows.push([
          r.def.code,
          r.def.short,
          dir,
          h,
          Math.round(nDays * 4),
          r1(late),
          r1(late + 3 + hash(`${key}:p`) * 3),
          r1(onTime, 3),
          early,
          r1(Math.max(0, 1 - onTime - early), 3),
        ])
      }
    }
  }
  return result("adherence.departure", network, columns, rows, p)
}

function dwell(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  const nDays = days(p).length
  if (p.stopId) {
    const ext = p.stopId.includes(".") ? p.stopId.split(".").slice(1).join(".") : p.stopId
    const rows: Cell[][] = hours(p).map((h) => {
      const med = (14 + hash(`${ext}:dw`) * 20) * congestion(h)
      return [
        ext,
        h,
        Math.round(nDays * 30 * serviceLevel(h * 3600 - TZ)),
        r1(med, 1),
        r1(med * 2.1, 1),
      ]
    })
    return result(
      "dwell.stops",
      network,
      ["stop_ext", "hour", "n", "median_dwell_s", "p90_dwell_s"],
      rows,
      p,
    )
  }
  const rows = sim.stops
    .filter(
      (s) =>
        !p.routes.length ||
        sim.routes.some((r) => p.routes.includes(r.def.code) && r.directions[0].stops.includes(s)),
    )
    .map((s): Cell[] => {
      const dist = haversine(network.centre, [s.lon, s.lat])
      const median = 12 + 38 * Math.exp(-dist / 1800) + hash(`${s.id}:dw`) * 10
      return [
        s.ext,
        Math.round(nDays * (60 + hash(s.id) * 200)),
        r1(median, 1),
        r1(median * 2.1, 1),
      ]
    })
    .sort((a, b) => (b[2] as number) - (a[2] as number))
    .slice(0, p.limit)
  return result("dwell.stops", network, ["stop_ext", "n", "median_dwell_s", "p90_dwell_s"], rows, p)
}

function speedHeatmap(network: NetworkDef, p: AnalyticsParams): Result {
  const cells = new Map<string, number[]>()
  const hour = p.hour ?? 8
  const nDays = days(p).length
  for (const r of routesOf(network, p)) {
    const dir = r.directions[0]
    for (let s = 0; s < dir.length; s += 120) {
      let i = 1
      while (i < dir.cum.length - 1 && (dir.cum[i] ?? 0) < s) i++
      const a = dir.coords[i - 1]!
      const b = dir.coords[i]!
      const seg = (dir.cum[i] ?? 0) - (dir.cum[i - 1] ?? 0) || 1
      const f = (s - (dir.cum[i - 1] ?? 0)) / seg
      const lon = a[0] + (b[0] - a[0]) * f
      const lat = a[1] + (b[1] - a[1]) * f
      const urban = Math.exp(-haversine(network.centre, [lon, lat]) / 4000)
      const kmh =
        ((r.def.speed * 3.6 * 1.25) / (1 + (congestion(hour) - 1) * (0.5 + urban * 1.5))) *
        (1 - urban * 0.35)
      const cell = latLngToCell(lat, lon, p.res)
      const list = cells.get(cell) ?? []
      list.push(kmh * (0.85 + hash(`${cell}:${String(list.length)}`) * 0.3))
      cells.set(cell, list)
    }
  }
  const rows: Cell[][] = []
  for (const [cell, values] of [...cells.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sorted = [...values].sort((a, b) => a - b)
    const n = Math.round(values.length * nDays * 14 * (0.5 + hash(cell)))
    if (n < p.minSamples) continue
    rows.push([
      cell,
      r1(sorted[Math.floor(sorted.length / 2)] ?? 0),
      r1(sorted[Math.floor(sorted.length * 0.15)] ?? 0),
      n,
    ])
  }
  return result("speed.heatmap", network, ["h3", "median_kmh", "p15_kmh", "n"], rows, p)
}

function travelTime(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  for (const r of routesOf(network, p)) {
    const stops = r.directions[0].stops
    const leg = r.travelS / (stops.length - 1)
    for (let i = 1; i < stops.length; i++)
      for (const h of hours(p))
        rows.push([
          r.def.code,
          0,
          i,
          stops[i - 1]?.ext ?? "",
          stops[i]?.ext ?? "",
          h,
          20,
          r1(leg * congestion(h), 1),
          r1(leg * congestion(h) * 1.4, 1),
        ])
  }
  return result(
    "segments.travel-time",
    network,
    [
      "route_ext",
      "direction",
      "from_seq",
      "from_stop",
      "to_stop",
      "hour",
      "n",
      "median_s",
      "p90_s",
    ],
    rows,
    p,
  )
}

function qualityFeed(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  const sakarya = !network.timetable
  const catalog = network.routes.length
  for (let d = dayStart(p.from); d <= dayStart(p.to); d += DAY) {
    const h = hash(`${network.slug}:${String(d)}`)
    const bad = h > 0.93 || (sakarya && h > 0.8)
    const success = Math.min(
      0.999,
      (bad ? 0.82 : 0.95) + hash(`${String(d)}:s`) * 0.045 - (sakarya ? 0.04 : 0),
    )
    const lag50 = Math.round(9 + hash(`${String(d)}:l`) * 8 + (sakarya ? 6 : 0))
    const stale = r1(0.01 + hash(`${String(d)}:st`) * 0.04 + (bad ? 0.05 : 0), 4)
    const outlier = r1(hash(`${String(d)}:o`) * 0.01, 4)
    const seen = Math.min(catalog, catalog - (bad ? 2 : 1))
    const coverage = r1(seen / catalog, 4)
    const score = r1(
      100 * (0.4 * success + 0.3 * (1 - stale) + 0.2 * coverage + 0.1 * (1 - outlier)),
      1,
    )
    const polls = Math.round(DAY / (sakarya ? 15 : 10) - 150)
    rows.push([
      localDate(d),
      network.bindingId,
      polls,
      r1(success, 4),
      Math.round(25 + (bad ? 40 + h * 60 : 0)),
      polls * 140,
      network.routes.reduce((a, r) => a + r.fleet * 2, 0),
      lag50,
      lag50 * 2 + 6,
      stale,
      outlier,
      seen,
      catalog,
      coverage,
      Math.round(h * 30),
      network.timetable ? 1400 : 0,
      Math.round(stale * 2e4),
      0,
      Math.round(hash(`${String(d)}:i`) * 12),
      score,
    ])
  }
  return result(
    "quality.feed",
    network,
    [
      "date",
      "binding_id",
      "polls",
      "success_rate",
      "gap_minutes",
      "positions",
      "vehicles",
      "lag_p50_s",
      "lag_p95_s",
      "stale_share",
      "outlier_share",
      "routes_seen",
      "catalog_routes",
      "coverage",
      "dropped_test",
      "dropped_staff",
      "dropped_stale",
      "dropped_out_of_bbox",
      "dropped_invalid",
      "score",
    ],
    rows,
    p,
  )
}

function coverageRoutes(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  const window = days(p).length
  const lastSeen = localIso(Math.floor(Date.now() / 1000) - 40)
  const rows: Cell[][] = sim.routes
    .filter((r) => !p.routes.length || p.routes.includes(r.def.code))
    .map((r) => {
      const never = r.def.code === "42500" || r.def.staff
      return [
        network.bindingId,
        r.def.code,
        r.def.short,
        true,
        never ? 0 : window,
        window,
        never ? null : lastSeen,
        never ? 0 : r.def.fleet * 2,
      ]
    })
  if (network.timetable && !p.routes.length) {
    rows.push([network.bindingId, "42777", null, false, 3, window, lastSeen, 2])
    rows.push([network.bindingId, "42999", null, false, 1, window, lastSeen, 4])
  }
  rows.sort((a, b) => (a[4] as number) - (b[4] as number))
  return result(
    "coverage.routes",
    network,
    [
      "binding_id",
      "route_ext",
      "short_name",
      "in_catalog",
      "days_seen",
      "days_in_window",
      "last_seen",
      "vehicles",
    ],
    rows,
    p,
  )
}

export const GENERATORS: Record<
  Metric,
  (network: NetworkDef, p: AnalyticsParams) => Result | string
> = {
  "fleet.hourly": fleetHourly,
  "fleet.vehicle-days": vehicleDays,
  "runs.runtime": runtime,
  "runs.departures": departures,
  "headways.observed": headwaysObserved,
  "headways.marey": marey,
  "adherence.departure": adherence,
  "dwell.stops": dwell,
  "speed.heatmap": speedHeatmap,
  "segments.travel-time": travelTime,
  "quality.feed": qualityFeed,
  "coverage.routes": coverageRoutes,
}

export const METRIC_DESCRIPTIONS: Record<Metric, string> = {
  "fleet.hourly": "Distinct vehicles per bucket, vehicle-hours and peak fleet",
  "fleet.vehicle-days": "First/last seen per vehicle per day (duty span), new and retired vehicles",
  "runs.runtime": "Trip runtime p50/p90 per route-direction and start hour",
  "runs.departures": "Observed trip starts per route-direction and local day",
  "headways.observed": "Median headway and bunching share per route-direction-stop and hour",
  "adherence.departure": "Start delay vs timetable, on-time share (within 3 min)",
  "speed.heatmap": "Median and p15 speed (km/h) per H3 cell",
  "segments.travel-time": "Median travel time between consecutive stops",
  "dwell.stops": "Median dwell at stops",
  "quality.feed":
    "Poll success, gaps, lag, stale and outlier share, coverage and score per binding per day",
  "coverage.routes": "Catalogue routes and routes seen in the feed",
  "headways.marey": "Time-distance series for one route-direction and day",
}

export function toCsv(r: Result): string {
  const esc = (v: Cell) => {
    const s = v === null ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [r.columns.join(","), ...r.rows.map((row) => row.map(esc).join(","))].join("\n")
}
