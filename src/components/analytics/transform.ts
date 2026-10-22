import { localIsoToMs } from "@/lib/time"
import { median, num, str, weightedMean, type Row } from "./use-metric"

/**
 * Pure reshaping of metric rows into what the charts draw. Kept apart from the pages so the
 * math is unit tested; the pages only build ECharts options from these.
 */

/** Below this many samples a cell is greyed out (plan 6.6). */
export const MIN_SAMPLES = 5

/** Monday-first weekday (0 to 6) of a local date. */
export function weekdayOf(date: string): number {
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
}

/** Hour x weekday median of `vehicles` from fleet.hourly 1h buckets: [hour, weekday, value]. */
export function weekdayHourMedians(rows: Row[]): [number, number, number][] {
  const cells = new Map<string, number[]>()
  for (const r of rows) {
    const bucket = str(r.bucket)
    const v = num(r.vehicles)
    if (bucket.length < 13 || v === null) continue
    const key = `${String(Number(bucket.slice(11, 13)))}:${String(weekdayOf(bucket.slice(0, 10)))}`
    let list = cells.get(key)
    if (!list) cells.set(key, (list = []))
    list.push(v)
  }
  const out: [number, number, number][] = []
  for (const [key, list] of cells) {
    const [h, d] = key.split(":").map(Number)
    out.push([h ?? 0, d ?? 0, Math.round(median(list) ?? 0)])
  }
  return out.sort((a, b) => a[1] - b[1] || a[0] - b[0])
}

/** fleet.hourly rows as [epoch ms, vehicles] for a time axis. */
export function fleetSeries(rows: Row[], timeZone: string): [number, number][] {
  return rows
    .map((r): [number, number] => [localIsoToMs(str(r.bucket), timeZone), num(r.vehicles) ?? 0])
    .sort((a, b) => a[0] - b[0])
}

export interface RouteDirSummary {
  route: string
  direction: number
  runs: number
  p50: number | null
  p90: number | null
}

/** runs.runtime rows per hour to one line per route-direction, weighted by runs. */
export function runtimeByRouteDir(rows: Row[]): RouteDirSummary[] {
  const groups = new Map<string, Row[]>()
  for (const r of rows) {
    const key = `${str(r.route_ext)}|${String(num(r.direction) ?? 0)}`
    let list = groups.get(key)
    if (!list) groups.set(key, (list = []))
    list.push(r)
  }
  return [...groups.entries()].map(([key, list]) => {
    const [route = "", dir = "0"] = key.split("|")
    return {
      route,
      direction: Number(dir),
      runs: list.reduce((a, r) => a + (num(r.runs) ?? 0), 0),
      p50: weightedMean(list.map((r) => [num(r.p50_min), num(r.runs)])),
      p90: weightedMean(list.map((r) => [num(r.p90_min), num(r.runs)])),
    }
  })
}

export interface MareyLine {
  vehicle: string
  /** [epoch ms, stop_seq] with null breaks between trips. */
  points: ([number, number] | null)[]
  trips: number
}

/** headways.marey rows to one polyline per vehicle, trips separated by null breaks. */
export function mareyLines(rows: Row[]): MareyLine[] {
  const byVehicle = new Map<string, Map<string, [number, number][]>>()
  for (const r of rows) {
    const v = str(r.vehicle_id)
    const trip = str(r.trip_ext)
    const t = num(r.t)
    const seq = num(r.stop_seq)
    if (t === null || seq === null) continue
    let trips = byVehicle.get(v)
    if (!trips) byVehicle.set(v, (trips = new Map()))
    let pts = trips.get(trip)
    if (!pts) trips.set(trip, (pts = []))
    pts.push([t * 1000, seq])
  }
  const out: MareyLine[] = []
  for (const [vehicle, trips] of byVehicle) {
    const ordered = [...trips.values()]
      .map((pts) => pts.sort((a, b) => a[0] - b[0]))
      .sort((a, b) => (a[0]?.[0] ?? 0) - (b[0]?.[0] ?? 0))
    const points: ([number, number] | null)[] = []
    ordered.forEach((pts, i) => {
      if (i > 0) points.push(null)
      points.push(...pts)
    })
    out.push({ vehicle, points, trips: ordered.length })
  }
  return out.sort((a, b) => a.vehicle.localeCompare(b.vehicle))
}

export interface BunchingSummary {
  route: string
  n: number
  bunching: number | null
  gaps: number | null
  medianHeadway: number | null
}

/** headways.observed rows to one summary per route, shares weighted by sample size. */
export function bunchingByRoute(rows: Row[]): BunchingSummary[] {
  const groups = new Map<string, Row[]>()
  for (const r of rows) {
    const key = str(r.route_ext)
    let list = groups.get(key)
    if (!list) groups.set(key, (list = []))
    list.push(r)
  }
  return [...groups.entries()]
    .map(([route, list]) => ({
      route,
      n: list.reduce((a, r) => a + (num(r.n) ?? 0), 0),
      bunching: weightedMean(list.map((r) => [num(r.bunching_share), num(r.n)])),
      gaps: weightedMean(list.map((r) => [num(r.gap_share), num(r.n)])),
      medianHeadway: median(list.map((r) => num(r.median_headway_min))),
    }))
    .sort((a, b) => (b.bunching ?? 0) - (a.bunching ?? 0))
}

export interface StopHeadway {
  stop: string
  /** Order of first appearance, which follows the route's stop sequence. */
  order: number
  n: number
  median: number | null
  p90: number | null
}

/** headways.observed rows of one route-direction to one point per stop. */
export function headwayByStop(rows: Row[]): StopHeadway[] {
  const groups = new Map<string, { order: number; rows: Row[] }>()
  for (const r of rows) {
    const stop = str(r.stop_ext)
    let g = groups.get(stop)
    if (!g) groups.set(stop, (g = { order: groups.size, rows: [] }))
    g.rows.push(r)
  }
  return [...groups.entries()]
    .map(([stop, g]) => ({
      stop,
      order: g.order,
      n: g.rows.reduce((a, r) => a + (num(r.n) ?? 0), 0),
      median: weightedMean(g.rows.map((r) => [num(r.median_headway_min), num(r.n)])),
      p90: weightedMean(g.rows.map((r) => [num(r.p90_headway_min), num(r.n)])),
    }))
    .sort((a, b) => a.order - b.order)
}

/** Sum of numeric columns across rows (KPIs). */
export function sumOf(rows: Row[], column: string): number {
  return rows.reduce((a, r) => a + (num(r[column]) ?? 0), 0)
}

/** A share column averaged over rows weighted by another column. */
export function shareOf(rows: Row[], column: string, weight: string): number | null {
  return weightedMean(rows.map((r) => [num(r[column]), num(r[weight])]))
}

/** Days of `fleet.hourly` 1d rows as a sparkline series. */
export function dailySeries(rows: Row[], column: string, dateColumn = "bucket"): number[] {
  return [...rows]
    .sort((a, b) => str(a[dateColumn]).localeCompare(str(b[dateColumn])))
    .map((r) => num(r[column]) ?? 0)
}
