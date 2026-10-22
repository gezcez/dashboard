import { VEHICLE_FLAGS } from "@/api/realtime-types"

/** One live vehicle, decoded from a compact or full row (backend 6.10 field order). */
export interface Vehicle {
  id: string
  lat: number
  lon: number
  bearing: number | null
  /** m/s */
  speed: number | null
  route_id: string | null
  dir: number | null
  trip_id: string | null
  stop_seq: number | null
  /** GTFS-RT stop status: 0 incoming, 1 stopped, 2 in transit. */
  status: number | null
  /** Vehicle timestamp, unix seconds. */
  vts: number
  /** Feed timestamp of the message that last touched this vehicle, unix seconds. */
  fts: number | null
  flags: number
  stale: boolean
  plate: string | null
  stop_id: string | null
  headsign: string | null
}

type Row = (string | number | null)[]

const num = (v: unknown): number | null => (typeof v === "number" ? v : null)
const str = (v: unknown): string | null => (typeof v === "string" ? v : null)

/** Builds a row decoder for a `fields` list, so unknown or reordered fields still decode. */
export function rowDecoder(
  fields: readonly string[],
): (row: Row, feedTs: number | null) => Vehicle {
  const at = (name: string) => fields.indexOf(name)
  const i = {
    id: at("id"),
    lat: at("lat"),
    lon: at("lon"),
    bearing: at("bearing"),
    speed: at("speed_ms"),
    route: at("route_id"),
    dir: at("direction"),
    trip: at("trip_id"),
    seq: at("stop_seq"),
    status: at("status"),
    vts: at("vehicle_ts"),
    flags: at("flags"),
    plate: at("plate"),
    stop: at("stop_id"),
    headsign: at("headsign"),
  }
  const get = (row: Row, index: number) => (index < 0 ? null : (row[index] ?? null))
  return (row, feedTs) => {
    const flags = num(get(row, i.flags)) ?? 0
    return {
      id: String(get(row, i.id)),
      lat: num(get(row, i.lat)) ?? 0,
      lon: num(get(row, i.lon)) ?? 0,
      bearing: num(get(row, i.bearing)),
      speed: num(get(row, i.speed)),
      route_id: str(get(row, i.route)),
      dir: num(get(row, i.dir)),
      trip_id: str(get(row, i.trip)),
      stop_seq: num(get(row, i.seq)),
      status: num(get(row, i.status)),
      vts: num(get(row, i.vts)) ?? 0,
      fts: feedTs,
      flags,
      stale: (flags & VEHICLE_FLAGS.stale) !== 0,
      plate: str(get(row, i.plate)),
      stop_id: str(get(row, i.stop)),
      headsign: str(get(row, i.headsign)),
    }
  }
}

export interface VehicleStoreOptions {
  /** Listeners are notified at most this often (plan 8.6: 500 ms). */
  notifyMs?: number
}

/**
 * `Map<vehicleId, Vehicle>` for one subscription plus a version counter. Snapshots replace the
 * map, deltas patch it. Subscribers (useSyncExternalStore) are notified at most every 500 ms.
 */
export class VehicleStore {
  private vehicles = new Map<string, Vehicle>()
  /** What subscribers see: `vehicles` as of the last notification. */
  private published: ReadonlyMap<string, Vehicle> = new Map()
  private decode: ReturnType<typeof rowDecoder> = rowDecoder([])
  private versionValue = 0
  private feedTsValue: number | null = null
  private readonly listeners = new Set<() => void>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastNotify = 0
  private readonly notifyMs: number

  constructor(options: VehicleStoreOptions = {}) {
    this.notifyMs = options.notifyMs ?? 500
  }

  snapshot(fields: readonly string[], rows: Row[], feedTs: number | null): void {
    this.decode = rowDecoder(fields)
    const next = new Map<string, Vehicle>()
    for (const row of rows) {
      const v = this.decode(row, feedTs)
      next.set(v.id, v)
    }
    this.vehicles = next
    this.feedTsValue = feedTs
    this.bump()
  }

  delta(upsert: Row[], remove: string[], feedTs: number | null): void {
    const next = new Map(this.vehicles)
    for (const row of upsert) {
      const v = this.decode(row, feedTs)
      next.set(v.id, v)
    }
    for (const id of remove) next.delete(id)
    this.vehicles = next
    if (feedTs !== null) this.feedTsValue = feedTs
    this.bump()
  }

  clear(): void {
    this.vehicles = new Map()
    this.feedTsValue = null
    this.bump()
  }

  /** Immutable between notifications, safe for useSyncExternalStore. */
  all = (): ReadonlyMap<string, Vehicle> => this.published

  get(id: string): Vehicle | undefined {
    return this.published.get(id)
  }

  version(): number {
    return this.versionValue
  }

  feedTs(): number | null {
    return this.feedTsValue
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.listeners.clear()
  }

  private bump(): void {
    this.versionValue++
    if (this.timer) return
    const wait = Math.max(0, this.lastNotify + this.notifyMs - Date.now())
    this.timer = setTimeout(() => {
      this.timer = null
      this.lastNotify = Date.now()
      this.published = this.vehicles
      for (const l of this.listeners) l()
    }, wait)
  }
}
