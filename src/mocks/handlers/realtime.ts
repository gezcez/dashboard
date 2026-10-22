import { ws, type WebSocketHandler } from "msw"
import {
  VEHICLE_FIELDS_COMPACT,
  VEHICLE_FIELDS_FULL,
  WS_PROTOCOL_VERSION,
  WsClientMessageSchema,
  type BindingStatusView,
  type TrackerLogLine,
  type WsServerMessage,
} from "@/api/realtime-types"
import { pollAt, pollLine, pollsBefore, nowSec, type TransitState } from "../transit/state"
import type { Caller, Ctx } from "./context"
import { liveFor, vehicleRow } from "./transit"

const idOf = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : ""

/** How often the fake tracker "polls" and pushes deltas. Faster than Kentkart, for a lively map. */
export const MOCK_POLL_MS = 5000
const HEARTBEAT_MS = 20_000

interface VehiclesSub {
  channel: "vehicles"
  id: string
  seq: number
  networkId: number
  full: boolean
  routes: string[] | null
  known: Map<string, string>
}
interface StatusSub {
  channel: "tracker.status"
  id: string
  seq: number
  networkId: number | null
}
interface LogsSub {
  channel: "tracker.logs"
  id: string
  seq: number
  bindingId: number
  lastPoll: number
}
type Sub = VehiclesSub | StatusSub | LogsSub

/**
 * A fake realtime gateway (backend plan 6.10) on MSW's WebSocket interception: hello, auth by
 * first message, vehicles snapshots and deltas from the simulator, binding status, tracker
 * status events and log lines, pings. Permissions are checked like the real gateway.
 */
