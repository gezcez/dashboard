import type { BindingStatusView, TrackerLogLine } from "@/api/realtime-types"
import type { components } from "@/api/schema.gen"
import { FIXTURE_NOW } from "../fixtures"
import { KOCAELI, SAKARYA, type NetworkDef } from "./networks"
import { hash, liveVehicles, localHour, serviceLevel } from "./sim"

type S = components["schemas"]
type Binding = S["DashBindingDto"]
type Poll = S["PollPageDto"]["items"][number]

export const nowSec = () => Math.floor(Date.now() / 1000)
const iso = (t: number | null) => (t === null ? null : new Date(t * 1000).toISOString())

const CAPABILITIES: Binding["capabilities"] = {
  stops: true,
  routes: true,
  timetables: true,
  shapes: true,
  realtime_vehicles: true,
  realtime_departures: "estimated",
  trip_updates: false,
  alerts: false,
  card: null,
  trip_planner: false,
  bike_share: false,
}

export interface BindingRuntime {
  id: number
  network: NetworkDef
  providerKey: string
  externalRef: string
  status: "active" | "paused" | "disabled"
  pausedAt: number | null
  pausedBy: string | null
  pauseReason: string | null
  urlVariant: "primary" | "fallback"
  fallbackSince: number | null
  fallbackReason: string | null
  pollIntervalS: number
  idleIntervalS: number
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string | null
  tokenExpiresAt: number
  tokenRefreshedAt: number
  tokenFailures: number
  /** Polls at or after this were triggered by "poll now" (shown in the log). */
  extraPolls: number[]
}

export interface ProviderRuntime {
  key: string
  name: string
  enabled: boolean
  killedReason: string | null
  killedAt: number | null
}

export const KENTKART_CONFIG_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["region", "base_url"],
  properties: {
    region: { type: "string", pattern: "^\\d{3}$", description: "Kentkart region code" },
    base_url: { type: "string", format: "uri" },
    fallback_url: { type: "string", format: "uri" },
    staff_route_patterns: {
      type: "array",
      items: { type: "string" },
      description: "Regular expressions for staff-only routes (for example ^419)",
    },
    test_plates: { type: "array", items: { type: "string" } },
    speed_outlier_ms: { type: "number", minimum: 10, maximum: 60, default: 30 },
    dedup: { type: "boolean", default: true },
  },
}

