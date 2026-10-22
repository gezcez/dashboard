import type { HttpHandler } from "msw"
import type { components } from "@/api/schema.gen"
import { VEHICLE_FIELDS_COMPACT } from "@/api/realtime-types"
import { encodePolyline } from "@/lib/geo"
import { FIXTURE_NOW } from "../fixtures"
import {
  liveVehicles,
  networkSim,
  positionAt,
  serviceLevel,
  simNetworkOf,
  simRoute,
  simStop,
  simVehicle,
  type SimRoute,
  type SimState,
} from "../transit/sim"
import { inGap, nowSec, type TransitState } from "../transit/state"
import { apiError, byNumber, byString, matches, paginate, type Ctx } from "./context"

type S = components["schemas"]
type RouteItem = S["RoutePageDto"]["items"][number]

export const CITY_ROWS: S["DashCityDto"][] = [
  {
    id: 41,
    slug: "kocaeli",
    name: { tr: "Kocaeli", en: "Kocaeli" },
    country_code: "TR",
    timezone: "Europe/Istanbul",
    center_lat: 40.7654,
    center_lon: 29.9408,
    bbox: [29.35, 40.6, 30.25, 41.15],
    status: "public",
    sort: 1,
  },
  {
    id: 54,
    slug: "sakarya",
    name: { tr: "Sakarya", en: "Sakarya" },
    country_code: "TR",
    timezone: "Europe/Istanbul",
    center_lat: 40.7806,
    center_lon: 30.4036,
    bbox: [30.2, 40.6, 30.7, 40.95],
    status: "public",
    sort: 2,
  },
  {
    id: 34,
    slug: "istanbul",
    name: { tr: "İstanbul", en: "Istanbul" },
    country_code: "TR",
    timezone: "Europe/Istanbul",
    center_lat: 41.0082,
    center_lon: 28.9784,
    bbox: null,
    status: "draft",
    sort: 3,
  },
]

const MODE = { 0: "tram", 3: "bus" } as const

export function routeItem(r: SimRoute): RouteItem {
  return {
    id: r.id,
    network_id: r.network.networkId,
    short_name: r.def.short,
    long_name: r.def.long,
    agency: r.def.agency,
    route_type: r.def.type,
    mode: MODE[r.def.type],
    colour: r.def.colour,
    text_colour: "FFFFFF",
  }
}

/** Compact or full row in the 6.10 order. */
export function vehicleRow(v: SimState, full: boolean): (string | number | null)[] {
  const row: (string | number | null)[] = [
    v.id,
    v.lat,
    v.lon,
    v.bearing,
    v.speed,
    v.route_id,
    v.direction,
    v.trip_id,
    v.stop_seq,
    v.status,
    v.vts,
    v.flags,
  ]
  if (full) row.push(v.plate, v.stop_id, v.headsign)
  return row
}

/** Live vehicles for a network as the feed reports them now (paused bindings freeze). */
export function liveFor(transit: TransitState, networkId: number, t = nowSec()): SimState[] {
  const sim = simNetworkOf(networkId)
  if (!sim) return []
  const binding = transit.bindingsOf(networkId)[0]
  const frozenAt = binding ? transit.frozenAt(binding) : null
  return liveVehicles(sim.network, t, { frozenAt })
}

