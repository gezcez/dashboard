import { latLngToCell } from "h3-js"
import type { components } from "@/api/schema.gen"
import { haversine } from "@/lib/geo"
import type { NetworkDef } from "./networks"
import { hash, LAYOVER_S, networkSim, serviceLevel, type SimRoute } from "./sim"

type S = components["schemas"]
type Result = S["AnalyticsResultDto"]
type Cell = string | number | boolean | null
export type Metric = S["AnalyticsMetric"]

/**
 * Synthetic analytics for mock mode, one generator per backend 6.9 metric, all derived from the
 * same simulator so the pages tell one consistent story (rush-hour slowdowns on the D-100, a
 * bunching 200, Sakarya without a timetable, a nightly poll gap).
 */

export interface AnalyticsParams {
  from: string
  to: string
  dayType: "all" | "weekday" | "saturday" | "sunday"
  hourFrom: number
  hourTo: number
  routes: string[] | null
  direction: number | null
  granularity: "5m" | "1h" | "1d"
  routeId: string | null
  stopId: string | null
  date: string | null
  res: number
  hour: number | null
}

const DAY = 86_400
const TZ = 3 * 3600

/** Local midnight (unix s) of a YYYY-MM-DD in Europe/Istanbul. */
export function dayStart(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000) - TZ
}

export function localDate(t: number): string {
  return new Date((t + TZ) * 1000).toISOString().slice(0, 10)
}

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
    (r) => !r.def.staff && (!p.routes || p.routes.includes(r.id)),
  )
}

function quantiles(base: number, spread: number, key: string): number[] {
  const skew = 0.8 + hash(key) * 0.4
  return [0.78, 0.9, 1, 1.12 * skew, 1.3 * skew].map((f) =>
    Math.round(base * (1 + (f - 1) * spread)),
  )
}

const hours = (p: AnalyticsParams) => {
  const out: number[] = []
  for (let h = Math.max(p.hourFrom, 5); h < Math.min(p.hourTo, 24); h++) out.push(h)
  return out
}

function result(
  columns: string[],
  rows: Cell[][],
  p: AnalyticsParams,
  extra: Partial<Result["meta"]> = {},
): Result {
  const today = localDate(Math.floor(Date.now() / 1000))
  const nIndex = columns.indexOf("n")
  const n =
    nIndex >= 0
      ? rows.reduce((a, r) => a + (typeof r[nIndex] === "number" ? r[nIndex] : 0), 0)
      : rows.length
  return {
    columns,
    rows,
    meta: {
      n,
      generated_at: new Date().toISOString(),
      source:
        p.to >= today
          ? "hot"
          : p.from < localDate(Math.floor(Date.now() / 1000) - 7 * DAY)
            ? "archive"
            : "rollup",
      timezone: "Europe/Istanbul",
      ...extra,
    },
  }
}

// ---- generators -------------------------------------------------------------------------------

function fleetHourly(network: NetworkDef, p: AnalyticsParams): Result {
  const step = { "5m": 300, "1h": 3600, "1d": DAY }[p.granularity]
  const routes = routesOf(network, p)
  const agencies = [...new Set(routes.map((r) => r.def.agency))]
  const fleetBy = new Map(
    agencies.map((a) => [
      a,
      routes.filter((r) => r.def.agency === a).reduce((s, r) => s + r.def.fleet * 2, 0),
    ]),
  )
  const now = Math.floor(Date.now() / 1000)
  const rows: Cell[][] = []
  for (const d of days(p)) {
    for (let t = d; t < d + DAY && t <= now; t += step) {
      for (const agency of agencies) {
        const fleet = fleetBy.get(agency) ?? 0
        if (step === DAY) {
          let vh = 0
          for (let h = 0; h < 24; h++) vh += serviceLevel(d + h * 3600) * fleet * dayFactor(d)
          rows.push([
            localDate(d),
            agency,
            Math.round(fleet * dayFactor(d)),
            Math.round(vh),
            Math.round(vh * 360),
          ])
          continue
        }
        const hour = Math.floor(((t + TZ) % DAY) / 3600)
        if (hour < p.hourFrom || hour >= p.hourTo) continue
        const noise = 0.94 + hash(`${agency}:${String(t)}`) * 0.1
        const active = Math.round(serviceLevel(t) * fleet * dayFactor(d) * noise)
        rows.push([
          new Date(t * 1000).toISOString(),
          agency,
          active,
          Math.round((active * step) / 360) / 10,
          Math.round(step / 10),
        ])
      }
    }
  }
  return result(["t", "agency", "active_vehicles", "vehicle_hours", "n"], rows, p)
}