export function createTransitState() {
  const t0 = nowSec()
  const bindings: BindingRuntime[] = [
    {
      id: KOCAELI.bindingId,
      network: KOCAELI,
      providerKey: "kentkart",
      externalRef: KOCAELI.externalRef,
      status: "active",
      pausedAt: null,
      pausedBy: null,
      pauseReason: null,
      urlVariant: "primary",
      fallbackSince: null,
      fallbackReason: null,
      pollIntervalS: 10,
      idleIntervalS: 60,
      config: {
        region: "004",
        base_url: "https://service.kentkart.com/rl1",
        fallback_url: "https://service.kentkart.com/rl2",
        staff_route_patterns: ["^419"],
        test_plates: ["BLD4TEST"],
        speed_outlier_ms: 30,
        dedup: true,
      },
      createdAt: new Date(FIXTURE_NOW - 300 * 86_400_000).toISOString(),
      updatedAt: new Date(FIXTURE_NOW - 12 * 86_400_000).toISOString(),
      tokenExpiresAt: t0 + 41 * 60,
      tokenRefreshedAt: t0 - 19 * 60,
      tokenFailures: 0,
      extraPolls: [],
    },
    {
      id: SAKARYA.bindingId,
      network: SAKARYA,
      providerKey: "kentkart",
      externalRef: SAKARYA.externalRef,
      status: "active",
      pausedAt: null,
      pausedBy: null,
      pauseReason: null,
      urlVariant: "fallback",
      fallbackSince: t0 - 2 * 3600 - 17 * 60,
      fallbackReason: "protobuf decode failed on /rl1 (3 in a row)",
      pollIntervalS: 15,
      idleIntervalS: 60,
      config: {
        region: "054",
        base_url: "https://service.kentkart.com/rl1",
        fallback_url: "https://service.kentkart.com/rl2",
        staff_route_patterns: [],
        test_plates: [],
        speed_outlier_ms: 30,
        dedup: true,
      },
      createdAt: new Date(FIXTURE_NOW - 200 * 86_400_000).toISOString(),
      updatedAt: null,
      tokenExpiresAt: t0 + 6 * 60,
      tokenRefreshedAt: t0 - 54 * 60,
      tokenFailures: 2,
      extraPolls: [],
    },
  ]
  const providers: ProviderRuntime[] = [
    { key: "kentkart", name: "Kentkart", enabled: true, killedReason: null, killedAt: null },
    {
      key: "fake",
      name: "Replay (fake provider)",
      enabled: true,
      killedReason: null,
      killedAt: null,
    },
  ]

  const listeners = {
    status: new Set<(status: BindingStatusView, networkId: number) => void>(),
    log: new Set<(line: TrackerLogLine) => void>(),
  }

  const state = {
    bindings,
    providers,
    listeners,
    issues: createIssues(),

    binding(id: number | string) {
      return bindings.find((b) => String(b.id) === String(id))
    },
    bindingsOf(networkId: number) {
      return bindings.filter((b) => b.network.networkId === networkId)
    },
    provider(key: string) {
      return providers.find((p) => p.key === key)
    },
    killed(b: BindingRuntime) {
      return !(state.provider(b.providerKey)?.enabled ?? true)
    },
    /** Feed time the binding is frozen at (paused or killed), else null. */
    frozenAt(b: BindingRuntime): number | null {
      if (b.pausedAt !== null) return b.pausedAt
      const p = state.provider(b.providerKey)
      return p && !p.enabled ? (p.killedAt ?? nowSec()) : null
    },
    liveState(b: BindingRuntime): BindingStatusView["state"] {
      if (state.killed(b)) return "killed"
      if (b.status === "paused") return "paused"
      if (b.urlVariant === "fallback") return "degraded"
      return "ok"
    },
    statusView(b: BindingRuntime, t = nowSec()): BindingStatusView {
      const st = state.liveState(b)
      const frozen = state.frozenAt(b)
      const lastPoll = frozen ?? Math.floor(t / b.pollIntervalS) * b.pollIntervalS
      const outcome = frozen ? null : pollAt(b, lastPoll).outcome
      return {
        binding_id: b.id,
        state: st,
        message:
          st === "paused"
            ? `Paused by ${b.pausedBy ?? "?"}: ${b.pauseReason ?? ""}`
            : st === "killed"
              ? `Provider ${b.providerKey} disabled: ${state.provider(b.providerKey)?.killedReason ?? ""}`
              : st === "degraded"
                ? `Fallback since ${new Date((b.fallbackSince ?? t) * 1000).toISOString().slice(11, 16)} UTC: ${b.fallbackReason ?? ""}`
                : null,
        last_feed_at: iso(lastPoll - 12),
        last_poll_at: iso(lastPoll),
        last_outcome: outcome,
        consecutive_failures: b.network === SAKARYA ? 1 : 0,
        next_poll_at: frozen ? null : iso(lastPoll + b.pollIntervalS),
        interval_s: b.pollIntervalS,
        url_variant: b.urlVariant,
        live_vehicles: frozen ? 0 : liveVehicles(b.network, t).length,
        subscribers: 2,
        credentials: {
          realm: `kentkart:${b.externalRef}`,
          state: b.tokenFailures > 1 ? "refreshing" : "ok",
          expires_at: iso(b.tokenExpiresAt),
          refreshed_at: iso(b.tokenRefreshedAt),
          failures: b.tokenFailures,
          secrets_set: {
            [`KENTKART_${b.externalRef}_CLIENT_ID`]: true,
            [`KENTKART_${b.externalRef}_REFRESH_TOKEN`]: b.network !== SAKARYA,
          },
        },
      }
    },
    toBinding(b: BindingRuntime): Binding {
      const sv = state.statusView(b)
      return {
        id: b.id,
        network_id: b.network.networkId,
        provider_key: b.providerKey,
        external_ref: b.externalRef,
        config: b.config,
        capabilities: { ...CAPABILITIES, timetables: b.network.timetable },
        poll_interval_s: b.pollIntervalS,
        idle_poll_interval_s: b.idleIntervalS,
        status: b.status,
        disabled_reason: null,
        state: sv.state,
        state_message: sv.message,
        last_feed_at: sv.last_feed_at,
        replayed: false,
        created_at: b.createdAt,
        updated_at: b.updatedAt,
      }
    },
    emitStatus(b: BindingRuntime) {
      const view = state.statusView(b)
      for (const l of listeners.status) l(view, b.network.networkId)
    },
    emitLog(line: TrackerLogLine) {
      for (const l of listeners.log) l(line)
    },
  }
  return state
}

