import { useQueries } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import { baseParams, type MetricQuery } from "@/components/analytics/search"
import { MIN_SAMPLES } from "@/components/analytics/transform"
import { num, str, useMetric } from "@/components/analytics/use-metric"
import { Chart, type ChartOption } from "@/components/charts/chart"
import { BaseMap } from "@/components/map/base-map"
import { StopsLayer } from "@/components/map/layers"
import { EmptyState, ErrorState } from "@/components/states/states"
import { stopQuery } from "@/components/transit/queries"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { bounds } from "@/lib/geo"

export const Route = createFileRoute("/_app/n/$network/analytics/dwell")({
  staticData: { pageId: "network.analytics" },
  component: DwellPage,
})

const TOP = 20

function DwellPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search, setSearch } = useAnalyticsSearch()
  const topQuery: MetricQuery = { ...baseParams(search), limit: TOP }
  const top = useMetric(network.id, "dwell.stops", topQuery)
  const stopQ: MetricQuery = { ...baseParams(search), stop_id: search.stop }
  const byHour = useMetric(network.id, "dwell.stops", stopQ, { enabled: Boolean(search.stop) })

  const binding = top.data?.meta.binding_ids[0]
  const stopIds = top.rows.map((r) => `${String(binding ?? "")}.${str(r.stop_ext)}`)
  const stopInfo = useQueries({
    queries: stopIds.map((id) => ({ ...stopQuery(id), enabled: binding !== undefined })),
  })
  const names = useMemo(() => {
    const m = new Map<string, { name: string; lat: number; lon: number }>()
    for (const q of stopInfo) if (q.data) m.set(q.data.id.split(".").slice(1).join("."), q.data)
    return m
  }, [stopInfo])

  const label = (ext: string) => names.get(ext)?.name ?? ext
  const barOption = useMemo<ChartOption>(() => {
    const rows = [...top.rows].reverse()
    const name = (ext: string) => names.get(ext)?.name ?? ext
    return {
      grid: { left: 140, right: 24, top: 28, bottom: 24 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => (typeof v === "number" ? `${formatNumber(v)} s` : "–") },
      xAxis: { type: "value", name: "s" },
      yAxis: {
        type: "category",
        data: rows.map((r) => name(str(r.stop_ext))),
        axisLabel: { width: 128, overflow: "truncate" },
      },
      series: [
        { type: "bar", name: t("analytics.dwell.median"), data: rows.map((r) => num(r.median_dwell_s)) },
        { type: "bar", name: "p90", data: rows.map((r) => num(r.p90_dwell_s)), itemStyle: { opacity: 0.45 } },
      ],
    }
  }, [top.rows, names, t])

  const hourOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 48, right: 16, top: 28, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => (typeof v === "number" ? `${formatNumber(v)} s` : "–") },
      xAxis: { type: "category", data: byHour.rows.map((r) => `${String(num(r.hour) ?? 0).padStart(2, "0")}:00`) },
      yAxis: { type: "value", name: "s", min: 0 },
      series: [
        {
          type: "bar",
          name: t("analytics.dwell.median"),
          data: byHour.rows.map((r) => ({
            value: num(r.median_dwell_s),
            itemStyle: (num(r.n) ?? 0) < MIN_SAMPLES ? { opacity: 0.3 } : undefined,
          })),
        },
        { type: "line", name: "p90", data: byHour.rows.map((r) => num(r.p90_dwell_s)), lineStyle: { type: "dashed" } },
      ],
    }),
    [byHour.rows, t],
  )

  const maxDwell = Math.max(1, ...top.rows.map((r) => num(r.median_dwell_s) ?? 0))
  const points = top.rows.flatMap((r) => {
    const s = names.get(str(r.stop_ext))
    return s
      ? [{ id: str(r.stop_ext), name: s.name, lat: s.lat, lon: s.lon, weight: (num(r.median_dwell_s) ?? 0) / maxDwell }]
      : []
  })
  const box = bounds(points.map((p) => [p.lon, p.lat]))

  return (
    <AnalyticsPage
      view="dwell"
      networkId={network.id}
      networkName={network.name}
      methodology={<p>{t("analytics.dwell.method.what")}</p>}
      actions={
        <ExportMenu
          networkId={network.id}
          metrics={[
            { metric: "dwell.stops", query: topQuery },
            ...(search.stop ? [{ metric: "dwell.stops" as const, query: stopQ }] : []),
          ]}
        />
      }
    >
      {top.error ? (
        <ErrorState onRetry={() => void top.refetch()} />
      ) : !top.isPending && top.rows.length === 0 ? (
        <EmptyState title={t("analytics.emptyTitle")}>{t("analytics.emptyBody")}</EmptyState>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={t("analytics.dwell.topTitle", { count: TOP })}
              description={t("analytics.dwell.topBody")}
              meta={top.data?.meta}
              pending={top.isPending}
            >
              {search.table ? (
                <ResultTable result={top.data} />
              ) : (
                <Chart
                  option={barOption}
                  label={t("analytics.dwell.topTitle", { count: TOP })}
                  className="h-[440px]"
                  onClick={(e) => {
                    const row = [...top.rows].reverse()[e.dataIndex]
                    if (row) setSearch({ stop: str(row.stop_ext) })
                  }}
                />
              )}
            </ChartCard>
            <ChartCard title={t("analytics.dwell.mapTitle")} description={t("analytics.dwell.mapBody")}>
              {box ? (
                <BaseMap key={box.join(",")} bounds={box} className="h-[440px]">
                  <StopsLayer id="dwell" stops={points} color="#d97706" selectedId={search.stop} />
                </BaseMap>
              ) : (
                <div className="h-[440px] animate-pulse rounded-2xl bg-muted" />
              )}
            </ChartCard>
          </div>
          {search.stop && (
            <ChartCard
              title={t("analytics.dwell.byHourTitle", { stop: label(search.stop) })}
              meta={byHour.data?.meta}
              pending={byHour.isPending}
              actions={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("live.drawer.close")}
                  onClick={() => {
                    setSearch({ stop: undefined })
                  }}
                >
                  <XIcon />
                </Button>
              }
            >
              {search.table ? (
                <ResultTable result={byHour.data} />
              ) : (
                <Chart option={hourOption} label={t("analytics.dwell.byHourTitle", { stop: search.stop })} />
              )}
            </ChartCard>
          )}
        </div>
      )}
    </AnalyticsPage>
  )
}
