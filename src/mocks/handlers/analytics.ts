import { http as rawHttp, HttpResponse, type HttpHandler } from "msw"
import {
  GENERATORS,
  localDate,
  MAX_DAYS,
  METRIC_DESCRIPTIONS,
  toCsv,
  type AnalyticsParams,
  type Metric,
} from "../transit/analytics"
import { simNetworkOf } from "../transit/sim"
import { apiError, type Ctx } from "./context"

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Parses the backend's analytics query (gezcez/backend analytics.dto.ts). */
export function analyticsParams(url: URL): AnalyticsParams | string {
  const q = url.searchParams
  const today = localDate(Math.floor(Date.now() / 1000))
  const date = q.get("date")
  const to = date ?? q.get("to") ?? today
  const from =
    date ??
    q.get("from") ??
    localDate(Math.floor(Date.parse(`${to}T12:00:00Z`) / 1000) - 6 * 86_400)
  if (!DATE.test(from) || !DATE.test(to)) return "from and to must be YYYY-MM-DD"
  const span = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1
  if (span < 1) return "`to` is before `from`"
  if (span > MAX_DAYS) return `At most ${String(MAX_DAYS)} days per request`
  const int = (name: string, fallback: number) => {
    const v = q.get(name)
    return v === null || v === "" ? fallback : Number(v)
  }
  const hourFrom = int("hour_from", 0)
  const hourTo = int("hour_to", 23)
  if (hourFrom > hourTo) return "`hour_from` must not be after `hour_to`"
  const dir = q.get("direction")
  return {
    from,
    to,
    dayType: (q.get("day_type") ?? "all") as AnalyticsParams["dayType"],
    hourFrom,
    hourTo,
    routes: (q.get("route_id") ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => (r.includes(".") ? r.split(".").slice(1).join(".") : r)),
    direction: dir === null || dir === "" ? null : Number(dir),
    granularity: (q.get("granularity") ?? "1h") as AnalyticsParams["granularity"],
    stopId: q.get("stop_id"),
    res: int("res", 8),
    hour: q.get("hour") === null ? null : int("hour", 8),
    minSamples: int("min_samples", 30),
    limit: int("limit", 100),
  }
}

export function analyticsHandlers(ctx: Ctx): HttpHandler[] {
  const { http, wait, authorize } = ctx

  const run = (networkId: string, metric: string, url: URL) => {
    const sim = simNetworkOf(ctx.network(networkId)?.id ?? networkId)
    if (!sim) return apiError(404, "NOT_FOUND", "network has no analytics") as Response
    const generate = GENERATORS[metric as Metric] as (typeof GENERATORS)[Metric] | undefined
    if (!generate) return apiError(404, "NOT_FOUND", `unknown metric ${metric}`) as Response
    const params = analyticsParams(url)
    if (typeof params === "string") return apiError(400, "VALIDATION_FAILED", params) as Response
    const out = generate(sim.network, params)
    if (typeof out === "string") return apiError(400, "VALIDATION_FAILED", out) as Response
    return out
  }

  return [
    http.get("/v1/dash/networks/{networkId}/analytics", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/analytics", params.networkId)
      if (c instanceof Response) return c
      return response(200).json({
        ok: true,
        data: {
          metrics: (Object.keys(GENERATORS) as Metric[]).map((key) => ({
            key,
            description: METRIC_DESCRIPTIONS[key],
            datasets: ["positions"],
          })),
          max_days: MAX_DAYS,
          h3: "js",
          archive: {
            first_date: "2025-06-01",
            last_date: localDate(Math.floor(Date.now() / 1000) - 86_400),
          },
        },
      })
    }),
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
    // The backend documents the export as a file without a schema, so this one is untyped.
    rawHttp.get<{ networkId: string; metric: string }>(
      `${ctx.apiUrl}/v1/dash/networks/:networkId/analytics/:metric/export`,
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
        const name = `${params.networkId}-${params.metric}-${out.meta.from}-${out.meta.to}`
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
