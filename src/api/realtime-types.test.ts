import { describe, expect, it } from "vitest"
import { WsClientMessageSchema, WsServerMessageSchema } from "./realtime-types"

// Messages as written in backend plan 6.10.
const SERVER = [
  {
    type: "hello",
    v: 1,
    heartbeat_s: 20,
    limits: { max_subs: 8, max_routes_per_sub: 12, max_bbox_span_deg: 0.5 },
  },
  { type: "auth_ok", exp: 1_760_000_900 },
  {
    type: "snapshot",
    sub: "v1",
    seq: 1,
    feed_ts: 1_760_000_000,
    fields: [
      "id",
      "lat",
      "lon",
      "bearing",
      "speed_ms",
      "route_id",
      "direction",
      "trip_id",
      "stop_seq",
      "status",
      "vehicle_ts",
      "flags",
    ],
    vehicles: [["4.101", 40.76543, 29.91234, 90, 8.5, "4.42041", 0, null, 7, 2, 1_759_999_990, 0]],
  },
  { type: "delta", sub: "v1", seq: 2, feed_ts: 1_760_000_020, upsert: [], remove: ["4.101"] },
  {
    type: "status",
    sub: "v1",
    seq: 3,
    network: 4,
    binding: 4,
    state: "paused",
    message: "by phasenull",
  },
  { type: "event", sub: "t1", seq: 1, data: { kind: "snapshot", bindings: [] } },
  { type: "error", id: "t1", code: "PERMISSION_MISSING", message: "tracker.read" },
  { type: "ping", t: 1 },
] as const

describe("realtime protocol v1 schemas", () => {
  it.each(SERVER.map((m) => [m.type, m]))("parses a server %s message", (_type, message) => {
    expect(WsServerMessageSchema.safeParse(message).success).toBe(true)
  })

  it("rejects unknown message types and states", () => {
    expect(WsServerMessageSchema.safeParse({ type: "nope" }).success).toBe(false)
    expect(
      WsServerMessageSchema.safeParse({
        type: "status",
        sub: "a",
        seq: 1,
        network: 1,
        binding: 1,
        state: "x",
      }).success,
    ).toBe(false)
  })

  it("validates client messages", () => {
    expect(
      WsClientMessageSchema.safeParse({
        type: "subscribe",
        id: "v1",
        channel: "vehicles",
        params: { network: 4, detail: "full" },
      }).success,
    ).toBe(true)
    expect(WsClientMessageSchema.safeParse({ type: "auth", token: "" }).success).toBe(false)
  })
})
