import { z } from "zod"
import type { components } from "./schema.gen"

/**
 * The realtime WebSocket protocol v1 (backend plan 6.10), written in this repo. The backend
 * publishes the same messages in openapi.json as `WsClientMessage` / `WsServerMessage`; the
 * `satisfies` checks at the bottom fail to compile when the generated types drift from these.
 */

export const WS_PROTOCOL_VERSION = 1

export const WS_CLOSE = {
  malformed: 4400,
  authInvalid: 4401,
  rateLimited: 4429,
  goingAway: 1001,
  overloaded: 1013,
} as const

/** Compact vehicle row order; `detail: "full"` appends FULL_EXTRA. */
export const VEHICLE_FIELDS_COMPACT = [
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
] as const
export const VEHICLE_FIELDS_FULL = [
  ...VEHICLE_FIELDS_COMPACT,
  "plate",
  "stop_id",
  "headsign",
] as const

/** Bits of the `flags` field. */
export const VEHICLE_FLAGS = { stale: 1, accessible: 2, at_terminus: 4 } as const

/** GTFS-RT VehicleStopStatus in the `status` field. */
export const VEHICLE_STOP_STATUS = { incoming: 0, stopped: 1, inTransit: 2 } as const

export const ChannelSchema = z.enum([
  "vehicles",
  "departures",
  "tracker.status",
  "tracker.logs",
  "ops.logs",
  "health",
  "jobs",
])
export type Channel = z.infer<typeof ChannelSchema>

export const BindingStateSchema = z.enum(["ok", "degraded", "down", "paused", "killed", "unknown"])
export type BindingState = z.infer<typeof BindingStateSchema>

const VehicleRow = z.array(z.union([z.string(), z.number(), z.null()]))

export const WsClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("auth"), token: z.string().min(1) }),
  z.object({
    type: z.literal("subscribe"),
    id: z.string().min(1).max(64),
    channel: ChannelSchema,
    params: z.record(z.string(), z.unknown()),
  }),
  z.object({ type: z.literal("unsubscribe"), id: z.string().min(1).max(64) }),
  z.object({ type: z.literal("ping"), t: z.number().optional() }),
  z.object({ type: z.literal("pong"), t: z.number().optional() }),
])
export type WsClientMessage = z.infer<typeof WsClientMessageSchema>

export const WsServerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hello"),
    v: z.literal(WS_PROTOCOL_VERSION),
    heartbeat_s: z.number().int(),
    limits: z.object({
      max_subs: z.number().int(),
      max_routes_per_sub: z.number().int(),
      max_bbox_span_deg: z.number(),
    }),
  }),
  z.object({ type: z.literal("auth_ok"), exp: z.number().int() }),
  z.object({
    type: z.literal("snapshot"),
    sub: z.string(),
    seq: z.number().int(),
    feed_ts: z.number().int().nullable(),
    fields: z.array(z.string()),
    vehicles: z.array(VehicleRow),
  }),
  z.object({
    type: z.literal("delta"),
    sub: z.string(),
    seq: z.number().int(),
    feed_ts: z.number().int().nullable(),
    upsert: z.array(VehicleRow),
    remove: z.array(z.string()),
  }),
  z.object({
    type: z.literal("departures"),
    sub: z.string(),
    seq: z.number().int(),
    stop: z.string(),
    generated_at: z.string(),
    items: z.array(z.unknown()),
  }),
  z.object({
    type: z.literal("status"),
    sub: z.string(),
    seq: z.number().int(),
    network: z.number().int(),
    binding: z.number().int(),
    state: BindingStateSchema,
    message: z.string().nullable().optional(),
  }),
  z.object({ type: z.literal("event"), sub: z.string(), seq: z.number().int(), data: z.unknown() }),
  z.object({
    type: z.literal("error"),
    id: z.string().optional(),
    code: z.string(),
    message: z.string(),
  }),
  z.object({ type: z.literal("ping"), t: z.number() }),
  z.object({ type: z.literal("pong"), t: z.number().optional() }),
])
export type WsServerMessage = z.infer<typeof WsServerMessageSchema>
export type SubscriptionMessage = Extract<WsServerMessage, { sub: string }>

/** `tracker.status` event payloads (data of an `event` message). */
export type TrackerStatusEvent =
  | { kind: "snapshot"; bindings: BindingStatusView[] }
  | { kind: "status"; binding: BindingStatusView }

export interface BindingStatusView {
  binding_id: number
  state: BindingState
  message: string | null
  last_feed_at: string | null
  last_poll_at: string | null
  last_outcome: string | null
  consecutive_failures: number
  next_poll_at: string | null
  interval_s: number | null
  url_variant: "primary" | "fallback" | null
  live_vehicles: number
  subscribers: number
  credentials: {
    realm: string
    state: "ok" | "missing" | "refreshing" | "auth_failed" | "unknown"
    expires_at: string | null
    refreshed_at: string | null
    failures: number
    secrets_set: Record<string, boolean>
  } | null
}

/** `tracker.logs` event payload. */
export interface TrackerLogLine {
  at: number
  binding_id: number
  level: "debug" | "info" | "warn" | "error"
  message: string
}

// ---- drift checks against the backend's published schemas (src/api/schema.gen.ts) -------------

type Gen = components["schemas"]
type Assert<T extends true> = T
/** Every message the backend can send parses with WsServerMessageSchema. */
export type ServerMessageDriftCheck = Assert<
  Gen["WsServerMessage"] extends WsServerMessage ? true : false
>
/** The REST tracker status is the same view the tracker.status channel pushes. */
export type BindingStatusDriftCheck = Assert<
  Gen["TrackerOverviewDto"]["bindings"][number] extends BindingStatusView ? true : false
>
