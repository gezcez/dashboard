import { bearing, haversine, type LngLat } from "@/lib/geo"
import { SIM_NETWORKS, type NetworkDef, type RouteDef } from "./networks"

/**
 * Deterministic vehicle simulator for mock mode. A vehicle's state is a pure function of the
 * time, so the live map, trails, playback, the poll log and analytics all agree with each other
 * without storing anything. Vehicles shuttle along their route, slowing to a stop at every stop
 * (s(u) = L * (u - sin(2πNu) / 2πN) has zero speed exactly at the N+1 evenly spaced stops).
 */

export const LAYOVER_S = 240
export const STALE_AFTER_S = 180
const TZ_OFFSET_S = 3 * 3600 // Europe/Istanbul, no DST

export function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 13
  h = Math.imul(h, 0x5bd1e995)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

export interface SimStop {
  id: string
  ext: string
  name: string
  lat: number
  lon: number
}

export interface SimDirection {
  direction: 0 | 1
  headsign: string
  coords: LngLat[]
  cum: number[]
  length: number
  /** In travel order; stop k sits at distance length * k / (stops.length - 1). */
  stops: SimStop[]
  patternId: string
}

export interface SimRoute {
  id: string
  def: RouteDef
  network: NetworkDef
  directions: [SimDirection, SimDirection]
  /** Seconds of one run in one direction. */
  travelS: number
  cycleS: number
}

export interface SimVehicle {
  id: string
  ext: string
  plate: string
  route: SimRoute
  slot: number
  phase: number
  /** Vehicles stuck with an old timestamp (stale on the map). */
  stuck: boolean
  /** 0..1: the vehicle runs when the hour's service level is above this. */
  rank: number
  accessible: boolean
}

export interface SimState {
  id: string
  lat: number
  lon: number
  bearing: number
  speed: number
  route_id: string
  direction: 0 | 1
  trip_id: string
  stop_seq: number
  status: 0 | 1 | 2
  vts: number
  flags: number
  plate: string
  stop_id: string
  headsign: string
}

const SERVICE_LEVEL = [
  0.12, 0.05, 0.03, 0.03, 0.05, 0.35, 0.75, 1, 1, 0.95, 0.8, 0.75, 0.75, 0.75, 0.8, 0.9, 1, 1, 1,
  0.85, 0.7, 0.55, 0.4, 0.25,
]

export function localHour(t: number): number {
  return Math.floor(((t + TZ_OFFSET_S) % 86_400) / 3600)
}

export function serviceLevel(t: number): number {
  return SERVICE_LEVEL[localHour(t)] ?? 0
}

function cumulative(coords: LngLat[]): number[] {
  const out = [0]
  for (let i = 1; i < coords.length; i++)
    out.push((out[i - 1] ?? 0) + haversine(coords[i - 1]!, coords[i]!))
  return out
}

function pointAt(dir: SimDirection, s: number): { at: LngLat; heading: number } {
  const { coords, cum } = dir
  let i = 1
  while (i < cum.length - 1 && (cum[i] ?? 0) < s) i++
  const a = coords[i - 1]!
  const b = coords[i]!
  const segStart = cum[i - 1] ?? 0
  const seg = (cum[i] ?? 0) - segStart || 1
  const f = Math.min(Math.max((s - segStart) / seg, 0), 1)
  return { at: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], heading: bearing(a, b) }
}

function buildRoute(network: NetworkDef, def: RouteDef): SimRoute {
  const id = `${String(network.bindingId)}.${def.code}`
  const coords0 = def.path
  const cum0 = cumulative(coords0)
  const length = cum0[cum0.length - 1] ?? 0
  const intervals = Math.max(3, Math.round(length / 650))
  const stops0: SimStop[] = []
  const probe: SimDirection = {
    direction: 0,
    headsign: def.headsigns[0],
    coords: coords0,
    cum: cum0,
    length,
    stops: [],
    patternId: `${id}.p0`,
  }
  for (let k = 0; k <= intervals; k++) {
    const { at } = pointAt(probe, (length * k) / intervals)
    const ext = `${def.code}${String(k).padStart(3, "0")}`
    const pool = network.stopNames
    const name =
      k === 0
        ? def.headsigns[1]
        : k === intervals
          ? def.headsigns[0]
          : `${pool[Math.floor(hash(`${def.code}:${String(k)}`) * pool.length)] ?? "Durak"} ${String(k)}`
    stops0.push({
      id: `${String(network.bindingId)}.${ext}`,
      ext,
      name: titleCase(name),
      lat: round(at[1], 6),
      lon: round(at[0], 6),
    })
  }
  const coords1 = [...coords0].reverse()
  const dir0: SimDirection = { ...probe, stops: stops0 }
  const dir1: SimDirection = {
    direction: 1,
    headsign: def.headsigns[1],
    coords: coords1,
    cum: cumulative(coords1),
    length,
    stops: [...stops0].reverse(),
    patternId: `${id}.p1`,
  }
  const travelS = Math.round(length / def.speed)
  return {
    id,
    def,
    network,
    directions: [dir0, dir1],
    travelS,
    cycleS: 2 * (travelS + LAYOVER_S),
  }
}

function titleCase(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1) : w))
    .join(" ")
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d

const LETTERS = "ABCDEFGHJKLMNPRSTUVYZ"

function plateOf(network: NetworkDef, key: string): string {
  const a = LETTERS[Math.floor(hash(`${key}:a`) * LETTERS.length)] ?? "A"
  const b = LETTERS[Math.floor(hash(`${key}:b`) * LETTERS.length)] ?? "B"
  const n = 100 + Math.floor(hash(`${key}:n`) * 899)
  return `${network.plateArea} ${a}${b} ${String(n)}`
}

