import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { baseParams } from "@/components/analytics/search"
import { dailySeries, shareOf } from "@/components/analytics/transform"
import { median, num, useMetric, weightedMean, type Row } from "@/components/analytics/use-metric"
import { Sparkline } from "@/components/charts/sparkline"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format"

export const Route = createFileRoute("/_app/n/$network/analytics/")({
  staticData: { pageId: "network.analytics" },
  component: AnalyticsIndex,
})

/** Per-hour aggregate of a column, for hour-of-day sparklines. */
function byHour(rows: Row[], column: string, weight: string): number[] {
  const out: number[] = []
  for (let h = 0; h < 24; h++) {
    const list = rows.filter((r) => num(r.hour) === h)
    if (list.length === 0) continue
    out.push(weightedMean(list.map((r) => [num(r[column]), num(r[weight])])) ?? 0)
  }
  return out
}

function Tile({
  to,
  title,
  value,
  hint,
  series,
  pending,
}: {
  to:
    | "/n/$network/analytics/fleet"
    | "/n/$network/analytics/runtimes"
    | "/n/$network/analytics/headways"
    | "/n/$network/analytics/adherence"
    | "/n/$network/analytics/dwell"
    | "/n/$network/analytics/speed"
    | "/n/$network/analytics/quality"
  title: string
  value: ReactNode
  hint?: ReactNode
  series?: number[]
  pending: boolean
}) {
  const { network } = Route.useParams()
  return (
    <Link
      to={to}
      params={{ network }}
      search={(prev) => prev}
      className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Card className="flex h-full flex-col gap-2 p-4 transition-colors group-hover:border-brand/40">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{title}</span>
          <ArrowRightIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {pending ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="tabular text-2xl font-bold tracking-tight">{value}</div>
        )}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        {series && <Sparkline values={series} className="mt-auto" />}
      </Card>
    </Link>
  )
}

function AnalyticsIndex() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search } = useAnalyticsSearch()
  const base = baseParams(search)
  const fleet = useMetric(network.id, "fleet.hourly", { ...base, granularity: "1d" })
  const runtime = useMetric(network.id, "runs.runtime", base)
  const headways = useMetric(network.id, "headways.observed", base)
  const adherence = useMetric(network.id, "adherence.departure", base)
  const dwell = useMetric(network.id, "dwell.stops", { ...base, limit: 50 })
  const speed = useMetric(network.id, "speed.heatmap", { ...base, res: 7 })
  const quality = useMetric(network.id, "quality.feed", { from: base.from, to: base.to })

  const pct = (v: number | null) =>
    v === null ? "–" : formatNumber(v, { style: "percent", maximumFractionDigits: 1 })
  const fleetSeries = dailySeries(fleet.rows, "vehicles")
  const qualitySeries = dailySeries(quality.rows, "score", "date")
  const onTime = shareOf(adherence.rows, "on_time_share", "runs")

  return (
    <AnalyticsPage view="index" networkId={network.id} networkName={network.name}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          to="/n/$network/analytics/fleet"
          title={t("analytics.views.fleet.tab")}
          value={formatNumber(Math.max(0, ...fleetSeries))}
          hint={t("analytics.index.fleetHint")}
          series={fleetSeries}
          pending={fleet.isPending}
        />
        <Tile
          to="/n/$network/analytics/runtimes"
          title={t("analytics.views.runtimes.tab")}
          value={`${formatNumber(weightedMean(runtime.rows.map((r) => [num(r.p50_min), num(r.runs)])), { maximumFractionDigits: 1 })} min`}
          hint={t("analytics.index.runtimeHint")}
          series={byHour(runtime.rows, "p50_min", "runs")}
          pending={runtime.isPending}
        />
        <Tile
          to="/n/$network/analytics/headways"
          title={t("analytics.views.headways.tab")}
          value={pct(shareOf(headways.rows, "bunching_share", "n"))}
          hint={t("analytics.index.bunchingHint")}
          series={byHour(headways.rows, "bunching_share", "n")}
          pending={headways.isPending}
        />
        <Tile
          to="/n/$network/analytics/adherence"
          title={t("analytics.views.adherence.tab")}
          value={adherence.rows.length ? pct(onTime) : t("analytics.index.needsTimetable")}
          hint={adherence.rows.length ? t("analytics.adherence.onTimeHint") : undefined}
          series={adherence.rows.length ? byHour(adherence.rows, "on_time_share", "runs") : undefined}
          pending={adherence.isPending}
        />
        <Tile
          to="/n/$network/analytics/dwell"
          title={t("analytics.views.dwell.tab")}
          value={`${formatNumber(median(dwell.rows.map((r) => num(r.median_dwell_s))))} s`}
          hint={t("analytics.index.dwellHint")}
          pending={dwell.isPending}
        />
        <Tile
          to="/n/$network/analytics/speed"
          title={t("analytics.views.speed.tab")}
          value={`${formatNumber(median(speed.rows.map((r) => num(r.median_kmh))), { maximumFractionDigits: 1 })} km/h`}
          hint={t("analytics.index.speedHint")}
          pending={speed.isPending}
        />
        <Tile
          to="/n/$network/analytics/quality"
          title={t("analytics.views.quality.tab")}
          value={formatNumber(qualitySeries.at(-1) ?? null)}
          hint={t("analytics.index.qualityHint")}
          series={qualitySeries}
          pending={quality.isPending}
        />
      </div>
    </AnalyticsPage>
  )
}