export function realtimeHandlers(
  ctx: Ctx,
  transit: TransitState,
  wsUrl: string,
): WebSocketHandler[] {
  const link = ws.link(wsUrl)

  const handler = link.addEventListener("connection", ({ client }) => {
    let caller: Caller | null = null
    const subs = new Map<string, Sub>()
    const send = (m: WsServerMessage) => {
      client.send(JSON.stringify(m))
    }
    const error = (code: string, message: string, id?: string) =>
      send({ type: "error", code, message, ...(id ? { id } : {}) })

    send({
      type: "hello",
      v: WS_PROTOCOL_VERSION,
      heartbeat_s: HEARTBEAT_MS / 1000,
      limits: { max_subs: 8, max_routes_per_sub: 12, max_bbox_span_deg: 0.5 },
    })

    const can = (key: string, networkId?: number) =>
      caller !== null && ctx.holds(caller, key, networkId)

    const rows = (sub: VehiclesSub) =>
      liveFor(transit, sub.networkId).filter((v) => !sub.routes || sub.routes.includes(v.route_id))

    const snapshot = (sub: VehiclesSub) => {
      const list = rows(sub)
      sub.known = new Map(list.map((v) => [v.id, JSON.stringify(vehicleRow(v, sub.full))]))
      send({
        type: "snapshot",
        sub: sub.id,
        seq: ++sub.seq,
        feed_ts: nowSec() - 8,
        fields: [...(sub.full ? VEHICLE_FIELDS_FULL : VEHICLE_FIELDS_COMPACT)],
        vehicles: list.map((v) => vehicleRow(v, sub.full)),
      })
    }

    const statusMessage = (sub: VehiclesSub, view: BindingStatusView) =>
      send({
        type: "status",
        sub: sub.id,
        seq: ++sub.seq,
        network: sub.networkId,
        binding: view.binding_id,
        state: view.state,
        message: view.message,
      })

    const event = (sub: StatusSub | LogsSub, data: unknown) =>
      send({ type: "event", sub: sub.id, seq: ++sub.seq, data })

    const subscribe = (id: string, channel: string, params: Record<string, unknown>) => {
      const previous = subs.get(id)
      if (previous) subs.delete(id)
      if (subs.size >= 8) return error("RATE_LIMITED", "at most 8 subscriptions", id)
      switch (channel) {
        case "vehicles": {
          const n = ctx.network(idOf(params.network))
          if (!n) return error("NOT_FOUND", "network not found", id)
          const full = params.detail === "full"
          if (full && !can("vehicles.live.read", n.id))
            return error("PERMISSION_MISSING", "vehicles.live.read", id)
          const sub: VehiclesSub = {
            channel: "vehicles",
            id,
            seq: 0,
            networkId: n.id,
            full,
            routes: Array.isArray(params.routes) ? (params.routes as string[]) : null,
            known: new Map(),
          }
          subs.set(id, sub)
          snapshot(sub)
          for (const b of transit.bindingsOf(n.id)) {
            const view = transit.statusView(b)
            if (view.state !== "ok") statusMessage(sub, view)
          }
          return
        }
        case "tracker.status": {
          const n = params.network === undefined ? null : ctx.network(idOf(params.network))
          if (params.network !== undefined && !n) return error("NOT_FOUND", "network not found", id)
          if (!can("tracker.read", n?.id)) return error("PERMISSION_MISSING", "tracker.read", id)
          const sub: StatusSub = { channel: "tracker.status", id, seq: 0, networkId: n?.id ?? null }
          subs.set(id, sub)
          const bindings = n ? transit.bindingsOf(n.id) : transit.bindings
          event(sub, { kind: "snapshot", bindings: bindings.map((b) => transit.statusView(b)) })
          return
        }
        case "tracker.logs": {
          const b = transit.binding(Number(params.binding))
          if (!b) return error("NOT_FOUND", "binding not found", id)
          if (!can("tracker.read", b.network.networkId))
            return error("PERMISSION_MISSING", "tracker.read", id)
          const end = transit.frozenAt(b) ?? nowSec()
          const sub: LogsSub = {
            channel: "tracker.logs",
            id,
            seq: 0,
            bindingId: b.id,
            lastPoll: Math.floor(end / b.pollIntervalS) * b.pollIntervalS,
          }
          subs.set(id, sub)
          for (const p of pollsBefore(b, end, 100, 0).reverse()) event(sub, pollLine(b, p))
          return
        }
        default:
          return error("VALIDATION_FAILED", `channel ${channel} is not available in mock mode`, id)
      }
    }

    client.addEventListener("message", (e) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(typeof e.data === "string" ? e.data : "")
      } catch {
        client.close(4400, "malformed")
        return
      }
      const result = WsClientMessageSchema.safeParse(parsed)
      if (!result.success) {
        client.close(4400, "malformed")
        return
      }
      const m = result.data
      switch (m.type) {
        case "auth": {
          const c = ctx.caller(
            new Request("https://ws.mock/", { headers: { authorization: `Bearer ${m.token}` } }),
          )
          if (c instanceof Response) {
            client.close(4401, "auth invalid")
            return
          }
          caller = c
          send({ type: "auth_ok", exp: nowSec() + 900 })
          return
        }
        case "subscribe":
          subscribe(m.id, m.channel, m.params)
          return
        case "unsubscribe":
          subs.delete(m.id)
          return
        case "ping":
          send({ type: "pong", t: m.t })
          return
        case "pong":
          return
      }
    })

    // ---- pushes ---------------------------------------------------------------------------

    const onStatus = (view: BindingStatusView, networkId: number) => {
      for (const sub of subs.values()) {
        if (sub.channel === "vehicles" && sub.networkId === networkId) {
          statusMessage(sub, view)
          snapshot(sub)
        } else if (sub.channel === "tracker.status" && (sub.networkId ?? networkId) === networkId)
          event(sub, { kind: "status", binding: view })
      }
    }
    const onLog = (line: TrackerLogLine) => {
      for (const sub of subs.values())
        if (sub.channel === "tracker.logs" && sub.bindingId === line.binding_id) event(sub, line)
    }
    transit.listeners.status.add(onStatus)
    transit.listeners.log.add(onLog)

    const tick = () => {
      for (const sub of subs.values()) {
        if (sub.channel === "vehicles") {
          const b = transit.bindingsOf(sub.networkId)[0]
          if (b && transit.frozenAt(b) !== null) continue
          const next = new Map<string, string>()
          const upsert: (string | number | null)[][] = []
          for (const v of rows(sub)) {
            const row = vehicleRow(v, sub.full)
            const key = JSON.stringify(row)
            next.set(v.id, key)
            if (sub.known.get(v.id) !== key) upsert.push(row)
          }
          const remove = [...sub.known.keys()].filter((id) => !next.has(id))
          sub.known = next
          if (upsert.length || remove.length)
            send({
              type: "delta",
              sub: sub.id,
              seq: ++sub.seq,
              feed_ts: nowSec() - 8,
              upsert,
              remove,
            })
        } else if (sub.channel === "tracker.status") {
          const bindings = sub.networkId ? transit.bindingsOf(sub.networkId) : transit.bindings
          for (const b of bindings) event(sub, { kind: "status", binding: transit.statusView(b) })
        } else {
          const b = transit.binding(sub.bindingId)
          if (!b || transit.frozenAt(b) !== null) continue
          const latest = Math.floor(nowSec() / b.pollIntervalS) * b.pollIntervalS
          for (let t = sub.lastPoll + b.pollIntervalS; t <= latest; t += b.pollIntervalS)
            event(sub, pollLine(b, pollAt(b, t)))
          sub.lastPoll = latest
        }
      }
    }
    const pollTimer = setInterval(tick, MOCK_POLL_MS)
    const pingTimer = setInterval(() => send({ type: "ping", t: Date.now() }), HEARTBEAT_MS)

    client.addEventListener("close", () => {
      clearInterval(pollTimer)
      clearInterval(pingTimer)
      transit.listeners.status.delete(onStatus)
      transit.listeners.log.delete(onLog)
    })
  })

  return [handler]
}