function vehicleDays(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  const rows: Cell[][] = []
  for (const d of days(p).slice(-31)) {
    for (const v of sim.vehicles) {
      if (v.route.def.staff || (p.routes && !p.routes.includes(v.route.id))) continue
      if (v.rank > 0.99 * dayFactor(d)) continue
      let first: number | null = null
      let last: number | null = null
      for (let h = 0; h < 24; h++) {
        if (v.rank < serviceLevel(d + h * 3600) * dayFactor(d)) {
          first ??= d + h * 3600 + Math.floor(hash(`${v.id}:${String(d)}:f`) * 1800)
          last = d + h * 3600 + 3599 - Math.floor(hash(`${v.id}:${String(d)}:l`) * 1800)
        }
      }
      if (first === null || last === null) continue
      rows.push([
        localDate(d),
        v.id,
        v.plate,
        v.route.id,
        new Date(first * 1000).toISOString(),
        new Date(last * 1000).toISOString(),
        Math.round((last - first) / 360) / 10,
      ])
    }
  }
  return result(
    ["date", "vehicle_id", "plate", "route_id", "first_seen", "last_seen", "duty_h"],
    rows,
    p,
  )
}

function runtime(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  const nDays = days(p).length
  for (const r of routesOf(network, p)) {
    if (p.routeId && r.id !== p.routeId) continue
    for (const dir of [0, 1]) {
      if (p.direction !== null && dir !== p.direction) continue
      for (const h of hours(p)) {
        const base = r.travelS * congestion(h) * (r.def.code === "42200" ? 1.1 : 1)
        const n = Math.round(
          serviceLevel(h * 3600 - TZ) * r.def.fleet * (3600 / r.cycleS) * nDays * 2,
        )
        if (n < 1) continue
        rows.push([r.id, dir, h, n, ...quantiles(base, 1, `${r.id}:${String(dir)}:${String(h)}`)])
      }
    }
  }
  return result(
    ["route_id", "direction", "hour", "n", "p10_s", "p25_s", "p50_s", "p75_s", "p90_s"],
    rows,
    p,
  )
}

function headwaysObserved(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  const nDays = days(p).length
  for (const r of routesOf(network, p)) {
    if (p.routeId && r.id !== p.routeId) continue
    const scheduled = r.cycleS / (r.def.fleet * 2)
    const bunchy = r.def.code === "42200" ? 0.22 : r.def.code === "42041" ? 0.14 : 0.05
    for (const dir of [0, 1] as const) {
      if (p.direction !== null && dir !== p.direction) continue
      r.directions[dir].stops.forEach((stop, i) => {
        // Headways spread out along the line: bunching grows with distance from the terminus.
        const spread = 0.25 + (i / r.directions[dir].stops.length) * (bunchy * 4)
        const n = Math.round(nDays * 18 * r.def.fleet)
        rows.push([
          r.id,
          dir,
          i + 1,
          stop.name,
          n,
          ...quantiles(scheduled, spread, `${r.id}:${String(dir)}:${String(i)}`),
          Math.round(scheduled),
          Math.round(Math.min(0.6, bunchy * (0.5 + i / r.directions[dir].stops.length)) * 1000) /
            1000,
        ])
      })
    }
  }
  return result(
    [
      "route_id",
      "direction",
      "stop_seq",
      "stop_name",
      "n",
      "p10_s",
      "p25_s",
      "p50_s",
      "p75_s",
      "p90_s",
      "scheduled_s",
      "bunching_share",
    ],
    rows,
    p,
  )
}

