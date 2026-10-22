import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { VEHICLE_FIELDS_COMPACT, VEHICLE_FIELDS_FULL } from "@/api/realtime-types"
import { rowDecoder, VehicleStore } from "./vehicle-store"

const full = [
  "4.101",
  40.76543,
  29.91234,
  90,
  8.5,
  "4.41C",
  0,
  "4.T1",
  7,
  2,
  1_760_000_000,
  1 | 2,
  "41 ABC 123",
  "4.11407",
  "MAŞUKİYE",
]

describe("rowDecoder", () => {
  it("decodes a full row in the 6.10 order", () => {
    const v = rowDecoder(VEHICLE_FIELDS_FULL)(full, 1_760_000_010)
    expect(v).toEqual({
      id: "4.101",
      lat: 40.76543,
      lon: 29.91234,
      bearing: 90,
      speed: 8.5,
      route_id: "4.41C",
      dir: 0,
      trip_id: "4.T1",
      stop_seq: 7,
      status: 2,
      vts: 1_760_000_000,
      fts: 1_760_000_010,
      flags: 3,
      stale: true,
      plate: "41 ABC 123",
      stop_id: "4.11407",
      headsign: "MAŞUKİYE",
    })
  })

  it("decodes compact rows with nulls for the full-only fields", () => {
    const v = rowDecoder(VEHICLE_FIELDS_COMPACT)(full.slice(0, 12), null)
    expect(v.plate).toBeNull()
    expect(v.headsign).toBeNull()
    expect(v.stale).toBe(true)
  })

  it("follows the fields list, not a fixed order", () => {
    const v = rowDecoder(["lon", "id", "lat", "flags"])([29.9, "x", 40.7, 0], null)
    expect(v).toMatchObject({ id: "x", lat: 40.7, lon: 29.9, stale: false })
  })
})

describe("VehicleStore", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("applies snapshots and deltas, notifying at most every 500 ms", () => {
    const store = new VehicleStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.snapshot(VEHICLE_FIELDS_FULL, [full, ["4.102", ...full.slice(1)]], 10)
    store.delta([["4.103", ...full.slice(1)]], ["4.101"], 11)
    expect(listener).not.toHaveBeenCalled()
    vi.advanceTimersByTime(0)
    expect(listener).toHaveBeenCalledTimes(1)
    expect([...store.all().keys()]).toEqual(["4.102", "4.103"])
    expect(store.feedTs()).toBe(11)

    store.delta([], ["4.102"], 12)
    vi.advanceTimersByTime(499)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.all().size).toBe(2)
    vi.advanceTimersByTime(1)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(store.all().size).toBe(1)
  })

  it("keeps the published map stable between notifications", () => {
    const store = new VehicleStore({ notifyMs: 0 })
    store.snapshot(VEHICLE_FIELDS_FULL, [full], 1)
    vi.advanceTimersByTime(0)
    const a = store.all()
    expect(store.all()).toBe(a)
    store.delta([], [], 2)
    expect(store.all()).toBe(a)
    vi.advanceTimersByTime(0)
    expect(store.all()).not.toBe(a)
  })
})
