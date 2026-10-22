import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import { baseParams, type MetricQuery } from "@/components/analytics/search"
import { MIN_SAMPLES, runtimeByRouteDir } from "@/components/analytics/transform"
import { num, useMetric } from "@/components/analytics/use-metric"
import { Chart, type ChartOption } from "@/components/charts/chart"
import { ErrorState, EmptyState } from "@/components/states/states"
import { RouteBadge } from "@/components/transit/route-badge"
import { compareRouteCodes, useRouteIndex } from "@/components/transit/queries"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_app/n/$network/analytics/runtimes")({
  staticData: { pageId: "network.analytics" },
  component: RuntimesPage,
})

const fmtMin = (v: number | null) =>
  v === null ? "–" : `${formatNumber(v, { maximumFractionDigits: 1 })} min`

function RuntimesPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search, setSearch } = useAnalyticsSearch()
  const routes = useRouteIndex(network.id)

  // All route-directions for the summary table; the hourly chart narrows to the selected one.
  const allQuery: MetricQuery = baseParams(search)
  const all = useMetric(network.id, "runs.runtime", allQuery)
  const summary = useMemo(
    () =>
      runtimeByRouteDir(all.rows).sort(
        (a, b) => compareRouteCodes(a.route, b.route) || a.direction - b.direction,
      ),
    [all.rows],
  )
  const route = search.route ?? summary[0]?.route
  const dir = search.dir ?? 0
  const selected = all.rows.filter((r) => r.route_ext === route && num(r.direction) === dir)

  const option = useMemo<ChartOption>(() => {
    const hours = selected.map((r) => num(r.hour) ?? 0)
    const thin = (r: (typeof selected)[number]) => (num(r.runs) ?? 0) < MIN_SAMPLES
    return {
      grid: { left: 48, right: 48, top: 32, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v) => (typeof v === "number" ? formatNumber(v, { maximumFractionDigits: 1 }) : "–"),
      },
      xAxis: { type: "category", data: hours.map((h) => `${String(h).padStart(2, "0")}:00`) },
      yAxis: [
        { type: "value", name: t("analytics.runtimes.minutes"), min: 0 },
        { type: "value", name: t("analytics.runtimes.runs"), splitLine: { show: false } },
      ],
      series: [
        {
          type: "bar",
          name: t("analytics.runtimes.runs"),
          yAxisIndex: 1,
          data: selected.map((r) => num(r.runs)),
          itemStyle: { opacity: 0.25 },
          barWidth: "60%",
        },
        {
          type: "line",
          name: "p50",
          data: selected.map((r) => ({
            value: num(r.p50_min),
            itemStyle: thin(r) ? { opacity: 0.35 } : undefined,
          })),
          symbol: "circle",
          symbolSize: 5,
        },
        {
          type: "line",
          name: "p90",
          data: selected.map((r) => num(r.p90_min)),
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { type: "dashed" },
        },
      ],
    }
  }, [selected, t])

  const routeDetail = route ? routes.byExt.get(route) : undefined

  return (
    <AnalyticsPage
      view="runtimes"
      networkId={network.id}
      networkName={network.name}
      show={{ route: true, direction: true }}
      methodology={
        <>
          <p>{t("analytics.runtimes.method.what")}</p>
          <p>{t("analytics.runtimes.method.caveats")}</p>
        </>
      }
      actions={<ExportMenu networkId={network.id} metrics={[{ metric: "runs.runtime", query: allQuery }]} />}
    >
      {all.error ? (
        <ErrorState onRetry={() => void all.refetch()} />
      ) : !all.isPending && summary.length === 0 ? (
        <EmptyState title={t("analytics.emptyTitle")}>{t("analytics.emptyBody")}</EmptyState>
      ) : (
        <div className="grid gap-4">
          <ChartCard
            title={t("analytics.runtimes.byHourTitle", {
              route: routeDetail?.short_name ?? route ?? "",
              dir,
            })}
            description={t("analytics.runtimes.byHourBody")}
            meta={all.data?.meta}
            pending={all.isPending}
          >
            {search.table ? (
              <ResultTable result={all.data} />
            ) : (
              <Chart option={option} label={t("analytics.runtimes.byHourTitle", { route: route ?? "", dir })} className="h-80" />
            )}
          </ChartCard>
          <ChartCard title={t("analytics.runtimes.tableTitle")} description={t("analytics.runtimes.tableBody")}>
            <div className="max-h-[480px] overflow-auto rounded-xl border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>{t("analytics.columns.route")}</TableHead>
                    <TableHead>{t("analytics.columns.direction")}</TableHead>
                    <TableHead className="text-right">{t("analytics.runtimes.runs")}</TableHead>
                    <TableHead className="text-right">p50</TableHead>
                    <TableHead className="text-right">p90</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((s) => {
                    const active = s.route === route && s.direction === dir
                    return (
                      <TableRow
                        key={`${s.route}-${String(s.direction)}`}
                        className={cn("cursor-pointer", active && "bg-accent")}
                        onClick={() => {
                          setSearch({ route: s.route, dir: s.direction as 0 | 1 })
                        }}
                      >
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <RouteBadge route={routes.byExt.get(s.route)} code={s.route} />
                            <span className="truncate text-muted-foreground">
                              {routes.byExt.get(s.route)?.long_name}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>{t("live.direction", { dir: s.direction })}</TableCell>
                        <TableCell className="tabular text-right">{formatNumber(s.runs)}</TableCell>
                        <TableCell className="tabular text-right">{fmtMin(s.p50)}</TableCell>
                        <TableCell className="tabular text-right">{fmtMin(s.p90)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </ChartCard>
        </div>
      )}
    </AnalyticsPage>
  )
}