interface NetworkSim {
  network: NetworkDef
  routes: SimRoute[]
  vehicles: SimVehicle[]
  stops: SimStop[]
}

const cache = new Map<number, NetworkSim>()

export function networkSim(network: NetworkDef): NetworkSim {
  const hit = cache.get(network.networkId)
  if (hit) return hit
  const routes = network.routes.map((def) => buildRoute(network, def))
  const vehicles: SimVehicle[] = []
  let serial = 1
  for (const route of routes) {
    const count = route.def.fleet * 2
    for (let slot = 0; slot < count; slot++) {
      const key = `${route.id}:${String(slot)}`
      // Evenly spread, with jitter so some pairs bunch (the Marey chart shows it).
      const jitter = (hash(`${key}:j`) - 0.5) * (0.7 / count)
      const ext = String(1000 + serial++)
      vehicles.push({
        id: `${String(network.bindingId)}.${ext}`,
        ext,
        plate: route.def.staff ? "BLD4TEST" : plateOf(network, key),
        route,
        slot,
        phase: (((slot / count + jitter) % 1) + 1) % 1,
        stuck: hash(`${key}:stuck`) < 0.035,
        rank: hash(`${key}:rank`) * 0.98,
        accessible: hash(`${key}:acc`) < 0.7,
      })
    }
  }
  const seen = new Map<string, SimStop>()
  for (const r of routes) for (const s of r.directions[0].stops) seen.set(s.id, s)
  const sim = { network, routes, vehicles, stops: [...seen.values()] }
  cache.set(network.networkId, sim)
  return sim
}

export function simRoute(routeId: string): SimRoute | undefined {
  for (const n of SIM_NETWORKS) {
    const r = networkSim(n).routes.find((x) => x.id === routeId)
    if (r) return r
  }
  return undefined
}

export function simStop(stopId: string): { stop: SimStop; network: NetworkDef } | undefined {
  for (const n of SIM_NETWORKS) {
    const s = networkSim(n).stops.find((x) => x.id === stopId)
    if (s) return { stop: s, network: n }
  }
  return undefined
}

export function simVehicle(vehicleId: string): SimVehicle | undefined {
  for (const n of SIM_NETWORKS) {
    const v = networkSim(n).vehicles.find((x) => x.id === vehicleId)
    if (v) return v
  }
  return undefined
}

export function isActive(v: SimVehicle, t: number): boolean {
  return v.rank < serviceLevel(t)
}

/** The vehicle at time t (unix seconds), ignoring service hours and staleness. */
export function positionAt(v: SimVehicle, t: number): SimState {
  const { route } = v
  const cyclePos = (((t / route.cycleS + v.phase) % 1) + 1) % 1
  const cycleIndex = Math.floor(t / route.cycleS + v.phase)
  let x = cyclePos * route.cycleS
  let direction: 0 | 1 = 0
  let u: number
  let atTerminus = false
  if (x < route.travelS) {
    u = x / route.travelS
  } else if ((x -= route.travelS) < LAYOVER_S) {
    u = 1
    atTerminus = true
  } else if ((x -= LAYOVER_S) < route.travelS) {
    direction = 1
    u = x / route.travelS
  } else {
    direction = 1
    u = 1
    atTerminus = true
  }
  const dir = route.directions[direction]
  const n = dir.stops.length - 1
  const s = dir.length * (u - Math.sin(2 * Math.PI * n * u) / (2 * Math.PI * n))
  const { at, heading } = pointAt(dir, s)
  const speed = atTerminus
    ? 0
    : Math.max(0, (dir.length / route.travelS) * (1 - Math.cos(2 * Math.PI * n * u)))
  const pos = u * n
  const frac = pos - Math.floor(pos)
  const nearest = Math.round(pos)
  const stopped = atTerminus || frac < 0.04 || frac > 0.96
  const next = stopped ? nearest : Math.ceil(pos)
  const seq = Math.min(Math.max(next, 0), n) + 1
  return {
    id: v.id,
    lat: round(at[1], 5),
    lon: round(at[0], 5),
    bearing: Math.round(heading),
    speed: round(speed, 1),
    route_id: route.id,
    direction,
    trip_id: `${route.id}.${String(direction)}.${String(cycleIndex)}.${String(v.slot)}`,
    stop_seq: seq,
    status: stopped ? 1 : frac > 0.7 ? 0 : 2,
    vts: Math.floor(t),
    flags: (v.accessible ? 2 : 0) | (atTerminus ? 4 : 0),
    plate: v.plate,
    stop_id: dir.stops[seq - 1]?.id ?? "",
    headsign: dir.headsign,
  }
}

export interface LiveOptions {
  /** Binding paused or killed at this time: positions freeze there and go stale. */
  frozenAt?: number | null
}

/** Vehicles reported by the feed at time t, as the tracker would publish them. */
export function liveVehicles(
  network: NetworkDef,
  t: number,
  options: LiveOptions = {},
): SimState[] {
  const sim = networkSim(network)
  const feedT = options.frozenAt ?? t
  const out: SimState[] = []
  for (const v of sim.vehicles) {
    if (!isActive(v, feedT)) continue
    const at = v.stuck ? feedT - 420 : feedT
    const state = positionAt(v, at)
    if (t - state.vts > STALE_AFTER_S) state.flags |= 1
    out.push(state)
  }
  return out
}

export function simNetworkOf(networkId: number | string): NetworkSim | undefined {
  const n = SIM_NETWORKS.find(
    (x) => String(x.networkId) === String(networkId) || x.slug === networkId,
  )
  return n ? networkSim(n) : undefined
}
