import { TripsLayer } from "@deck.gl/geo-layers"
import { ScatterplotLayer } from "@deck.gl/layers"
import type { PickingInfo } from "@deck.gl/core"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { hashedColor, routeColor } from "@/components/charts/palette"
import { SelectFilter } from "@/components/data-table/filters"
import { BaseMap } from "@/components/map/base-map"
import { DeckOverlay } from "@/components/map/deck-overlay"
import { PageHeader } from "@/components/layout/page-header"
import { activeHistogram, headsAt, inGap, toTrips, type Head } from "@/components/playback/replay"
import { Scrubber, type Speed } from "@/components/playback/scrubber"
import { RouteBadge } from "@/components/transit/route-badge"
import { compareRouteCodes, routesQuery, useRouteIndex } from "@/components/transit/queries"
import { EmptyState, ErrorState } from "@/components/states/states"
import { Button } from "@/components/ui/button"
import { apiQuery } from "@/lib/api"
import { formatClock, formatSpeed } from "@/lib/format"
import { bounds } from "@/lib/geo"
import { assertPage } from "@/lib/pages"
import { useResolvedTheme } from "@/lib/theme"
import { DEFAULT_NETWORK_TIMEZONE } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { MapRef } from "react-map-gl/maplibre"

const HOURS = [1, 3, 6, 12, 24] as const
/** Network-wide playback is capped at 6 h; one route may replay 24 h (plan 6.4). */
const NETWORK_MAX_HOURS = 6

const searchSchema = z.object({
  hours: z
    .union([z.literal(1), z.literal(3), z.literal(6), z.literal(12), z.literal(24)])
    .optional()
    .catch(undefined),
  routes: z.array(z.string()).optional().catch(undefined),
  vehicle: z.string().optional(),
})

