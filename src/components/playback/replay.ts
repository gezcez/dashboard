import type { components } from "@/api/schema.gen"
import { haversine, type LngLat } from "@/lib/geo"

export type Replay = components["schemas"]["ReplayDto"]

export interface Trip {
  /** Index into replay.vehicles, plus a segment number when a gap splits the path. */
  key: string
  vehicle: number
  path: LngLat[]
  /** Seconds after replay.start, ascending. */
  timestamps: number[]
}

/** A pause longer than this between two fixes starts a new segment (no straight jump lines). */
export const SPLIT_AFTER_S = 300

/** Columnar replay rows to one path per vehicle segment, for deck.gl TripsLayer. */
export function toTrips(replay: Replay): Trip[] {
  const rows = new Map<number, number[]>()
  for (let i = 0; i < replay.idx.length; i++) {
    const v = replay.idx[i] ?? 0
    let list = rows.get(v)
    if (!list) rows.set(v, (list = []))
    list.push(i)
  }
  const trips: Trip[] = []
  for (const [vehicle, list] of rows) {
    list.sort((a, b) => (replay.t[a] ?? 0) - (replay.t[b] ?? 0))
    let seg = 0
    let current: Trip | null = null
    let lastT = -Infinity
    for (const i of list) {
      const t = replay.t[i] ?? 0
      if (!current || t - lastT > SPLIT_AFTER_S) {
        current = { key: `${String(vehicle)}:${String(seg++)}`, vehicle, path: [], timestamps: [] }
        trips.push(current)
      }
      current.path.push([(replay.lon[i] ?? 0) / 1e6, (replay.lat[i] ?? 0) / 1e6])
      current.timestamps.push(t)
      lastT = t
    }
  }
  return trips.filter((tr) => tr.path.length > 1)
}

/** Distinct vehicles seen per bin, for the histogram behind the scrubber. */
export function activeHistogram(replay: Replay, bins: number): number[] {
  const span = Math.max(1, replay.end - replay.start)
  const sets = Array.from({ length: bins }, () => new Set<number>())
  for (let i = 0; i < replay.t.length; i++) {
    const b = Math.min(bins - 1, Math.floor(((replay.t[i] ?? 0) / span) * bins))
    sets[b]?.add(replay.idx[i] ?? 0)
  }
  return sets.map((s) => s.size)
}

export interface Head {
  trip: Trip
  position: LngLat
  /** m/s from the surrounding fixes, null at the ends. */
  speed: number | null
  bearing: number
}

/** Where each trip is at time `t` (seconds after start), interpolated between fixes. */
export function headsAt(trips: readonly Trip[], t: number): Head[] {
  const out: Head[] = []
  for (const trip of trips) {
    const ts = trip.timestamps
    const first = ts[0]
    const last = ts[ts.length - 1]
    if (first === undefined || last === undefined || t < first || t > last) continue
    let lo = 0
    let hi = ts.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if ((ts[mid] ?? 0) <= t) lo = mid
      else hi = mid
    }
    const a = trip.path[lo]
    const b = trip.path[hi]
    const ta = ts[lo] ?? 0
    const tb = ts[hi] ?? 0
    if (!a || !b) continue
    const f = tb > ta ? (t - ta) / (tb - ta) : 0
    const position: LngLat = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    const dt = tb - ta
    const bearing = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI
    out.push({ trip, position, speed: dt > 0 ? haversine(a, b) / dt : null, bearing })
  }
  return out
}

/** True when `t` falls inside one of the replay's poll gaps. */
export function inGap(replay: Pick<Replay, "gaps">, t: number): boolean {
  return replay.gaps.some(([a, b]) => a !== undefined && b !== undefined && t >= a && t <= b)
}