export function transitHandlers(ctx: Ctx, transit: TransitState): HttpHandler[] {
  const { http, wait, authorize } = ctx
  // Backend operations declare only 200 and `default`; a plain Response satisfies openapi-msw.
  const notFound = (what: string): Response => apiError(404, "NOT_FOUND", `${what} not found`)

  return [
    http.get("/v1/dash/cities", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/cities")
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: CITY_ROWS })
    }),

    http.get("/v1/networks/{networkId}", async ({ params, response }) => {
      await wait()
      const n = ctx.network(params.networkId)
      if (!n) return notFound("network")
      const sim = simNetworkOf(n.id)
      const binding = transit.bindingsOf(n.id)[0]
      return response(200).json({
        ok: true,
        data: {
          id: n.id,
          slug: n.slug,
          name: n.name,
          city_id: n.city.id,
          colour: "0B4F8A",
          operator_name: n.operator,
          status: binding
            ? transit.liveState(binding) === "ok"
              ? "active"
              : "degraded"
            : "disabled",
          status_message: null,
          modes: sim ? [...new Set(sim.routes.map((r) => MODE[r.def.type]))] : [],
          pack_version: null,
          attribution: [
            { name: "Kentkart", provider: "kentkart", url: "https://www.kentkart.com" },
          ],
          capabilities: {
            stops: true,
            routes: true,
            timetables: Boolean(sim?.network.timetable),
            shapes: true,
            realtime_vehicles: Boolean(sim),
            realtime_departures: sim ? "estimated" : "none",
            trip_updates: false,
            alerts: false,
            card: null,
            trip_planner: false,
            bike_share: false,
          },
          freshness: {
            realtime_feed_at: binding ? transit.statusView(binding).last_feed_at : null,
            static_synced_at: new Date(FIXTURE_NOW - 26 * 3600_000).toISOString(),
            static_may_be_outdated: false,
          },
          privacy: [
            {
              provider: "kentkart",
              pulled_data: [
                {
                  key: "vehicle_position",
                  is_collected: true,
                  can_optout: false,
                  details: "Bus GPS positions every 10 to 30 s, no rider data.",
                },
                {
                  key: "card_balance",
                  is_collected: false,
                  can_optout: true,
                  details: "Only when a rider looks up their own card.",
                },
              ],
            },
          ],
        },
      })
    }),

    http.get("/v1/networks/{networkId}/routes", async ({ request, params, response }) => {
      await wait()
      const sim = simNetworkOf(params.networkId)
      if (!sim) return notFound("network")
      const url = new URL(request.url)
      const q = url.searchParams.get("q")
      const items = sim.routes
        .map(routeItem)
        .filter((r) => matches(q, r.short_name, r.long_name, r.agency))
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          url,
          {
            short_name: (a, b) => a.short_name.localeCompare(b.short_name, "tr", { numeric: true }),
            long_name: byString((r) => r.long_name),
          },
          "short_name:asc",
        ),
      })
    }),

    http.get("/v1/networks/{networkId}/stops", async ({ request, params, response }) => {
      await wait()
      const sim = simNetworkOf(params.networkId)
      if (!sim) return notFound("network")
      const url = new URL(request.url)
      const q = url.searchParams.get("q")
      const bbox = url.searchParams.get("bbox")?.split(",").map(Number)
      const items = sim.stops
        .filter((s) => matches(q, s.name, s.ext))
        .filter(
          (s) =>
            !bbox ||
            bbox.length !== 4 ||
            (s.lon >= bbox[0]! && s.lat >= bbox[1]! && s.lon <= bbox[2]! && s.lat <= bbox[3]!),
        )
        .map((s) => ({
          id: s.id,
          network_id: sim.network.networkId,
          code: s.ext,
          name: s.name,
          lat: s.lat,
          lon: s.lon,
        }))
      return response(200).json({
        ok: true,
        data: paginate(
          items,
          url,
          { name: byString((s) => s.name), code: byString((s) => s.code) },
          "name:asc",
        ),
      })
    }),

    http.get("/v1/networks/{networkId}/vehicles", async ({ request, params, response }) => {
      await wait()
      const n = ctx.network(params.networkId)
      if (!n) return notFound("network")
      const url = new URL(request.url)
      const routes = url.searchParams.get("routes")?.split(",").filter(Boolean)
      const live = liveFor(transit, n.id).filter((v) => !routes || routes.includes(v.route_id))
      const binding = transit.bindingsOf(n.id)[0]
      return response(200).json({
        ok: true,
        data: {
          network_id: n.id,
          status: binding && transit.liveState(binding) === "ok" ? "active" : "degraded",
          message: null,
          feed_ts: nowSec() - 8,
          fields: [...VEHICLE_FIELDS_COMPACT],
          vehicles: live.map((v) => vehicleRow(v, false)),
        },
      })
    }),

    http.get("/v1/routes/{routeId}", async ({ params, response }) => {
      await wait()
      const r = simRoute(params.routeId)
      if (!r) return notFound("route")
      return response(200).json({
        ok: true,
        data: {
          ...routeItem(r),
          directions: r.directions.map((d) => ({
            direction: d.direction,
            headsign: d.headsign,
            patterns: [
              {
                id: d.patternId,
                headsign: d.headsign,
                length_m: Math.round(d.length),
                stops: d.stops.map((s, i) => ({
                  id: s.id,
                  network_id: r.network.networkId,
                  name: s.name,
                  lat: s.lat,
                  lon: s.lon,
                  seq: i + 1,
                  offset_s: Math.round((r.travelS * i) / (d.stops.length - 1)),
                })),
              },
            ],
          })),
        },
      })
    }),

    http.get("/v1/routes/{routeId}/shape", async ({ params, response }) => {
      await wait()
      const r = simRoute(params.routeId)
      if (!r) return notFound("route")
      return response(200).json({
        ok: true,
        data: {
          route_id: r.id,
          precision: 6,
          shapes: r.directions.map((d) => ({
            direction: d.direction,
            pattern_id: d.patternId,
            polyline: encodePolyline(d.coords),
          })),
        },
      })
    }),

    http.get("/v1/routes/{routeId}/timetable", async ({ request, params, response }) => {
      await wait()
      const r = simRoute(params.routeId)
      if (!r) return notFound("route")
      const url = new URL(request.url)
      const dayType = (url.searchParams.get("day_type") ?? "weekday") as
        "weekday" | "saturday" | "sunday"
      const headway = { weekday: 15, saturday: 20, sunday: 30 }[dayType] * 60
      return response(200).json({
        ok: true,
        data: {
          route_id: r.id,
          date: null,
          day_type: dayType,
          service_labels: [dayType === "weekday" ? "1" : dayType === "saturday" ? "2" : "3"],
          patterns: r.network.timetable
            ? r.directions.map((d) => {
                const departures = []
                for (let s = 6 * 3600 - d.direction * 600; s <= 23 * 3600; s += headway) {
                  const hh = String(Math.floor(s / 3600)).padStart(2, "0")
                  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
                  departures.push({
                    trip_id: `${d.patternId}.${hh}${mm}`,
                    start: `${hh}:${mm}`,
                    start_s: s,
                    headsign: d.headsign,
                  })
                }
                return {
                  id: d.patternId,
                  direction: d.direction,
                  headsign: d.headsign,
                  stops: d.stops.map((st, i) => ({
                    id: st.id,
                    name: st.name,
                    offset_s: Math.round((r.travelS * i) / (d.stops.length - 1)),
                  })),
                  departures,
                }
              })
            : [],
        },
      })
    }),

    http.get("/v1/stops/{stopId}", async ({ params, response }) => {
      await wait()
      const hit = simStop(params.stopId)
      if (!hit) return notFound("stop")
      const sim = networkSim(hit.network)
      const serving = sim.routes.filter((r) =>
        r.directions[0].stops.some((s) => s.id === hit.stop.id),
      )
      return response(200).json({
        ok: true,
        data: {
          id: hit.stop.id,
          network_id: hit.network.networkId,
          code: hit.stop.ext,
          name: hit.stop.name,
          lat: hit.stop.lat,
          lon: hit.stop.lon,
          routes: serving.map(routeItem),
        },
      })
    }),

    http.get("/v1/vehicles/{vehicleId}", async ({ params, response }) => {
      await wait()
      const v = simVehicle(params.vehicleId)
      if (!v) return notFound("vehicle")
      const live = liveFor(transit, v.route.network.networkId).find((x) => x.id === v.id)
      const t = nowSec()
      const state = live ?? positionAt(v, t)
      return response(200).json({
        ok: true,
        data: {
          id: v.id,
          network_id: v.route.network.networkId,
          label: null,
          plate: v.plate,
          accessible: v.accessible,
          live: Boolean(live),
          last_seen_at: new Date(state.vts * 1000).toISOString(),
          route: routeItem(v.route),
          direction: state.direction,
          trip_id: state.trip_id,
          stop_id: state.stop_id,
          stop_seq: state.stop_seq,
          position: {
            lat: state.lat,
            lon: state.lon,
            bearing: state.bearing,
            speed_ms: state.speed,
            vehicle_ts: state.vts,
            feed_ts: t - 8,
            stale: (state.flags & 1) !== 0,
          },
          current_run: null,
          runs_today: [],
        },
      })
    }),

    http.get(
      "/v1/dash/networks/{networkId}/vehicles/{vehicleId}/track",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/vehicles/{vehicleId}/track",
          params.networkId,
        )
        if (c instanceof Response) return c
        const v = simVehicle(params.vehicleId)
        if (!v) return notFound("vehicle")
        const since = Number(new URL(request.url).searchParams.get("since") ?? 3600) || 3600
        const end = nowSec()
        const track = {
          t: [] as number[],
          lat: [] as number[],
          lon: [] as number[],
          speed_ms: [] as (number | null)[],
        }
        for (let t = end - since; t <= end; t += 20) {
          const p = positionAt(v, v.stuck ? Math.min(t, end - 420) : t)
          track.t.push(t)
          track.lat.push(p.lat)
          track.lon.push(p.lon)
          track.speed_ms.push(p.speed)
        }
        // Duty span today: first and last service hour of this vehicle's rank.
        const startOfDay = end - ((end + 3 * 3600) % 86_400)
        let first: number | null = null
        for (let h = 4; h < 24; h++) {
          const t = startOfDay + h * 3600
          if (v.rank < serviceLevel(t)) {
            first = t
            break
          }
        }
        return response(200).json({
          ok: true,
          data: {
            vehicle_id: v.id,
            ...track,
            first_seen_at: first ? new Date(first * 1000).toISOString() : null,
            last_seen_at: new Date(end * 1000).toISOString(),
          },
        })
      },
    ),

    http.get("/v1/dash/networks/{networkId}/replay", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/replay", params.networkId)
      if (c instanceof Response) return c
      const sim = simNetworkOf(params.networkId)
      if (!sim) return notFound("network")
      const url = new URL(request.url)
      const end = Math.floor(new Date(url.searchParams.get("to") ?? Date.now()).getTime() / 1000)
      const start = Math.floor(
        new Date(url.searchParams.get("from") ?? (end - 3600) * 1000).getTime() / 1000,
      )
      const routes = url.searchParams.get("routes")?.split(",").filter(Boolean)
      const maxSpan = routes?.length ? 24 * 3600 : 6 * 3600
      if (end - start > maxSpan || end <= start)
        return apiError(
          400,
          "VALIDATION_FAILED",
          `window must be 1 s to ${String(maxSpan / 3600)} h`,
        ) as Response
      const vehicles = sim.vehicles.filter((v) => !routes || routes.includes(v.route.id))
      const step = end - start > 3 * 3600 ? 60 : 30
      const out = {
        start,
        end,
        vehicles: vehicles.map((v) => v.id),
        routes: vehicles.map((v) => v.route.id),
        plates: vehicles.map((v) => v.plate),
        t: [] as number[],
        lat: [] as number[],
        lon: [] as number[],
        idx: [] as number[],
        gaps: [] as [number, number][],
      }
      vehicles.forEach((v, i) => {
        for (let t = start; t <= end; t += step) {
          if (v.rank >= serviceLevel(t) || inGap(t)) continue
          const p = positionAt(v, t)
          out.t.push(t - start)
          out.lat.push(Math.round(p.lat * 1e6))
          out.lon.push(Math.round(p.lon * 1e6))
          out.idx.push(i)
        }
      })
      for (let t = start - (start % 86_400); t < end; t += 86_400) {
        const g0 = t - 3 * 3600 + 2 * 3600 + 10 * 60
        for (const g of [g0, g0 + 86_400]) {
          const from = Math.max(g, start)
          const to = Math.min(g + 25 * 60, end)
          if (to > from) out.gaps.push([from - start, to - start])
        }
      }
      return response(200).json({ ok: true, data: out })
    }),

    // Network-level catalog for dash pages that only know the network.
    http.get("/v1/dash/networks/{networkId}/issues", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/issues", params.networkId)
      if (c instanceof Response) return c
      const n = ctx.network(params.networkId)
      if (!n) return notFound("network")
      const url = new URL(request.url)
      const status = url.searchParams.get("status")
      const severity = url.searchParams.get("severity")
      const type = url.searchParams.get("type")
      const q = url.searchParams.get("q")
      const prefix = `${String(transit.bindingsOf(n.id)[0]?.id ?? n.id)}.`
      const mine = transit.issues.filter((i) => i.entity.id.startsWith(prefix))
      const items = mine
        .filter((i) => !status || i.status === status)
        .filter((i) => !severity || i.severity === severity)
        .filter((i) => !type || i.type === type)
        .filter((i) => matches(q, i.entity.label, i.entity.id, i.details))
      const rank = { critical: 0, warning: 1, info: 2 }
      const page = paginate(
        items,
        url,
        {
          severity: byNumber((i) => rank[i.severity]),
          last_detected_at: byString((i) => i.last_detected_at),
          first_detected_at: byString((i) => i.first_detected_at),
        },
        "severity:asc",
      )
      const counts: Record<string, number> = { critical: 0, warning: 0, info: 0 }
      for (const i of mine)
        if (i.status === "open") counts[i.severity] = (counts[i.severity] ?? 0) + 1
      return response(200).json({ ok: true, data: { ...page, counts } })
    }),
    http.patch("/v1/dash/networks/{networkId}/issues", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "PATCH /v1/dash/networks/{networkId}/issues", params.networkId)
      if (c instanceof Response) return c
      const body = await request.json()
      if (body.status === "ignored" && !body.reason?.trim())
        return apiError(400, "VALIDATION_FAILED", "reason is required to ignore", {
          fields: { reason: "required" },
        }) as Response
      let updated = 0
      for (const issue of transit.issues) {
        if (!body.ids.includes(issue.id)) continue
        issue.status = body.status
        issue.reason = body.status === "ignored" ? (body.reason ?? null) : null
        issue.updated_by = c.ref
        issue.updated_at = new Date().toISOString()
        updated++
      }
      ctx.record(
        c,
        "catalog.issues.update",
        { type: "network", id: params.networkId, label: null },
        { after: { ids: body.ids, status: body.status } },
        { networkId: ctx.network(params.networkId)?.id ?? null },
      )
      return response(200).json({ ok: true, data: { updated } })
    }),
  ]
}
