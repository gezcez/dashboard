import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import { baseParams, rangeOf, type MetricQuery } from "@/components/analytics/search"
import { num, str, useMetric } from "@/components/analytics/use-metric"
import { Chart, itemValue, type ChartOption } from "@/components/charts/chart"
import { CATEGORICAL, STATUS } from "@/components/charts/palette"
import { ErrorState } from "@/components/states/states"
import { RouteBadge } from "@/components/transit/route-badge"
import { useRouteIndex } from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { KpiTile } from "@/components/ui/kpi-tile"
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

export const Route = createFileRoute("/_app/n/$network/analytics/quality")({
  staticData: { pageId: "network.analytics" },
  component: QualityPage,
})

const DROPPED = [
  "dropped_test",
  "dropped_staff",
  "dropped_stale",
  "dropped_out_of_bbox",
  "dropped_invalid",
] as const

const pct = (v: number | null) =>
  v === null ? "–" : formatNumber(v, { style: "percent", maximumFractionDigits: 1 })

function QualityPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search } = useAnalyticsSearch()
  const theme = useResolvedTheme()
  const routes = useRouteIndex(network.id)
  const range = rangeOf(search)
  const query: MetricQuery = { from: baseParams(search).from, to: baseParams(search).to }
  const feed = useMetric(network.id, "quality.feed", query)
  const coverage = useMetric(network.id, "coverage.routes", query)
  const rows = useMemo(
    () => [...feed.rows].sort((a, b) => str(a.date).localeCompare(str(b.date))),
    [feed.rows],
  )
  const dates = rows.map((r) => str(r.date))

  const calendar = useMemo<ChartOption>(
    () => ({
      tooltip: {
        formatter: (p) => {
          const [d, v] = itemValue<[string, number]>(p)
          return `${d} · ${formatNumber(v)}`
        },
      },
      visualMap: {
        min: 60,
        max: 100,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemHeight: 140,
        inRange: { color: [STATUS.error, STATUS.warn, "#facc15", STATUS.ok] },
      },
      calendar: {
        range: [range.from, range.to],
        cellSize: ["auto", 16],
        top: 24,
        left: 36,
        right: 12,
        bottom: 48,
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: rows.map((r) => [str(r.date), num(r.score)]),
        },
      ],
    }),
    [rows, range.from, range.to],
  )

  const lagOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 48, right: 48, top: 28, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: dates.map((d) => d.slice(5)) },
      yAxis: [
        { type: "value", name: "s", min: 0 },
        { type: "value", name: t("analytics.quality.gapMinutes"), splitLine: { show: false } },
      ],
      series: [
        { type: "line", name: t("analytics.quality.lagP50"), data: rows.map((r) => num(r.lag_p50_s)) },
        { type: "line", name: t("analytics.quality.lagP95"), data: rows.map((r) => num(r.lag_p95_s)), lineStyle: { type: "dashed" } },
        {
          type: "bar",
          name: t("analytics.quality.gapMinutes"),
          yAxisIndex: 1,
          data: rows.map((r) => num(r.gap_minutes)),
          itemStyle: { opacity: 0.35 },
        },
      ],
    }),
    [rows, dates, t],
  )

  const staleOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 48, right: 16, top: 28, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => pct(typeof v === "number" ? v : null) },
      xAxis: { type: "category", data: dates.map((d) => d.slice(5)) },
      yAxis: { type: "value", axisLabel: { formatter: (v: number) => pct(v) }, min: 0 },
      series: [
        { type: "line", name: t("analytics.quality.staleShare"), data: rows.map((r) => num(r.stale_share)) },
        { type: "line", name: t("analytics.quality.outlierShare"), data: rows.map((r) => num(r.outlier_share)) },
        { type: "line", name: t("analytics.quality.successRate"), data: rows.map((r) => (num(r.success_rate) === null ? null : 1 - (num(r.success_rate) ?? 0))) },
      ],
    }),
    [rows, dates, t],
  )

  const droppedOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 56, right: 16, top: 48, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => formatNumber(Number(v)) },
      xAxis: { type: "category", data: dates.map((d) => d.slice(5)) },
      yAxis: { type: "value" },
      series: DROPPED.map((col, i) => ({
        type: "bar" as const,
        stack: "d",
        name: t(`analytics.quality.dropped.${col}`),
        data: rows.map((r) => num(r[col])),
        color: CATEGORICAL[theme][i],
      })),
    }),
    [rows, dates, t, theme],
  )

  const last = rows.at(-1)
  const avgScore = rows.length ? rows.reduce((a, r) => a + (num(r.score) ?? 0), 0) / rows.length : null
  const worst = rows.reduce<(typeof rows)[number] | undefined>(
    (w, r) => (!w || (num(r.score) ?? 100) < (num(w.score) ?? 100) ? r : w),
    undefined,
  )
  const suspicious = coverage.rows.filter((r) => r.in_catalog === false || (num(r.days_seen) ?? 0) === 0)

  return (
    <AnalyticsPage
      view="quality"
      networkId={network.id}
      networkName={network.name}
      show={{ hours: false, dayType: false }}
      methodology={
        <>
          <p>{t("analytics.quality.method.score")}</p>
          <ul>
            <li>{t("analytics.quality.method.success")}</li>
            <li>{t("analytics.quality.method.freshness")}</li>
            <li>{t("analytics.quality.method.coverage")}</li>
            <li>{t("analytics.quality.method.outliers")}</li>
          </ul>
        </>
      }
      actions={
        <ExportMenu
          networkId={network.id}
          metrics={[
            { metric: "quality.feed", query },
            { metric: "coverage.routes", query },
          ]}
        />
      }
    >
      {feed.error ? (
        <ErrorState onRetry={() => void feed.refetch()} />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label={t("analytics.quality.scoreToday")} value={formatNumber(num(last?.score))} />
            <KpiTile label={t("analytics.quality.scoreAvg")} value={avgScore === null ? "–" : formatNumber(avgScore, { maximumFractionDigits: 1 })} />
            <KpiTile
              label={t("analytics.quality.worstDay")}
              value={worst ? formatNumber(num(worst.score)) : "–"}
              hint={worst ? str(worst.date) : undefined}
            />
            <KpiTile label={t("analytics.quality.coverage")} value={pct(num(last?.coverage))} />
          </div>
          <ChartCard title={t("analytics.quality.calendarTitle")} meta={feed.data?.meta} pending={feed.isPending}>
            {search.table ? (
              <ResultTable result={feed.data} />
            ) : (
              <Chart option={calendar} label={t("analytics.quality.calendarTitle")} className="h-56" />
            )}
          </ChartCard>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title={t("analytics.quality.lagTitle")} pending={feed.isPending}>
              <Chart option={lagOption} label={t("analytics.quality.lagTitle")} />
            </ChartCard>
            <ChartCard title={t("analytics.quality.sharesTitle")} pending={feed.isPending}>
              <Chart option={staleOption} label={t("analytics.quality.sharesTitle")} />
            </ChartCard>
          </div>
          <ChartCard title={t("analytics.quality.droppedTitle")} description={t("analytics.quality.droppedBody")} pending={feed.isPending}>
            <Chart option={droppedOption} label={t("analytics.quality.droppedTitle")} />
          </ChartCard>
          <ChartCard
            title={t("analytics.quality.coverageTitle")}
            description={t("analytics.quality.coverageBody")}
            meta={coverage.data?.meta}
            pending={coverage.isPending}
          >
            {suspicious.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("analytics.quality.coverageClean")}</p>
            ) : (
              <div className="overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("analytics.columns.route")}</TableHead>
                      <TableHead>{t("analytics.quality.problem")}</TableHead>
                      <TableHead className="text-right">{t("analytics.quality.daysSeen")}</TableHead>
                      <TableHead className="text-right">{t("analytics.quality.vehicles")}</TableHead>
                      <TableHead>{t("analytics.quality.lastSeen")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspicious.map((r) => (
                      <TableRow key={str(r.route_ext)}>
                        <TableCell>
                          <RouteBadge route={routes.byExt.get(str(r.route_ext))} code={str(r.route_ext)} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.in_catalog === false ? "warn" : "default"}>
                            {r.in_catalog === false
                              ? t("analytics.quality.notInCatalog")
                              : t("analytics.quality.neverSeen")}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {formatNumber(num(r.days_seen))} / {formatNumber(num(r.days_in_window))}
                        </TableCell>
                        <TableCell className="tabular text-right">{formatNumber(num(r.vehicles))}</TableCell>
                        <TableCell className="text-muted-foreground">{str(r.last_seen) || "–"}</TableCell>
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
