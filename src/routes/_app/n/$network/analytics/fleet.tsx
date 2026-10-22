import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import {
  autoGranularity,
  baseParams,
  previousRange,
  rangeOf,
  type MetricQuery,
} from "@/components/analytics/search"
import { fleetSeries, weekdayHourMedians } from "@/components/analytics/transform"
import { num, str, useMetric } from "@/components/analytics/use-metric"
import { useTimeFormat } from "@/components/analytics/time-format"
import { Chart, itemValue, type ChartOption } from "@/components/charts/chart"
import { SEQUENTIAL } from "@/components/charts/palette"
import { SelectFilter } from "@/components/data-table/filters"
import { ErrorState } from "@/components/states/states"
import { Button } from "@/components/ui/button"
import { KpiTile } from "@/components/ui/kpi-tile"
import { formatNumber } from "@/lib/format"
import { useResolvedTheme } from "@/lib/theme"
import { daySpan } from "@/lib/time"

export const Route = createFileRoute("/_app/n/$network/analytics/fleet")({
  staticData: { pageId: "network.analytics" },
  component: FleetPage,
})

function FleetPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search, setSearch } = useAnalyticsSearch()
  const theme = useResolvedTheme()
  const time = useTimeFormat(search.utc)
  const range = rangeOf(search)
  const gran = search.gran ?? autoGranularity(range)

  const lineQuery: MetricQuery = { ...baseParams(search), granularity: gran }
  const line = useMetric(network.id, "fleet.hourly", lineQuery)
  const prev = previousRange(range)
  const prevLine = useMetric(
    network.id,
    "fleet.hourly",
    { ...lineQuery, from: prev.from, to: prev.to },
    { enabled: Boolean(search.cmp) },
  )
  const hourlyQuery: MetricQuery = { ...baseParams(search), granularity: "1h" }
  const hourly = useMetric(network.id, "fleet.hourly", hourlyQuery)
  const dailyQuery: MetricQuery = { ...baseParams(search), granularity: "1d" }
  const daily = useMetric(network.id, "fleet.hourly", dailyQuery)
  const daysQuery: MetricQuery = baseParams(search)
  const vehicleDays = useMetric(network.id, "fleet.vehicle-days", daysQuery)

  const shiftMs = daySpan(range.from, range.to) * 86_400_000
  const lineOption = useMemo<ChartOption>(() => {
    const current = fleetSeries(line.rows, time.timeZone)
    const previous = search.cmp
      ? fleetSeries(prevLine.rows, time.timeZone).map(([x, y]): [number, number] => [x + shiftMs, y])
      : []
    return {
      grid: { left: 44, right: 16, top: 28, bottom: 56 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis", valueFormatter: (v) => formatNumber(Number(v)) },
      xAxis: { type: "time", axisLabel: { formatter: time.axis } },
      yAxis: { type: "value", name: t("analytics.fleet.vehicles"), min: 0 },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 8 }],
      series: [
        {
          type: "line",
          name: t("analytics.fleet.thisPeriod"),
          data: current,
          showSymbol: false,
          areaStyle: { opacity: 0.08 },
        },
        ...(search.cmp
          ? [
              {
                type: "line" as const,
                name: t("analytics.fleet.previousPeriod"),
                data: previous,
                showSymbol: false,
                lineStyle: { type: "dashed" as const, width: 1.5 },
              },
            ]
          : []),
      ],
    }
  }, [line.rows, prevLine.rows, search.cmp, shiftMs, t, time])

  const barsOption = useMemo<ChartOption>(
    () => ({
      grid: { left: 52, right: 16, top: 16, bottom: 28 },
      tooltip: { trigger: "axis", valueFormatter: (v) => formatNumber(Number(v)) },
      xAxis: { type: "category", data: daily.rows.map((r) => str(r.bucket).slice(5, 10)) },
      yAxis: { type: "value", name: t("analytics.fleet.vehicleHours") },
      series: [
        {
          type: "bar",
          name: t("analytics.fleet.vehicleHours"),
          data: daily.rows.map((r) => num(r.vehicle_hours)),
        },
      ],
    }),
    [daily.rows, t],
  )

  const heatmapOption = useMemo<ChartOption>(() => {
    const cells = weekdayHourMedians(hourly.rows)
    const max = Math.max(1, ...cells.map((c) => c[2]))
    return {
      grid: { left: 52, right: 16, top: 8, bottom: 64 },
      tooltip: {
        formatter: (p) => {
          const [h, d, v] = itemValue<[number, number, number]>(p)
          return `${time.weekdays[d] ?? ""} ${String(h).padStart(2, "0")}:00 · ${formatNumber(v)}`
        },
      },
      xAxis: {
        type: "category",
        data: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")),
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: time.weekdays,
        inverse: true,
      },
      visualMap: {
        min: 0,
        max,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 4,
        itemHeight: 120,
        inRange: { color: [...SEQUENTIAL[theme]] },
      },
      series: [{ type: "heatmap", data: cells, itemStyle: { borderRadius: 3, borderWidth: 1, borderColor: "transparent" } }],
    }
  }, [hourly.rows, theme, time])

  const kpis = useMemo(() => {
    const vehicles = new Set(vehicleDays.rows.map((r) => str(r.vehicle_id)))
    const duty = vehicleDays.rows.map((r) => num(r.duty_hours) ?? 0)
    const peak = Math.max(0, ...daily.rows.map((r) => num(r.peak_vehicles) ?? 0))
    const hours = daily.rows.reduce((a, r) => a + (num(r.vehicle_hours) ?? 0), 0)
    return {
      vehicles: vehicles.size,
      peak,
      hours,
      duty: duty.length ? duty.reduce((a, b) => a + b, 0) / duty.length : null,
      added: vehicleDays.rows.filter((r) => r.new_in_window === true).length,
    }
  }, [vehicleDays.rows, daily.rows])

  const error = line.error ?? hourly.error ?? daily.error ?? vehicleDays.error

  return (
    <AnalyticsPage
      view="fleet"
      networkId={network.id}
      networkName={network.name}
      methodology={<Methodology />}
      actions={
        <ExportMenu
          networkId={network.id}
          metrics={[
            { metric: "fleet.hourly", query: lineQuery },
            { metric: "fleet.vehicle-days", query: daysQuery },
          ]}
        />
      }
    >
      {error ? (
        <ErrorState onRetry={() => void line.refetch()} />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label={t("analytics.fleet.kpiVehicles")} value={formatNumber(kpis.vehicles)} hint={t("analytics.fleet.kpiAdded", { count: kpis.added })} />
            <KpiTile label={t("analytics.fleet.kpiPeak")} value={formatNumber(kpis.peak)} />
            <KpiTile label={t("analytics.fleet.vehicleHours")} value={formatNumber(Math.round(kpis.hours))} />
            <KpiTile
              label={t("analytics.fleet.kpiDuty")}
              value={kpis.duty === null ? "–" : `${formatNumber(kpis.duty, { maximumFractionDigits: 1 })} h`}
            />
          </div>
          <ChartCard
            title={t("analytics.fleet.activeTitle")}
            description={t("analytics.fleet.activeBody", { granularity: gran })}
            meta={line.data?.meta}
            pending={line.isPending}
            actions={
              <>
                <SelectFilter
                  label={t("analytics.fleet.granularity")}
                  value={search.gran}
                  options={(["5m", "1h", "1d"] as const).map((g) => ({ value: g, label: g }))}
                  onChange={(g) => {
                    setSearch({ gran: g })
                  }}
                />
                <Button
                  size="sm"
                  variant={search.cmp ? "primary" : "outline"}
                  aria-pressed={Boolean(search.cmp)}
                  onClick={() => {
                    setSearch({ cmp: search.cmp ? undefined : true })
                  }}
                >
                  {t("analytics.fleet.compare")}
                </Button>
              </>
            }
          >
            {search.table ? (
              <ResultTable result={line.data} />
            ) : (
              <Chart option={lineOption} label={t("analytics.fleet.activeTitle")} className="h-72" />
            )}
          </ChartCard>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={t("analytics.fleet.hoursTitle")}
              meta={daily.data?.meta}
              pending={daily.isPending}
            >
              {search.table ? (
                <ResultTable result={daily.data} />
              ) : (
                <Chart option={barsOption} label={t("analytics.fleet.hoursTitle")} />
              )}
            </ChartCard>
            <ChartCard
              title={t("analytics.fleet.heatmapTitle")}
              description={t("analytics.fleet.heatmapBody")}
              meta={hourly.data?.meta}
              pending={hourly.isPending}
            >
              {search.table ? (
                <ResultTable result={hourly.data} />
              ) : (
                <Chart option={heatmapOption} label={t("analytics.fleet.heatmapTitle")} className="h-72" />
              )}
            </ChartCard>
          </div>
          <ChartCard
            title={t("analytics.fleet.vehiclesTitle")}
            description={t("analytics.fleet.vehiclesBody")}
            meta={vehicleDays.data?.meta}
            pending={vehicleDays.isPending}
          >
            <ResultTable result={vehicleDays.data} maxRows={200} />
          </ChartCard>
        </div>
      )}
    </AnalyticsPage>
  )
}

function Methodology() {
  const { t } = useTranslation("ops")
  return (
    <>
      <p>{t("analytics.fleet.method.what")}</p>
      <h3>{t("analytics.method.filtersTitle")}</h3>
      <ul>
        <li>{t("analytics.method.staff")}</li>
        <li>{t("analytics.method.test")}</li>
        <li>{t("analytics.method.outliers")}</li>
      </ul>
      <h3>{t("analytics.method.caveatsTitle")}</h3>
      <p>{t("analytics.fleet.method.caveats")}</p>
    </>
  )
}
