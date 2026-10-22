import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { Chart, type ChartOption } from "@/components/charts/chart"
import { CATEGORICAL, STATUS } from "@/components/charts/palette"
import { useTimeFormat } from "@/components/analytics/time-format"
import { Card } from "@/components/ui/card"
import { formatNumber } from "@/lib/format"
import { useResolvedTheme } from "@/lib/theme"

type Series = components["schemas"]["BindingSeriesDto"]

/** Poll gaps as markArea bands, the same on every chart of the page. */
function gapAreas(series: Series, label: string) {
  return {
    silent: true,
    itemStyle: { color: "rgba(234, 88, 12, 0.12)" },
    label: { show: false },
    data: series.gaps.map(([from = "", to = ""]) => [
      { xAxis: Date.parse(from), name: label },
      { xAxis: Date.parse(to) },
    ]) as [{ xAxis: number; name: string }, { xAxis: number }][],
  }
}

/**
 * The binding's last 24 h (plan 6.5): latency, success vs errors by code, vehicles per poll,
 * feed lag and dedup ratio. The four charts share a crosshair and the gap bands.
 */
export function StatusCharts({ series, bindingId }: { series: Series; bindingId: number }) {
  const { t } = useTranslation("ops")
  const theme = useResolvedTheme()
  const time = useTimeFormat()
  const group = `binding-${String(bindingId)}`

  const options = useMemo(() => {
    const xs = series.t.map((iso) => Date.parse(iso))
    const pair = (ys: (number | null)[]) => xs.map((x, i) => [x, ys[i] ?? null] as [number, number | null])
    const base = (yName: string): ChartOption => ({
      grid: { left: 52, right: 16, top: 32, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "time", axisLabel: { formatter: time.axis } },
      yAxis: { type: "value", name: yName, min: 0 },
    })
    const gaps = gapAreas(series, t("tracker.charts.gap"))
    const errorCodes = Object.keys(series.errors)

    const latency: ChartOption = {
      ...base("ms"),
      series: [
        { type: "line", name: "p50", data: pair(series.latency_p50_ms), showSymbol: false, markArea: gaps },
        { type: "line", name: "p95", data: pair(series.latency_p95_ms), showSymbol: false, lineStyle: { type: "dashed" } },
      ],
    }
    const polls: ChartOption = {
      ...base(t("tracker.charts.polls")),
      series: [
        {
          type: "bar",
          stack: "p",
          name: t("tracker.charts.ok"),
          data: pair(series.ok),
          color: STATUS.ok,
          markArea: gaps,
          barMaxWidth: 8,
        },
        ...(errorCodes.length
          ? errorCodes.map((code, i) => ({
              type: "bar" as const,
              stack: "p",
              name: code,
              data: pair(series.errors[code] ?? []),
              color: i === 0 ? STATUS.error : CATEGORICAL[theme][(i + 3) % 8],
              barMaxWidth: 8,
            }))
          : [
              {
                type: "bar" as const,
                stack: "p",
                name: t("tracker.charts.failed"),
                data: pair(series.failed),
                color: STATUS.error,
                barMaxWidth: 8,
              },
            ]),
      ],
    }
    const vehicles: ChartOption = {
      ...base(t("tracker.charts.vehicles")),
      series: [
        { type: "line", name: t("tracker.charts.vehicles"), data: pair(series.vehicles), showSymbol: false, areaStyle: { opacity: 0.08 }, markArea: gaps },
      ],
    }
    const lag: ChartOption = {
      ...base("s"),
      yAxis: [
        { type: "value", name: "s", min: 0 },
        { type: "value", name: t("tracker.charts.dedup"), min: 0, max: 1, splitLine: { show: false } },
      ],
      series: [
        { type: "line", name: t("tracker.charts.lagP50"), data: pair(series.lag_p50_s), showSymbol: false, markArea: gaps },
        { type: "line", name: t("tracker.charts.lagP95"), data: pair(series.lag_p95_s), showSymbol: false, lineStyle: { type: "dashed" } },
        {
          type: "line",
          name: t("tracker.charts.dedup"),
          yAxisIndex: 1,
          data: pair(series.dedup_ratio),
          showSymbol: false,
          lineStyle: { width: 1 },
        },
      ],
    }
    return { latency, polls, vehicles, lag }
  }, [series, t, theme, time])

  const total = series.polls.reduce((a, b) => a + b, 0)
  const failed = series.failed.reduce((a, b) => a + b, 0)

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-1 font-semibold">{t("tracker.charts.latencyTitle")}</h3>
        <Chart option={options.latency} label={t("tracker.charts.latencyTitle")} group={group} />
      </Card>
      <Card className="p-4">
        <h3 className="mb-1 font-semibold">
          {t("tracker.charts.pollsTitle")}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {t("tracker.charts.pollsSummary", {
              total: formatNumber(total),
              failed: formatNumber(failed),
            })}
          </span>
        </h3>
        <Chart option={options.polls} label={t("tracker.charts.pollsTitle")} group={group} />
      </Card>
      <Card className="p-4">
        <h3 className="mb-1 font-semibold">{t("tracker.charts.vehiclesTitle")}</h3>
        <Chart option={options.vehicles} label={t("tracker.charts.vehiclesTitle")} group={group} />
      </Card>
      <Card className="p-4">
        <h3 className="mb-1 font-semibold">{t("tracker.charts.lagTitle")}</h3>
        <Chart option={options.lag} label={t("tracker.charts.lagTitle")} group={group} />
      </Card>
    </div>
  )
}
