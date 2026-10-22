import type { PickingInfo } from "@deck.gl/core"
import { H3HexagonLayer } from "@deck.gl/geo-layers"
import { createFileRoute } from "@tanstack/react-router"
import { cellToLatLng } from "h3-js"
import { XIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsPage, useAnalyticsSearch } from "@/components/analytics/analytics-page"
import { ChartCard, ExportMenu, ResultTable } from "@/components/analytics/panels"
import { baseParams, type MetricQuery } from "@/components/analytics/search"
import { num, str, useMetric, median } from "@/components/analytics/use-metric"
import { rampColor, SPEED_RAMP } from "@/components/charts/palette"
import { SelectFilter } from "@/components/data-table/filters"
import { BaseMap } from "@/components/map/base-map"
import { DeckOverlay } from "@/components/map/deck-overlay"
import { EmptyState, ErrorState } from "@/components/states/states"
import { Button } from "@/components/ui/button"
import { KpiTile } from "@/components/ui/kpi-tile"
import { formatNumber } from "@/lib/format"
import { bounds, type LngLat } from "@/lib/geo"

export const Route = createFileRoute("/_app/n/$network/analytics/speed")({
  staticData: { pageId: "network.analytics" },
  component: SpeedPage,
})

interface Cell {
  h3: string
  median: number
  p15: number | null
  n: number
}

const kmh = (v: number | null) => (v === null ? "–" : `${formatNumber(v, { maximumFractionDigits: 1 })} km/h`)

function SpeedPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { search, setSearch } = useAnalyticsSearch()
  const res = search.res ?? 8
  const query: MetricQuery = { ...baseParams(search), res, hour: search.hour, route_id: search.route }
  const result = useMetric(network.id, "speed.heatmap", query)
  const [picked, setPicked] = useState<Cell | null>(null)

  const cells = useMemo<Cell[]>(
    () =>
      result.rows.flatMap((r) => {
        const m = num(r.median_kmh)
        return m === null
          ? []
          : [{ h3: str(r.h3), median: m, p15: num(r.p15_kmh), n: num(r.n) ?? 0 }]
      }),
    [result.rows],
  )
  const box = useMemo(
    () =>
      bounds(
        cells.slice(0, 2000).map((c) => {
          const [lat, lon] = cellToLatLng(c.h3)
          return [lon, lat] as LngLat
        }),
      ),
    [cells],
  )

  const layer = new H3HexagonLayer<Cell>({
    id: "speed",
    data: cells,
    getHexagon: (d) => d.h3,
    getFillColor: (d) => [...rampColor(SPEED_RAMP, d.median), 190],
    getLineColor: (d) => (d.h3 === picked?.h3 ? [23, 37, 84, 255] : [255, 255, 255, 60]),
    getLineWidth: (d) => (d.h3 === picked?.h3 ? 3 : 0.5),
    lineWidthUnits: "pixels",
    stroked: true,
    extruded: false,
    pickable: true,
    autoHighlight: true,
    highlightColor: [251, 191, 36, 120],
    updateTriggers: { getLineColor: [picked?.h3], getLineWidth: [picked?.h3] },
  })

  const hourLabel =
    search.hour === undefined ? t("analytics.speed.allDay") : `${String(search.hour).padStart(2, "0")}:00`

  return (
    <AnalyticsPage
      view="speed"
      networkId={network.id}
      networkName={network.name}
      show={{ route: true, hours: false }}
      methodology={
        <>
          <p>{t("analytics.speed.method.what")}</p>
          <p>{t("analytics.speed.method.samples")}</p>
        </>
      }
      actions={<ExportMenu networkId={network.id} metrics={[{ metric: "speed.heatmap", query }]} />}
    >
      {result.error ? (
        <ErrorState onRetry={() => void result.refetch()} />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiTile label={t("analytics.speed.median")} value={kmh(median(cells.map((c) => c.median)))} />
            <KpiTile label={t("analytics.speed.cells")} value={formatNumber(cells.length)} hint={t("analytics.speed.resolution", { res })} />
            <KpiTile label={t("analytics.speed.slowCells")} value={formatNumber(cells.filter((c) => c.median < 12).length)} hint={t("analytics.speed.slowHint")} />
          </div>
          <ChartCard
            title={t("analytics.speed.mapTitle", { hour: hourLabel })}
            description={t("analytics.speed.mapBody")}
            meta={result.data?.meta}
            actions={
              <SelectFilter
                label={t("analytics.speed.res")}
                value={search.res === undefined ? undefined : String(search.res)}
                options={[7, 8, 9].map((r) => ({ value: String(r), label: String(r) }))}
                onChange={(v) => {
                  setSearch({ res: v === undefined ? undefined : Number(v) })
                }}
              />
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex flex-1 items-center gap-3 text-sm" htmlFor="speed-hour">
                <span className="shrink-0 text-muted-foreground">{t("analytics.speed.hour")}</span>
                <input
                  id="speed-hour"
                  type="range"
                  min={-1}
                  max={23}
                  step={1}
                  value={search.hour ?? -1}
                  aria-valuetext={hourLabel}
                  onChange={(e) => {
                    const h = Number(e.target.value)
                    setSearch({ hour: h < 0 ? undefined : h })
                  }}
                  className="min-w-40 flex-1 accent-brand"
                />
                <span className="tabular w-16 text-right font-semibold">{hourLabel}</span>
              </label>
              <SpeedLegend />
            </div>
            {search.table ? (
              <ResultTable result={result.data} />
            ) : !result.isPending && cells.length === 0 ? (
              <EmptyState title={t("analytics.emptyTitle")}>{t("analytics.speed.empty")}</EmptyState>
            ) : (
              <BaseMap
                key={box?.join(",") ?? "none"}
                bounds={box ?? undefined}
                className="h-[520px]"
              >
                <DeckOverlay
                  layers={[layer]}
                  onClick={(info: PickingInfo<Cell>) => {
                    setPicked(info.object ?? null)
                  }}
                  getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
                />
                {picked && (
                  <div className="absolute right-3 bottom-8 z-10 w-60 rounded-2xl border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{picked.h3}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("live.drawer.close")}
                        onClick={() => {
                          setPicked(null)
                        }}
                      >
                        <XIcon />
                      </Button>
                    </div>
                    <dl className="mt-1 grid grid-cols-2 gap-1 text-xs">
                      <dt className="text-muted-foreground">{t("analytics.speed.median")}</dt>
                      <dd className="tabular text-right font-semibold">{kmh(picked.median)}</dd>
                      <dt className="text-muted-foreground">p15</dt>
                      <dd className="tabular text-right">{kmh(picked.p15)}</dd>
                      <dt className="text-muted-foreground">n</dt>
                      <dd className="tabular text-right">{formatNumber(picked.n)}</dd>
                    </dl>
                  </div>
                )}
              </BaseMap>
            )}
          </ChartCard>
        </div>
      )}
    </AnalyticsPage>
  )
}

function SpeedLegend() {
  const { t } = useTranslation("ops")
  const stops = SPEED_RAMP.map(([v, c]) => `${c} ${String((v / 50) * 100)}%`).join(", ")
  return (
    <figure className="flex items-center gap-2 text-xs text-muted-foreground" aria-label={t("analytics.speed.legend")}>
      <span>0</span>
      <span className="h-2.5 w-40 rounded-full" style={{ background: `linear-gradient(to right, ${stops})` }} />
      <span>50+ km/h</span>
    </figure>
  )
}
