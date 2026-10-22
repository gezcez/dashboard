import { CATEGORICAL, SURFACES, type ChartTheme } from "./palette"

/** ECharts theme objects derived from the dashboard tokens, one per colour scheme. */
export function echartsTheme(theme: ChartTheme): Record<string, unknown> {
  const s = SURFACES[theme]
  const axis = {
    axisLine: { show: true, lineStyle: { color: s.border } },
    axisTick: { show: false },
    axisLabel: { color: s.muted, fontSize: 11 },
    splitLine: { show: true, lineStyle: { color: s.grid } },
    splitArea: { show: false },
    nameTextStyle: { color: s.muted, fontSize: 11 },
  }
  return {
    color: [...CATEGORICAL[theme]],
    backgroundColor: "transparent",
    textStyle: { fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui", color: s.foreground },
    title: { textStyle: { color: s.foreground, fontSize: 13, fontWeight: 600 } },
    legend: { textStyle: { color: s.muted, fontSize: 11 }, icon: "roundRect", itemHeight: 8 },
    tooltip: {
      backgroundColor: s.card,
      borderColor: s.border,
      borderWidth: 1,
      textStyle: { color: s.foreground, fontSize: 12 },
      extraCssText: "border-radius: 12px; box-shadow: none;",
      axisPointer: { lineStyle: { color: s.muted }, crossStyle: { color: s.muted } },
    },
    categoryAxis: { ...axis, splitLine: { show: false } },
    valueAxis: { ...axis, axisLine: { show: false } },
    timeAxis: { ...axis, splitLine: { show: false } },
    logAxis: axis,
    line: { symbol: "none", lineStyle: { width: 2 }, smooth: false },
    bar: { itemStyle: { borderRadius: [3, 3, 0, 0] } },
    boxplot: { itemStyle: { borderWidth: 1.5 } },
    dataZoom: {
      borderColor: s.border,
      textStyle: { color: s.muted },
      fillerColor: theme === "dark" ? "rgb(251 191 36 / 0.15)" : "rgb(217 119 6 / 0.12)",
      handleStyle: { color: s.card, borderColor: s.muted },
      dataBackground: { lineStyle: { color: s.muted }, areaStyle: { color: s.grid } },
    },
    visualMap: { textStyle: { color: s.muted } },
    calendar: {
      itemStyle: { borderColor: s.card, borderWidth: 2, color: s.grid },
      splitLine: { show: false },
      dayLabel: { color: s.muted, fontSize: 10 },
      monthLabel: { color: s.muted, fontSize: 10 },
      yearLabel: { show: false },
    },
  }
}