function marey(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  const route = sim.routes.find((r) => r.id === p.routeId) ?? sim.routes[0]
  const rows: Cell[][] = []
  if (!route) return result([], [], p)
  const dir = (p.direction ?? 0) as 0 | 1
  const d = dayStart(p.date ?? p.to)
  const stops = route.directions[dir].stops
  const n = stops.length - 1
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
      if (start < d) continue
      if (v.rank >= serviceLevel(start)) continue
      const hour = Math.floor(((start + TZ) % DAY) / 3600)
      const slow = (hash(`${v.id}:${String(k)}`) - 0.3) * 0.3 + (congestion(hour) - 1) * 0.5
      const trip = `${route.id}.${String(dir)}.${String(k)}.${String(v.slot)}`
      for (let i = 0; i <= n; i++) {
        const t = start + (route.travelS * i * (1 + slow * (i / n))) / n
        if (t > now) break
        rows.push([trip, v.id, v.plate, i + 1, Math.round(t)])
      }
    }
  }
  return result(["trip_id", "vehicle_id", "plate", "stop_seq", "t"], rows, p, {
    n: new Set(rows.map((r) => r[0])).size,
  })
}

function adherence(network: NetworkDef, p: AnalyticsParams): Result {
  const columns = [
    "date",
    "weekday",
    "hour",
    "route_id",
    "direction",
    "trip_id",
    "scheduled",
    "delay_s",
  ]
  if (!network.timetable) return result(columns, [], p, { timetable: false, n: 0 })
  const rows: Cell[][] = []
  const now = Math.floor(Date.now() / 1000)
  for (const d of days(p).slice(-31)) {
    for (const r of routesOf(network, p)) {
      for (const dir of [0, 1]) {
        if (p.direction !== null && dir !== p.direction) continue
        const headway = (weekday(d) === 0 ? 30 : weekday(d) === 6 ? 20 : 15) * 60
        for (let s = 6 * 3600 - dir * 600; s <= 23 * 3600; s += headway) {
          const t = d + s
          if (t > now) break
          const hour = Math.floor(s / 3600)
          if (hour < p.hourFrom || hour >= p.hourTo) continue
          const h = hash(`${r.id}:${String(t)}`)
          const delay = Math.round(
            (h - 0.35) * 420 * congestion(hour) + (r.def.code === "42200" ? 160 : 0),
          )
          rows.push([
            localDate(d),
            weekday(d),
            hour,
            r.id,
            dir,
            `${r.id}.${String(dir)}.${String(t)}`,
            new Date(t * 1000).toISOString(),
            delay,
          ])
        }
      }
    }
  }
  return result(columns, rows, p, { timetable: true })
}

function dwell(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  if (p.stopId) {
    const rows: Cell[][] = hours(p).map((h) => [
      h,
      Math.round(40 * serviceLevel(h * 3600 - TZ) * days(p).length),
      ...quantiles(22 * congestion(h), 1.4, `${p.stopId ?? ""}:${String(h)}`),
    ])
    return result(["hour", "n", "p10_s", "p25_s", "p50_s", "p75_s", "p90_s"], rows, p)
  }
  const centre = network.centre
  const rows: Cell[][] = sim.stops
    .filter(
      (s) =>
        !p.routes ||
        sim.routes.some((r) => p.routes?.includes(r.id) && r.directions[0].stops.includes(s)),
    )
    .map((s) => {
      const dist = haversine(centre, [s.lon, s.lat])
      const median = Math.round(12 + 38 * Math.exp(-dist / 1800) + hash(`${s.id}:dw`) * 10)
      return [
        s.id,
        s.name,
        s.lat,
        s.lon,
        Math.round(days(p).length * (60 + hash(s.id) * 200)),
        median,
        Math.round(median * 2.1),
      ]
    })
  return result(["stop_id", "stop_name", "lat", "lon", "n", "median_s", "p90_s"], rows, p)
}

function speedHeatmap(network: NetworkDef, p: AnalyticsParams): Result {
  const cells = new Map<string, number[]>()
  const hour = p.hour ?? 8
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
      const dist = haversine(network.centre, [lon, lat])
      const urban = Math.exp(-dist / 4000)
      const kmh =
        ((r.def.speed * 3.6 * 1.25) / (1 + (congestion(hour) - 1) * (0.5 + urban * 1.5))) *
        (1 - urban * 0.35)
      const cell = latLngToCell(lat, lon, p.res)
      const list = cells.get(cell) ?? []
      list.push(kmh * (0.85 + hash(`${cell}:${String(list.length)}`) * 0.3))
      cells.set(cell, list)
    }
  }
  const rows: Cell[][] = [...cells.entries()].map(([cell, values]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const med = sorted[Math.floor(sorted.length / 2)] ?? 0
    const p15 = sorted[Math.floor(sorted.length * 0.15)] ?? 0
    const n = Math.round(values.length * days(p).length * 14 * (0.5 + hash(cell)))
    return [cell, Math.round(med * 10) / 10, Math.round(p15 * 10) / 10, n]
  })
  return result(["h3", "median_kmh", "p15_kmh", "n"], rows, p)
}

