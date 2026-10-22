import { useQueries, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre"
import { HistoryIcon, ListFilterIcon, MaximizeIcon, PauseCircleIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { routeColor } from "@/components/charts/palette"
import { ConnectionBadge } from "@/components/live/connection-badge"
import { LiveFilterPanel } from "@/components/live/filter-panel"
import {
  facetCounts,
  filterVehicles,
  liveSearchSchema,
  motionOf,
  type LiveSearch,
  type RouteInfo,
} from "@/components/live/filters"
import { VehicleDrawer } from "@/components/live/vehicle-drawer"
import {
  VEHICLE_LAYER,
  VehicleLayer,
  vehicleFeatures,
} from "@/components/live/vehicle-layer"
import { BaseMap } from "@/components/map/base-map"
import {
  RouteShapeLayer,
  StopsLayer,
  STOPS_LAYER,
  TrailLayer,
  type ShapeLine,
} from "@/components/map/layers"
import { PageHeader } from "@/components/layout/page-header"
import { routesQuery, shapeQuery, useRouteIndex } from "@/components/transit/queries"
import { Button } from "@/components/ui/button"
import { apiQuery } from "@/lib/api"
import { formatClock, formatNumber } from "@/lib/format"
import { bounds, decodePolyline, type LngLat } from "@/lib/geo"
import { assertPage } from "@/lib/pages"
import { useVehicleFeed, useVehicles } from "@/lib/realtime"
import { useResolvedTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_app/n/$network/live/")({
  staticData: { pageId: "network.live" },
  validateSearch: liveSearchSchema,
  beforeLoad: ({ context }) => assertPage("network.live", context),
  loader: ({ context }) =>
    context.queryClient.query(routesQuery(context.network.id)).catch(() => undefined),
  component: LiveMap,
})

/** Shapes are drawn for at most this many selected routes. */
const MAX_SHAPES = 8
/** Stops load by viewport from this zoom up. */
const STOPS_MIN_ZOOM = 13
const TURKEY = { longitude: 32.8, latitude: 39.4, zoom: 5 }

function LiveMap() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const theme = useResolvedTheme()
  const mapRef = useRef<MapRef>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const setSearch = useCallback(
    (patch: Partial<LiveSearch>) =>
      void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true }),
    [navigate],
  )

  const routeIndex = useRouteIndex(network.id)
  const routeInfo = routeIndex.byId as ReadonlyMap<string, RouteInfo>
  const feed = useVehicleFeed(network.id)
  const all = useVehicles(feed.store)
  const vehicles = useMemo(() => [...all.values()], [all])
  const shown = useMemo(
    () => filterVehicles(vehicles, search, routeInfo),
    [vehicles, search, routeInfo],
  )
  const counts = useMemo(
    () => facetCounts(vehicles, search, routeInfo),
    [vehicles, search, routeInfo],
  )
  const features = useMemo(
    () => vehicleFeatures(shown, routeIndex.byId, theme),
    [shown, routeIndex.byId, theme],
  )
  const agencies = useMemo(
    () => [...new Set(routeIndex.list.map((r) => r.agency).filter((a): a is string => !!a))],
    [routeIndex.list],
  )
  const totals = useMemo(() => {
    const out = { moving: 0, stopped: 0, stale: 0 }
    for (const v of vehicles) out[motionOf(v)]++
    return out
  }, [vehicles])

  // Fit to the fleet once, on the first snapshot.
  const fitted = useRef(false)
  const fitToFleet = useCallback(
    (animate: boolean) => {
      const box = bounds(vehicles.map((v) => [v.lon, v.lat] as LngLat))
      if (!box) return
      mapRef.current?.fitBounds(box, { padding: 48, maxZoom: 14, duration: animate ? 600 : 0 })
    },
    [vehicles],
  )
  useEffect(() => {
    if (fitted.current || vehicles.length === 0 || !mapRef.current) return
    fitted.current = true
    fitToFleet(false)
  }, [vehicles, fitToFleet])

  // Selected vehicle, follow mode and 1 h trail.
  const selected = search.vehicle ? all.get(search.vehicle) : undefined
  const selectedRoute = selected?.route_id ? routeIndex.byId.get(selected.route_id) : undefined
  useEffect(() => {
    if (!search.follow || !selected) return
    mapRef.current?.easeTo({ center: [selected.lon, selected.lat], duration: 900 })
  }, [search.follow, selected])
  const track = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/vehicles/{vehicleId}/track", {
      params: {
        path: { networkId: String(network.id), vehicleId: search.vehicle ?? "" },
        query: { since: 3600 },
      },
    }),
    enabled: Boolean(search.vehicle),
    refetchInterval: 60_000,
  })
  const trail = useMemo<LngLat[]>(() => {
    const d = track.data
    if (!d) return []
    const coords = d.t.map((_, i) => [d.lon[i] ?? 0, d.lat[i] ?? 0] as LngLat)
    if (selected) coords.push([selected.lon, selected.lat])
    return coords
  }, [track.data, selected])

  // Route shapes for selected routes (or the selected vehicle's route).
  const shapeIds = useMemo(() => {
    const ids = new Set(search.routes ?? [])
    if (selected?.route_id) ids.add(selected.route_id)
    return [...ids].slice(0, MAX_SHAPES)
  }, [search.routes, selected?.route_id])
  const shapes = useQueries({ queries: shapeIds.map((id) => shapeQuery(id)) })
  const shapeLines = useMemo<ShapeLine[]>(
    () =>
      shapes.flatMap((q) =>
        (q.data?.shapes ?? []).map((s) => ({
          id: `${q.data?.route_id ?? ""}:${s.pattern_id}`,
          color: routeColor(routeIndex.byId.get(q.data?.route_id ?? ""), theme),
          coords: decodePolyline(s.polyline, q.data?.precision ?? 6),
          dashed: s.direction === 1,
        })),
      ),
    [shapes, routeIndex.byId, theme],
  )

  // Stops in view, from zoom 13.
  const [view, setView] = useState<{ zoom: number; bbox: string } | null>(null)
  const onMoveEnd = () => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    const r = (n: number) => n.toFixed(3)
    setView({
      zoom: map.getZoom(),
      bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map(r).join(","),
    })
  }
  const stopsVisible = Boolean(search.stops) && (view?.zoom ?? 0) >= STOPS_MIN_ZOOM
  const stops = useQuery({
    ...apiQuery("/v1/networks/{networkId}/stops", {
      params: {
        path: { networkId: String(network.id) },
        query: { bbox: view?.bbox ?? "", limit: 200 },
      },
    }),
    enabled: stopsVisible,
    staleTime: 10 * 60_000,
  })

  const onClick = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return
    if (f.layer.id === VEHICLE_LAYER) setSearch({ vehicle: String(f.properties.id) })
    else if (f.layer.id === STOPS_LAYER)
      void navigate({
        to: "/n/$network/catalog/stops/$stop",
        params: { network: network.slug, stop: String(f.properties.id) },
      })
  }

  const paused = [...feed.bindings.entries()].filter(
    ([, b]) => b.state === "paused" || b.state === "killed",
  )

  return (
    <>
      <PageHeader
        eyebrow={network.name}
        title={t("live.title")}
        actions={
          <>
            <ConnectionBadge state={feed.connection} />
            <Button variant="outline" size="sm" asChild>
              <Link to="/n/$network/live/playback" params={{ network: network.slug }}>
                <HistoryIcon />
                {t("live.playback")}
              </Link>
            </Button>
          </>
        }
      />
      <dl className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t("live.strip.total")}</dt>
          <dd className="tabular font-semibold">{formatNumber(vehicles.length)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t("live.motion.moving")}</dt>
          <dd className="tabular font-semibold">{formatNumber(totals.moving)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t("live.motion.stopped")}</dt>
          <dd className="tabular font-semibold">{formatNumber(totals.stopped)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t("live.motion.stale")}</dt>
          <dd className={cn("tabular font-semibold", totals.stale > 0 && "text-status-warn")}>
            {formatNumber(totals.stale)}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t("live.strip.feed")}</dt>
          <dd className="tabular font-semibold">
            {feed.store.feedTs() ? formatClock(feed.store.feedTs(), undefined, true) : "–"}
          </dd>
        </div>
        {shown.length !== vehicles.length && (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{t("live.strip.shown")}</dt>
            <dd className="tabular font-semibold">{formatNumber(shown.length)}</dd>
          </div>
        )}
      </dl>
      {paused.length > 0 && (
        <div
          role="status"
          className="mb-3 flex items-center gap-2 rounded-2xl border border-status-warn/30 bg-status-warn/10 px-4 py-2 text-sm"
        >
          <PauseCircleIcon className="size-4 text-status-warn" />
          {t("live.pausedBanner", { count: paused.length })}
        </div>
      )}
      {feed.error && (
        <p role="alert" className="mb-3 text-sm text-status-error">
          {feed.error.message}
        </p>
      )}
      <div className="flex h-[calc(100dvh-15rem)] min-h-[440px] gap-3">
        {panelOpen && (
          <aside
            aria-label={t("live.filters.label")}
            className="absolute inset-x-4 z-30 max-h-[70dvh] overflow-y-auto rounded-2xl border bg-card p-4 lg:static lg:inset-auto lg:max-h-none lg:w-72 lg:shrink-0"
          >
            <LiveFilterPanel
              search={search}
              counts={counts}
              routes={routeIndex.list}
              agencies={agencies}
              onChange={setSearch}
            />
          </aside>
        )}
        <BaseMap
          ref={mapRef}
          className="min-w-0 flex-1"
          initialViewState={TURKEY}
          interactiveLayerIds={[VEHICLE_LAYER, ...(stopsVisible ? [STOPS_LAYER] : [])]}
          onClick={onClick}
          onMoveEnd={onMoveEnd}
          onLoad={onMoveEnd}
          cursor="auto"
          overlay={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-card"
                aria-expanded={panelOpen}
                onClick={() => {
                  setPanelOpen((o) => !o)
                }}
              >
                <ListFilterIcon />
                {t("live.filters.toggle")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-card"
                onClick={() => {
                  fitToFleet(true)
                }}
              >
                <MaximizeIcon />
                {t("live.fit")}
              </Button>
            </div>
          }
        >
          {shapeLines.length > 0 && <RouteShapeLayer lines={shapeLines} />}
          {stopsVisible && stops.data && (
            <StopsLayer
              stops={stops.data.items.map((s) => ({ id: s.id, name: s.name, lon: s.lon, lat: s.lat }))}
            />
          )}
          {search.vehicle && trail.length > 1 && (
            <TrailLayer coords={trail} color={routeColor(selectedRoute, theme)} />
          )}
          <VehicleLayer
            data={features}
            selectedId={search.vehicle}
            labels={Boolean(search.labels)}
          />
          {search.vehicle && (
            <VehicleDrawer
              network={network.slug}
              vehicleId={search.vehicle}
              vehicle={selected}
              route={selectedRoute}
              follow={Boolean(search.follow)}
              onFollow={(follow) => {
                setSearch({ follow: follow || undefined })
              }}
              onClose={() => {
                setSearch({ vehicle: undefined, follow: undefined })
              }}
            />
          )}
        </BaseMap>
      </div>
    </>
  )
}
