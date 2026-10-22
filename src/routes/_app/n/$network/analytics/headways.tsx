import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import { baseParams, rangeOf, type MetricQuery } from "@/components/analytics/search"
import { useTimeFormat } from "@/components/analytics/time-format"
import {
  bunchingByRoute,
  headwayByStop,
  MIN_SAMPLES,
  mareyLines,
} from "@/components/analytics/transform"
import { num, str, useMetric } from "@/components/analytics/use-metric"
import { Chart, type ChartOption } from "@/components/charts/chart"
import { CATEGORICAL, STATUS } from "@/components/charts/palette"
import { EmptyState, ErrorState } from "@/components/states/states"
import { RouteBadge } from "@/components/transit/route-badge"
import { compareRouteCodes, externalId, useRouteIndex } from "@/components/transit/queries"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber } from "@/lib/format"
import { useResolvedTheme } from "@/lib/theme"

export const Route = createFileRoute("/_app/n/$network/analytics/headways")({
  staticData: { pageId: "network.analytics" },
  component: HeadwaysPage,
})

const pct = (v: number | null) =>
  v === null ? "–" : formatNumber(v, { style: "percent", maximumFractionDigits: 1 })

function HeadwaysPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search } = useAnalyticsSearch()
  const theme = useResolvedTheme()
  const time = useTimeFormat(search.utc)
  const routes = useRouteIndex(network.id)
  const range = rangeOf(search)

  const defaultRoute = useMemo(
    () =>
      [...routes.list]
        .filter((r) => !r.short_name.startsWith("419"))
        .sort((a, b) => compareRouteCodes(a.short_name, b.short_name))[0],
    [routes.list],
  )
  const route = search.route ?? (defaultRoute ? externalId(defaultRoute.id) : undefined)
  const dir = search.dir ?? 0
  const routeDetail = route ? routes.byExt.get(route) : undefined

  // The Marey chart is one route-direction on one day: the last day of the range.
  const mareyQuery: MetricQuery = {
    ...baseParams(search),
    from: range.to,
    to: range.to,
    route_id: route,
    direction: dir,
  }
  const marey = useMetric(network.id, "headways.marey", mareyQuery, { enabled: Boolean(route) })
  const networkQuery: MetricQuery = baseParams(search)
  const observed = useMetric(network.id, "headways.observed", networkQuery)

  const lines = useMemo(() => mareyLines(marey.rows), [marey.rows])
  const pattern = routeDetail?.id
  const stopsCount = useMemo(
    () => Math.max(0, ...marey.rows.map((r) => num(r.stop_seq) ?? 0)),
    [marey.rows],
  )
  const mareyOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 48, right: 24, top: 16, bottom: 72 },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const item = p as { seriesName: string; value: [number, number] | null }
          if (!item.value) return ""
          return `${item.seriesName}<br/>${time.clock(item.value[0])} · ${t("analytics.headways.stopSeq", { seq: item.value[1] })}`
        },
      },
      xAxis: { type: "time", axisLabel: { formatter: time.axis } },
      yAxis: {
        type: "value",
        name: t("analytics.headways.stopAxis"),
        min: 1,
        max: Math.max(2, stopsCount),
        minInterval: 1,
        inverse: true,
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0, filterMode: "none" },
        { type: "slider", xAxisIndex: 0, height: 18, bottom: 28, filterMode: "none" },
      ],
      series: lines.map((l, i) => ({
        type: "line" as const,
        name: l.vehicle,
        data: l.points.map((p) => p ?? "-"),
        connectNulls: false,
        showSymbol: false,
        lineStyle: { width: 1.5 },
        color: CATEGORICAL[theme][i % CATEGORICAL[theme].length],
        emphasis: { focus: "series" as const, lineStyle: { width: 3 } },
        large: true,
      })),
    }),
    [lines, stopsCount, t, theme, time],
  )

  const bunching = useMemo(() => bunchingByRoute(observed.rows), [observed.rows])
  const bunchingOption = useMemo<ChartOption>(() => {
    const top = bunching.slice(0, 15).reverse()
    const label = (code: string) => routes.byExt.get(code)?.short_name ?? code
    return {
      grid: { left: 64, right: 24, top: 24, bottom: 24 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => pct(typeof v === "number" ? v : null) },
      xAxis: { type: "value", axisLabel: { formatter: (v: number) => pct(v) }, max: 1 },
      yAxis: { type: "category", data: top.map((b) => label(b.route)) },
      series: [
        {
          type: "bar",
          stack: "s",
          name: t("analytics.headways.bunching"),
          data: top.map((b) => b.bunching),
          color: STATUS.warn,
        },
        {
          type: "bar",
          stack: "s",
          name: t("analytics.headways.gaps"),
          data: top.map((b) => b.gaps),
          color: STATUS.info,
        },
      ],
    }
  }, [bunching, routes.byExt, t])

  const routeRows = useMemo(
    () => observed.rows.filter((r) => str(r.route_ext) === route && num(r.direction) === dir),
    [observed.rows, route, dir],
  )
  const byStop = useMemo(() => headwayByStop(routeRows), [routeRows])
  const stopOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 48, right: 16, top: 28, bottom: 40 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => (typeof v === "number" ? `${formatNumber(v, { maximumFractionDigits: 1 })} min` : "–") },
      xAxis: {
        type: "category",
        name: t("analytics.headways.stopAxis"),
        nameLocation: "middle",
        nameGap: 26,
        data: byStop.map((s) => String(s.order + 1)),
      },
      yAxis: { type: "value", name: t("analytics.runtimes.minutes"), min: 0 },
      series: [
        {
          type: "line",
          name: t("analytics.headways.median"),
          data: byStop.map((s) => ({
            value: s.median,
            itemStyle: s.n < MIN_SAMPLES ? { opacity: 0.3 } : undefined,
          })),
          symbol: "circle",
          symbolSize: 4,
        },
        {
          type: "line",
          name: "p90",
          data: byStop.map((s) => s.p90),
          lineStyle: { type: "dashed" },
          showSymbol: false,
          areaStyle: { opacity: 0.06 },
        },
      ],
    }),
    [byStop, t],
  )

  const gapEvents = useMemo(
    () =>
      observed.rows
        .filter((r) => (num(r.gap_share) ?? 0) >= 0.15 && (num(r.n) ?? 0) >= MIN_SAMPLES)
        .sort((a, b) => (num(b.gap_share) ?? 0) - (num(a.gap_share) ?? 0))
        .slice(0, 25),
    [observed.rows],
  )

  return (
    <AnalyticsPage
      view="headways"
      networkId={network.id}
      networkName={network.name}
      show={{ route: true, direction: true }}
      methodology={
        <>
          <p>{t("analytics.headways.method.what")}</p>
          <p>{t("analytics.headways.method.bunching")}</p>
          <p>{t("analytics.headways.method.marey")}</p>
        </>
      }
      actions={
        <ExportMenu
          networkId={network.id}
          metrics={[
            { metric: "headways.observed", query: networkQuery },
            { metric: "headways.marey", query: mareyQuery },
          ]}
        />
      }
    >
      {observed.error ? (
        <ErrorState onRetry={() => void observed.refetch()} />
      ) : (
        <div className="grid gap-4">
          <ChartCard
            title={t("analytics.headways.mareyTitle", {
              route: routeDetail?.short_name ?? route ?? "",
              dir,
              date: range.to,
            })}
            description={t("analytics.headways.mareyBody", { trips: lines.reduce((a, l) => a + l.trips, 0) })}
            meta={marey.data?.meta}
            pending={marey.isPending && Boolean(route)}
          >
            {marey.error ? (
              <ErrorState onRetry={() => void marey.refetch()} />
            ) : search.table ? (
              <ResultTable result={marey.data} />
            ) : lines.length === 0 ? (
              <EmptyState title={t("analytics.emptyTitle")}>{t("analytics.headways.mareyEmpty")}</EmptyState>
            ) : (
              <Chart
                key={pattern}
                option={mareyOption}
                label={t("analytics.headways.mareyTitle", { route: route ?? "", dir, date: range.to })}
                className="h-[420px]"
              />
            )}
          </ChartCard>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={t("analytics.headways.byStopTitle")}
              description={t("analytics.headways.byStopBody")}
              meta={observed.data?.meta}
              pending={observed.isPending}
            >
              <Chart option={stopOption} label={t("analytics.headways.byStopTitle")} />
            </ChartCard>
            <ChartCard
              title={t("analytics.headways.bunchingTitle")}
              description={t("analytics.headways.bunchingBody")}
              pending={observed.isPending}
            >
              {search.table ? (
                <ResultTable result={observed.data} />
              ) : (
                <Chart option={bunchingOption} label={t("analytics.headways.bunchingTitle")} className="h-80" />
              )}
            </ChartCard>
          </div>
          <ChartCard title={t("analytics.headways.gapTitle")} description={t("analytics.headways.gapBody")}>
            {gapEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("analytics.headways.noGaps")}</p>
            ) : (
              <div className="overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("analytics.columns.route")}</TableHead>
                      <TableHead>{t("analytics.columns.direction")}</TableHead>
                      <TableHead>{t("analytics.columns.stop")}</TableHead>
                      <TableHead className="text-right">{t("analytics.columns.hour")}</TableHead>
                      <TableHead className="text-right">{t("analytics.headways.median")}</TableHead>
                      <TableHead className="text-right">{t("analytics.headways.gaps")}</TableHead>
                      <TableHead className="text-right">n</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gapEvents.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <RouteBadge route={routes.byExt.get(str(r.route_ext))} code={str(r.route_ext)} />
                        </TableCell>
                        <TableCell>{t("live.direction", { dir: num(r.direction) ?? 0 })}</TableCell>
                        <TableCell className="font-mono text-xs">{str(r.stop_ext)}</TableCell>
                        <TableCell className="tabular text-right">
                          {String(num(r.hour) ?? 0).padStart(2, "0")}:00
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {formatNumber(num(r.median_headway_min), { maximumFractionDigits: 1 })} min
                        </TableCell>
                        <TableCell className="tabular text-right">{pct(num(r.gap_share))}</TableCell>
                        <TableCell className="tabular text-right">{formatNumber(num(r.n))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ChartCard>
        </div>
      )}
    </AnalyticsPage>
  )
}
