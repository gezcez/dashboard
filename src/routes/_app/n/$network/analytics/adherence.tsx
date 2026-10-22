import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import { baseParams, type MetricQuery } from "@/components/analytics/search"
import { shareOf, sumOf } from "@/components/analytics/transform"
import { num, str, useMetric, weightedMean } from "@/components/analytics/use-metric"
import { Chart, itemValue, type ChartOption } from "@/components/charts/chart"
import { DIVERGING, STATUS } from "@/components/charts/palette"
import { EmptyState, ErrorState } from "@/components/states/states"
import { compareRouteCodes } from "@/components/transit/queries"
import { Button } from "@/components/ui/button"
import { KpiTile } from "@/components/ui/kpi-tile"
import { formatNumber } from "@/lib/format"
import { useResolvedTheme } from "@/lib/theme"

export const Route = createFileRoute("/_app/n/$network/analytics/adherence")({
  staticData: { pageId: "network.analytics" },
  component: AdherencePage,
})

const pct = (v: number | null) =>
  v === null ? "–" : formatNumber(v, { style: "percent", maximumFractionDigits: 1 })

function AdherencePage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search } = useAnalyticsSearch()
  const theme = useResolvedTheme()
  const query: MetricQuery = {
    ...baseParams(search),
    route_id: search.route,
    direction: search.dir,
  }
  const result = useMetric(network.id, "adherence.departure", query)
  const rows = result.rows

  const hours = useMemo(() => {
    const byHour = new Map<number, typeof rows>()
    for (const r of rows) {
      const h = num(r.hour) ?? 0
      byHour.set(h, [...(byHour.get(h) ?? []), r])
    }
    return [...byHour.entries()].sort((a, b) => a[0] - b[0])
  }, [rows])

  const sharesOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 48, right: 16, top: 28, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => pct(typeof v === "number" ? v : null) },
      xAxis: { type: "category", data: hours.map(([h]) => `${String(h).padStart(2, "0")}:00`) },
      yAxis: { type: "value", max: 1, axisLabel: { formatter: (v: number) => pct(v) } },
      series: (["early_share", "on_time_share", "late_share"] as const).map((col, i) => ({
        type: "bar" as const,
        stack: "s",
        name: t(`analytics.adherence.${col}`),
        data: hours.map(([, list]) => shareOf(list, col, "runs")),
        color: [STATUS.info, STATUS.ok, STATUS.warn][i],
      })),
    }),
    [hours, t],
  )

  const heatmap = useMemo<ChartOption>(() => {
    const routes = [...new Set(rows.map((r) => str(r.short_name) || str(r.route_ext)))].sort(compareRouteCodes)
    const cells: [number, number, number | null][] = []
    for (const r of rows) {
      const y = routes.indexOf(str(r.short_name) || str(r.route_ext))
      cells.push([num(r.hour) ?? 0, y, num(r.median_delay_min)])
    }
    return {
      grid: { left: 56, right: 16, top: 8, bottom: 64 },
      tooltip: {
        formatter: (p) => {
          const [h, y, v] = itemValue<[number, number, number | null]>(p)
          return `${routes[y] ?? ""} ${String(h).padStart(2, "0")}:00 · ${v === null ? "–" : formatNumber(v, { maximumFractionDigits: 1 })} min`
        },
      },
      xAxis: { type: "category", data: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")) },
      yAxis: { type: "category", data: routes },
      visualMap: {
        min: -3,
        max: 8,
        orient: "horizontal",
        left: "center",
        bottom: 4,
        itemHeight: 140,
        inRange: { color: [...DIVERGING[theme]] },
      },
      series: [{ type: "heatmap", data: cells }],
    }
  }, [rows, theme])

  const worst = useMemo(
    () => [...rows].sort((a, b) => (num(b.p90_delay_min) ?? 0) - (num(a.p90_delay_min) ?? 0)).slice(0, 15),
    [rows],
  )
  const onTime = shareOf(rows, "on_time_share", "runs")
  const medianDelay = weightedMean(rows.map((r) => [num(r.median_delay_min), num(r.runs)]))

  return (
    <AnalyticsPage
      view="adherence"
      networkId={network.id}
      networkName={network.name}
      show={{ route: true, direction: true }}
      methodology={
        <>
          <p>{t("analytics.adherence.method.what")}</p>
          <p>{t("analytics.adherence.method.window")}</p>
        </>
      }
      actions={<ExportMenu networkId={network.id} metrics={[{ metric: "adherence.departure", query }]} />}
    >
      {result.error ? (
        <ErrorState onRetry={() => void result.refetch()} />
      ) : !result.isPending && rows.length === 0 ? (
        <EmptyState
          title={t("analytics.adherence.noTimetableTitle")}
          actions={
            <Button variant="outline" asChild>
              <Link
                to="/n/$network/catalog/issues"
                params={{ network: network.slug }}
                search={{ type: "trip_without_timetable" }}
              >
                {t("analytics.adherence.noTimetableLink")}
              </Link>
            </Button>
          }
        >
          {t("analytics.adherence.noTimetableBody")}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiTile label={t("analytics.adherence.onTime")} value={pct(onTime)} hint={t("analytics.adherence.onTimeHint")} />
            <KpiTile
              label={t("analytics.adherence.medianDelay")}
              value={medianDelay === null ? "–" : `${formatNumber(medianDelay, { maximumFractionDigits: 1 })} min`}
            />
            <KpiTile label={t("analytics.runtimes.runs")} value={formatNumber(sumOf(rows, "runs"))} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title={t("analytics.adherence.sharesTitle")} meta={result.data?.meta} pending={result.isPending}>
              {search.table ? (
                <ResultTable result={result.data} />
              ) : (
                <Chart option={sharesOption} label={t("analytics.adherence.sharesTitle")} />
              )}
            </ChartCard>
            <ChartCard title={t("analytics.adherence.heatmapTitle")} pending={result.isPending}>
              <Chart option={heatmap} label={t("analytics.adherence.heatmapTitle")} className="h-80" />
            </ChartCard>
          </div>
          <ChartCard title={t("analytics.adherence.worstTitle")}>
            <ResultTable
              result={{
                columns: result.data?.columns ?? [],
                rows: worst.map((r) => (result.data?.columns ?? []).map((c) => r[c] ?? null)),
              }}
            />
          </ChartCard>
        </div>
      )}
    </AnalyticsPage>
  )
}