export type TransitState = ReturnType<typeof createTransitState>

// ---- polls ------------------------------------------------------------------------------------

const OUTCOMES: [number, string][] = [
  [0.9, "ok"],
  [0.93, "duplicate_header"],
  [0.945, "empty"],
  [0.965, "upstream_error"],
  [0.98, "timeout"],
  [0.99, "decode_error"],
  [1, "rate_limited"],
]

/** A gap with no polls every night (02:10 to 02:35 local), drawn as a band on the charts. */
export function inGap(t: number): boolean {
  const local = (t + 3 * 3600) % 86_400
  return local >= 2 * 3600 + 10 * 60 && local < 2 * 3600 + 35 * 60
}

export function pollAt(b: BindingRuntime, t: number): Poll {
  const h = hash(`${String(b.id)}:${String(t)}`)
  const errorBoost = b.network === SAKARYA ? 0.06 : 0
  let outcome = "ok"
  for (const [p, o] of OUTCOMES) {
    if (h + errorBoost * (o === "ok" ? 1 : 0) < p) {
      outcome = o
      break
    }
  }
  if (b.network === SAKARYA && h > 0.86 && h < 0.92) outcome = "decode_error"
  const ok = outcome === "ok" || outcome === "duplicate_header" || outcome === "empty"
  const vehicles =
    outcome === "ok" ? Math.round(serviceLevel(t) * vehicleCount(b.network) * 0.97) : 0
  const dropped =
    outcome === "ok"
      ? {
          staff: b.network === KOCAELI && localHour(t) >= 6 ? 1 : 0,
          test: b.network === KOCAELI && hash(`${String(t)}:t`) < 0.3 ? 1 : 0,
          stale: Math.floor(hash(`${String(t)}:s`) * 4),
          no_route: 0,
          out_of_bbox: 0,
          invalid: hash(`${String(t)}:i`) < 0.05 ? 1 : 0,
        }
      : null
  const dup = outcome === "ok" ? Math.floor(hash(`${String(t)}:d`) * vehicles * 0.15) : 0
  const accepted = Math.max(0, vehicles - Object.values(dropped ?? {}).reduce((a, n) => a + n, 0))
  const duration = Math.round(
    220 + hash(`${String(t)}:ms`) ** 3 * 2400 + (b.network === SAKARYA ? 300 : 0),
  )
  return {
    id: Math.floor(t / 5) * 100 + b.id,
    binding_id: b.id,
    started_at: new Date(t * 1000).toISOString(),
    duration_ms: outcome === "timeout" ? 10_000 : duration,
    url_variant: b.fallbackSince !== null && t >= b.fallbackSince ? "fallback" : "primary",
    http_status:
      outcome === "upstream_error"
        ? 502
        : outcome === "rate_limited"
          ? 429
          : outcome === "timeout"
            ? null
            : 200,
    outcome,
    feed_at: ok
      ? new Date((t - 6 - Math.floor(hash(`${String(t)}:lag`) * 20)) * 1000).toISOString()
      : null,
    entities: vehicles,
    accepted,
    inserted: Math.max(0, accepted - dup),
    dropped,
    error:
      outcome === "upstream_error"
        ? "HTTP 502 Bad Gateway from service.kentkart.com"
        : outcome === "timeout"
          ? "No response within 10 s"
          : outcome === "decode_error"
            ? "protobuf decode failed: index out of range at offset 4117"
            : outcome === "rate_limited"
              ? "HTTP 429, Retry-After 30"
              : null,
  }
}

function vehicleCount(n: NetworkDef): number {
  return n.routes.reduce((a, r) => a + r.fleet * 2, 0)
}

/** Polls newest first, starting from the last poll before `before`. */
export function pollsBefore(
  b: BindingRuntime,
  before: number,
  limit: number,
  offset: number,
): Poll[] {
  const out: Poll[] = []
  let t = Math.floor(before / b.pollIntervalS) * b.pollIntervalS
  let skipped = 0
  let guard = 0
  while (out.length < limit && guard++ < 50_000) {
    if (!inGap(t)) {
      if (skipped >= offset) out.push(pollAt(b, t))
      else skipped++
    }
    t -= b.pollIntervalS
  }
  return out
}