export const Route = createFileRoute("/_app/n/$network/live/playback")({
  staticData: { pageId: "network.live" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.playback", context),
  loader: ({ context }) =>
    context.queryClient.query(routesQuery(context.network.id)).catch(() => undefined),
  component: Playback,
})

const TRAIL_S = 180

function Playback() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const theme = useResolvedTheme()
  const tz = DEFAULT_NETWORK_TIMEZONE
  const mapRef = useRef<MapRef>(null)
  const routeIndex = useRouteIndex(network.id)

  const routeFilter = search.routes?.length ? search.routes : undefined
  const maxHours = routeFilter ? 24 : NETWORK_MAX_HOURS
  const hours = Math.min(search.hours ?? 1, maxHours)
  // The window ends at the current minute when the page opens; changing presets re-anchors it.
  const [anchor] = useState(() => Math.floor(Date.now() / 60_000) * 60)
  const from = new Date((anchor - hours * 3600) * 1000).toISOString()
  const to = new Date(anchor * 1000).toISOString()

  const replay = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/replay", {
      params: {
        path: { networkId: String(network.id) },
        query: { from, to, ...(routeFilter ? { routes: routeFilter.join(",") } : {}) },
      },
    }),
    staleTime: Infinity,
  })
  const data = replay.data
  const span = data ? data.end - data.start : hours * 3600
  const trips = useMemo(() => (data ? toTrips(data) : []), [data])
  const histogram = useMemo(() => (data ? activeHistogram(data, 120) : []), [data])

  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(60)
  const [picked, setPicked] = useState<{ vehicle: number } | null>(null)

  // Start at the beginning of each new window, and frame it.
  useEffect(() => {
    if (!data) return
    setTime(0)
    setPicked(null)
    const box = bounds(trips.flatMap((tr) => tr.path))
    if (box) mapRef.current?.fitBounds(box, { padding: 40, duration: 0 })
  }, [data, trips])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setTime((prev) => {
        const next = prev + dt * speed
        if (next >= span) {
          setPlaying(false)
          return span
        }
        return next
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [playing, speed, span])

  const colorOf = useMemo(() => {
    const cache = new Map<number, [number, number, number]>()
    return (vehicle: number): [number, number, number] => {
      let c = cache.get(vehicle)
      if (!c) {
        const routeId = data?.routes[vehicle] ?? null
        const hex = routeId
          ? routeColor(routeIndex.byId.get(routeId), theme)
          : hashedColor(String(vehicle), theme)
        c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
        cache.set(vehicle, c)
      }
      return c
    }
  }, [data, routeIndex.byId, theme])

  const highlight = search.vehicle ? data?.vehicles.indexOf(search.vehicle) : undefined
  const heads = useMemo(() => headsAt(trips, time), [trips, time])
  const pickedHead = picked ? heads.find((h) => h.trip.vehicle === picked.vehicle) : undefined

  const layers = [
    new TripsLayer({
      id: "trips",
      data: trips,
      getPath: (d) => d.path,
      getTimestamps: (d) => d.timestamps,
      getColor: (d) => colorOf(d.vehicle),
      opacity: 0.85,
      widthMinPixels: 3,
      capRounded: true,
      jointRounded: true,
      trailLength: TRAIL_S,
      currentTime: time,
      fadeTrail: true,
    }),
    new ScatterplotLayer<Head>({
      id: "heads",
      data: heads,
      getPosition: (d) => d.position,
      getFillColor: (d) => [...colorOf(d.trip.vehicle), 255],
      getLineColor: (d) =>
        d.trip.vehicle === highlight || d.trip.vehicle === picked?.vehicle
          ? [217, 119, 6, 255]
          : [255, 255, 255, 230],
      getRadius: (d) => (d.trip.vehicle === highlight ? 9 : 5),
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      getLineWidth: (d) => (d.trip.vehicle === highlight || d.trip.vehicle === picked?.vehicle ? 3 : 1.5),
      stroked: true,
      pickable: true,
      updateTriggers: {
        getLineColor: [highlight, picked?.vehicle],
        getRadius: [highlight],
        getLineWidth: [highlight, picked?.vehicle],
      },
    }),
  ]

  const routeOptions = [...routeIndex.list]
    .sort((a, b) => compareRouteCodes(a.short_name, b.short_name))
    .map((r) => ({ value: r.id, label: `${r.short_name} ${r.long_name}` }))
  const pickedRoute = pickedHead ? data?.routes[pickedHead.trip.vehicle] : null

  return (
    <>
      <PageHeader
        eyebrow={network.name}
        title={t("playback.title")}
        intro={t("playback.intro")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/n/$network/live" params={{ network: network.slug }}>
              <ArrowLeftIcon />
              {t("playback.backToLive")}
            </Link>
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="group" aria-label={t("playback.window")}>
          {HOURS.map((h) => (
            <Button
              key={h}
              size="sm"
              variant={h === hours ? "primary" : "outline"}
              disabled={h > maxHours}
              title={h > maxHours ? t("playback.capHint", { hours: NETWORK_MAX_HOURS }) : undefined}
              onClick={() => {
                void navigate({ search: (prev) => ({ ...prev, hours: h }), replace: true })
              }}
            >
              {t("playback.hours", { count: h })}
            </Button>
          ))}
        </div>
        <SelectFilter
          label={t("playback.route")}
          value={routeFilter?.[0]}
          options={routeOptions}
          onChange={(route) => {
            void navigate({
              search: (prev) => ({ ...prev, routes: route ? [route] : undefined }),
              replace: true,
            })
          }}
        />
        {data && (
          <span className="text-sm text-muted-foreground">
            {t("playback.summary", { vehicles: data.vehicles.length, rows: data.t.length })}
          </span>
        )}
      </div>
      {replay.error ? (
        <ErrorState onRetry={() => void replay.refetch()} />
      ) : (
        <div className="grid gap-3">
          <BaseMap ref={mapRef} className="h-[calc(100dvh-22rem)] min-h-[380px]">
            <DeckOverlay
              layers={layers}
              onClick={(info: PickingInfo<Head>) => {
                setPicked(info.object ? { vehicle: info.object.trip.vehicle } : null)
              }}
              getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
            />
            {data && inGap(data, time) && (
              <p className="absolute top-3 right-14 z-10 rounded-full bg-status-warn px-3 py-1 text-xs font-semibold text-white">
                {t("playback.inGap")}
              </p>
            )}
            {pickedHead && data && (
              <div className="absolute right-3 bottom-8 z-10 w-64 rounded-2xl border bg-card p-3 text-sm">
                <div className="flex items-center gap-2">
                  <RouteBadge
                    route={pickedRoute ? routeIndex.byId.get(pickedRoute) : undefined}
                    code={pickedRoute}
                  />
                  <span className="flex-1 truncate font-semibold">
                    {data.plates?.[pickedHead.trip.vehicle] ?? data.vehicles[pickedHead.trip.vehicle]}
                  </span>
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
                <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <dt className="text-muted-foreground">{t("playback.at")}</dt>
                  <dd className="tabular text-right">
                    {formatClock(data.start + time, tz, true)}
                  </dd>
                  <dt className="text-muted-foreground">{t("live.drawer.speed")}</dt>
                  <dd className="tabular text-right">{formatSpeed(pickedHead.speed)}</dd>
                  <dt className="text-muted-foreground">{t("playback.position")}</dt>
                  <dd className="tabular text-right">
                    {pickedHead.position[1].toFixed(5)}, {pickedHead.position[0].toFixed(5)}
                  </dd>
                </dl>
              </div>
            )}
          </BaseMap>
          {data && data.t.length === 0 ? (
            <EmptyState title={t("playback.emptyTitle")}>{t("playback.emptyBody")}</EmptyState>
          ) : (
            <div className={cn(replay.isPending && "pointer-events-none opacity-50")}>
              <Scrubber
                start={data?.start ?? anchor - hours * 3600}
                span={span}
                time={time}
                onTime={(v) => {
                  setTime(v)
                }}
                playing={playing}
                onPlaying={setPlaying}
                speed={speed}
                onSpeed={setSpeed}
                histogram={histogram}
                gaps={data?.gaps ?? []}
                timeZone={tz}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}

