import {
  BarChart,
  BoxplotChart,
  CustomChart,
  HeatmapChart,
  LineChart,
  ScatterChart,
  type BarSeriesOption,
  type BoxplotSeriesOption,
  type CustomSeriesOption,
  type HeatmapSeriesOption,
  type LineSeriesOption,
  type ScatterSeriesOption,
} from "echarts/charts"
import {
  CalendarComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapComponent,
  type CalendarComponentOption,
  type DataZoomComponentOption,
  type GridComponentOption,
  type LegendComponentOption,
  type MarkAreaComponentOption,
  type MarkLineComponentOption,
  type TooltipComponentOption,
  type VisualMapComponentOption,
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { useEffect, useRef } from "react"
import { useResolvedTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { echartsTheme } from "./theme"

echarts.use([
  LineChart,
  BarChart,
  BoxplotChart,
  HeatmapChart,
  CustomChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  VisualMapComponent,
  CalendarComponent,
  LegendComponent,
  CanvasRenderer,
])
echarts.registerTheme("gz-light", echartsTheme("light"))
echarts.registerTheme("gz-dark", echartsTheme("dark"))

export type ChartOption = echarts.ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | BoxplotSeriesOption
  | HeatmapSeriesOption
  | CustomSeriesOption
  | ScatterSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
  | MarkAreaComponentOption
  | MarkLineComponentOption
  | VisualMapComponentOption
  | CalendarComponentOption
  | LegendComponentOption
>

export type ChartClick = echarts.ECElementEvent

/** The `value` of a tooltip formatter's item (ECharts types it as a union of every shape). */
export function itemValue<T>(params: unknown): T {
  return (params as { value: T }).value
}

/**
 * Thin ECharts wrapper (plan 8.4): only the chart types the dashboard uses are registered, the
 * theme follows the app's light/dark mode, and the canvas resizes with its box. `group` links
 * charts for a synced crosshair (echarts.connect). The label is the accessible name; pages
 * also offer the rows as a table.
 */
export function Chart({
  option,
  label,
  className,
  group,
  onClick,
}: {
  option: ChartOption
  label: string
  className?: string
  group?: string
  onClick?: (event: ChartClick) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)
  const theme = useResolvedTheme()
  const clickRef = useRef(onClick)
  useEffect(() => {
    clickRef.current = onClick
  }, [onClick])

  useEffect(() => {
    const node = el.current
    if (!node) return
    const instance = echarts.init(node, theme === "dark" ? "gz-dark" : "gz-light", {
      renderer: "canvas",
    })
    chart.current = instance
    instance.on("click", (e) => clickRef.current?.(e))
    const observer = new ResizeObserver(() => {
      instance.resize()
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      instance.dispose()
      chart.current = null
    }
  }, [theme])

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true, lazyUpdate: true })
  }, [option, theme])

  useEffect(() => {
    const instance = chart.current
    if (!instance || !group) return
    instance.group = group
    echarts.connect(group)
  }, [group, theme])

  return <div ref={el} role="img" aria-label={label} className={cn("h-64 w-full", className)} />
}