export function pollLine(b: BindingRuntime, p: Poll): TrackerLogLine {
  const t = Math.floor(new Date(p.started_at).getTime() / 1000)
  const ok = p.outcome === "ok" || p.outcome === "empty" || p.outcome === "duplicate_header"
  const dropped = Object.entries(p.dropped ?? {})
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k} ${String(n)}`)
    .join(", ")
  return {
    at: t,
    binding_id: b.id,
    level: ok ? (p.outcome === "ok" ? "info" : "warn") : "error",
    message: ok
      ? `poll ${p.outcome} via ${p.url_variant ?? "primary"}: ${String(p.entities)} entities in ${String(p.duration_ms)} ms, inserted ${String(p.inserted)}${dropped ? `, dropped ${dropped}` : ""}`
      : `poll ${p.outcome} via ${p.url_variant ?? "primary"} after ${String(p.duration_ms)} ms: ${p.error ?? ""}`,
  }
}

// ---- issues -----------------------------------------------------------------------------------

function createIssues(): S["IssueDto"][] {
  const day = 86_400_000
  const at = (daysAgo: number) => new Date(FIXTURE_NOW - daysAgo * day).toISOString()
  const base = (
    n: number,
    type: S["IssueDto"]["type"],
    severity: S["IssueDto"]["severity"],
    entity: S["IssueDto"]["entity"],
    details: string,
    first: number,
    last: number,
    status: S["IssueDto"]["status"] = "open",
  ): S["IssueDto"] => ({
    id: `iss_${String(n).padStart(4, "0")}`,
    type,
    severity,
    status,
    entity,
    details,
    first_detected_at: at(first),
    last_detected_at: at(last),
    occurrences: Math.round(1 + hash(`iss${String(n)}`) * 40),
    reason: status === "ignored" ? "Known upstream quirk, Kentkart ticket 8812" : null,
    updated_by: null,
    updated_at: status === "open" ? null : at(last),
  })
  return [
    base(
      1,
      "staff_route_leak",
      "critical",
      { type: "route", id: "4.41900", label: "419" },
      "Vehicles on staff route 419 reached the public vehicles channel before the filter was deployed.",
      9,
      0.1,
    ),
    base(
      2,
      "route_not_in_catalog",
      "warning",
      { type: "route", id: "4.42777", label: "777" },
      "Route code 42777 appears in the live feed but not in the synced catalogue.",
      3,
      0.2,
    ),
    base(
      3,
      "route_never_seen",
      "info",
      { type: "route", id: "4.42500", label: "500" },
      "No vehicle on this route in the last 7 days.",
      8,
      1,
      "acknowledged",
    ),
    base(
      4,
      "duplicate_stops",
      "warning",
      { type: "stop", id: "4.42045002", label: "İzmit (45)" },
      "Two stops within 11 m with different ids (4.42045002, 4.42012002).",
      40,
      1,
    ),
    base(
      5,
      "stop_without_coordinates",
      "warning",
      { type: "stop", id: "4.42030099", label: "Kartepe Teleferik" },
      "Stop has lat/lon 0,0 in the static feed.",
      22,
      22,
      "resolved",
    ),
    base(
      6,
      "trip_without_timetable",
      "info",
      { type: "trip", id: "4.42150.1.0", label: "150 to Gölcük 06:40" },
      "Trip has no departures in pathInfo for weekdays.",
      15,
      2,
    ),
    base(
      7,
      "duplicate_stops",
      "info",
      { type: "stop", id: "4.42007001", label: "Otogar (7)" },
      "Two stops within 14 m.",
      60,
      30,
      "ignored",
    ),
    base(
      8,
      "route_not_in_catalog",
      "critical",
      { type: "route", id: "4.42999", label: "999" },
      "Unknown route code with 4 vehicles reporting.",
      1,
      0.05,
    ),
    base(
      9,
      "staff_route_leak",
      "warning",
      { type: "vehicle", id: "4.9001", label: "BLD4TEST" },
      "Test device plate reported on route 41C.",
      6,
      0.5,
    ),
    base(
      10,
      "route_never_seen",
      "info",
      { type: "route", id: "54.54099", label: "99" },
      "No vehicle in 7 days.",
      12,
      12,
    ),
    base(
      11,
      "trip_without_timetable",
      "info",
      { type: "route", id: "54.54001", label: "1" },
      "Sakarya has no timetable data.",
      30,
      0.3,
    ),
  ]
}