function qualityFeed(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  const sakarya = !network.timetable
  for (let d = dayStart(p.from); d <= dayStart(p.to); d += DAY) {
    const h = hash(`${network.slug}:${String(d)}`)
    const bad = h > 0.93 || (sakarya && h > 0.8)
    const success = Math.min(
      0.999,
      (bad ? 0.82 : 0.95) + hash(`${String(d)}:s`) * 0.045 - (sakarya ? 0.04 : 0),
    )
    const lag50 = Math.round(9 + hash(`${String(d)}:l`) * 8 + (sakarya ? 6 : 0))
    const stale =
      Math.round((0.01 + hash(`${String(d)}:st`) * 0.04 + (bad ? 0.05 : 0)) * 1000) / 1000
    const gap = Math.round(25 + (bad ? 40 + h * 60 : 0))
    const outliers = Math.round(hash(`${String(d)}:o`) * 40)
    const score = Math.round(
      100 *
        (0.45 * success +
          0.25 * (1 - Math.min(lag50 / 60, 1)) +
          0.2 * (1 - stale * 5) +
          0.1 * (1 - gap / 300)),
    )
    rows.push([
      localDate(d),
      network.bindingId,
      score,
      Math.round(success * 1000) / 1000,
      lag50,
      lag50 * 2 + 6,
      stale,
      gap,
      outliers,
      network.timetable ? 1400 : 0,
      Math.round(h * 30),
      outliers,
    ])
  }
  return result(
    [
      "date",
      "binding_id",
      "score",
      "poll_success",
      "lag_p50_s",
      "lag_p95_s",
      "stale_share",
      "gap_min",
      "outliers",
      "dropped_staff",
      "dropped_test",
      "dropped_outlier",
    ],
    rows,
    p,
  )
}

function coverage(network: NetworkDef, p: AnalyticsParams): Result {
  const sim = networkSim(network)
  const today = localDate(Math.floor(Date.now() / 1000))
  const rows: Cell[][] = sim.routes.map((r) => {
    const never = r.def.code === "42500" || r.def.staff
    return [
      r.id,
      r.def.short,
      true,
      never ? 0 : 7,
      never ? null : today,
      never ? 0 : r.def.fleet * 2,
    ]
  })
  if (network.timetable) {
    rows.push([`${String(network.bindingId)}.42777`, "777", false, 3, today, 2])
    rows.push([`${String(network.bindingId)}.42999`, "999", false, 1, today, 4])
  }
  return result(
    ["route_id", "short_name", "in_catalog", "days_seen", "last_seen", "vehicles_7d"],
    rows,
    p,
  )
}

function departures(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  for (const d of days(p))
    for (const r of routesOf(network, p))
      for (const dir of [0, 1])
        rows.push([localDate(d), r.id, dir, Math.round(r.def.fleet * 9 * dayFactor(d))])
  return result(["date", "route_id", "direction", "trips"], rows, p)
}

function travelTime(network: NetworkDef, p: AnalyticsParams): Result {
  const rows: Cell[][] = []
  for (const r of routesOf(network, p)) {
    const stops = r.directions[0].stops
    const leg = r.travelS / (stops.length - 1)
    for (let i = 1; i < stops.length; i++)
      for (const h of [8, 13, 18])
        rows.push([
          r.id,
          0,
          i,
          stops[i - 1]?.id ?? "",
          stops[i]?.id ?? "",
          h,
          Math.round(leg * congestion(h)),
        ])
  }
  return result(
    ["route_id", "direction", "seq", "from_stop", "to_stop", "hour", "median_s"],
    rows,
    p,
  )
}

export const GENERATORS: Record<Metric, (network: NetworkDef, p: AnalyticsParams) => Result> = {
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
  "coverage.routes": coverage,
}

export function toCsv(r: Result): string {
  const esc = (v: Cell) => {
    const s = v === null ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [r.columns.join(","), ...r.rows.map((row) => row.map(esc).join(","))].join("\n")
}
