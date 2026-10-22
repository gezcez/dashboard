import { HttpResponse, type HttpHandler } from "msw"
import {
  GENERATORS,
  localDate,
  toCsv,
  type AnalyticsParams,
  type Metric,
} from "../transit/analytics"
import { simNetworkOf } from "../transit/sim"
import { apiError, type Ctx } from "./context"

const MAX_DAYS = 90

/** Parses the shared analytics filters (dashboard plan 6.6). */
export function analyticsParams(url: URL): AnalyticsParams | string {
  const q = url.searchParams
  const today = localDate(Math.floor(Date.now() / 1000))
  const to = q.get("to") ?? today
  const from =
    q.get("from") ?? localDate(Math.floor(Date.parse(`${to}T12:00:00Z`) / 1000) - 6 * 86_400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
    return "from and to must be dates"
  const span = (Date.parse(to) - Date.parse(from)) / 86_400_000
  if (span < 0) return "to is before from"
  if (span >= MAX_DAYS) return `at most ${String(MAX_DAYS)} days per request`
  const int = (name: string, fallback: number) => {
    const v = q.get(name)
    return v === null || v === "" ? fallback : Number(v)
  }
  const dir = q.get("direction")
  return {
    from,
    to,
    dayType: (q.get("day_type") ?? "all") as AnalyticsParams["dayType"],
    hourFrom: int("hour_from", 0),
    hourTo: int("hour_to", 24),
    routes: q.get("routes")?.split(",").filter(Boolean) ?? null,
    direction: dir === null || dir === "" ? null : Number(dir),
    granularity: (q.get("granularity") ?? "1h") as AnalyticsParams["granularity"],
    routeId: q.get("route_id"),
    stopId: q.get("stop_id"),
    date: q.get("date"),
    res: int("res", 8),
    hour: q.get("hour") === null ? null : int("hour", 8),
  }
}

export function analyticsHandlers(ctx: Ctx): HttpHandler[] {
  const { http, wait, authorize } = ctx

  const run = (networkId: string, metric: string, url: URL) => {
    const sim = simNetworkOf(networkId) ?? simNetworkOf(String(ctx.network(networkId)?.id ?? ""))
    if (!sim) return apiError(404, "NOT_FOUND", "network has no analytics") as Response
    const generate = GENERATORS[metric as Metric] as (typeof GENERATORS)[Metric] | undefined
    if (!generate) return apiError(404, "NOT_FOUND", `unknown metric ${metric}`) as Response
    const params = analyticsParams(url)
    if (typeof params === "string") return apiError(400, "VALIDATION_FAILED", params) as Response
    return generate(sim.network, params)
  }

  return [
    http.get(
      "/v1/dash/networks/{networkId}/analytics/{metric}",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/analytics/{metric}",
          params.networkId,
        )
        if (c instanceof Response) return c
        const out = run(params.networkId, params.metric, new URL(request.url))
        if (out instanceof Response) return out
        return response(200).json({ ok: true, data: out })
      },
    ),
    http.get(
      "/v1/dash/networks/{networkId}/analytics/{metric}/export",
      async ({ request, params }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/analytics/{metric}/export",
          params.networkId,
        )
        if (c instanceof Response) return c
        const url = new URL(request.url)
        const out = run(params.networkId, params.metric, url)
        if (out instanceof Response) return out
        const name = `${params.networkId}-${params.metric}`
        if (url.searchParams.get("format") === "parquet")
          return new Response(new Uint8Array([0x50, 0x41, 0x52, 0x31]), {
            headers: {
              "content-type": "application/vnd.apache.parquet",
              "content-disposition": `attachment; filename="${name}.parquet"`,
            },
          })
        return HttpResponse.text(toCsv(out), {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="${name}.csv"`,
          },
        })
      },
    ),
  ]
}
