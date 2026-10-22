import type { FeatureCollection, Point } from "geojson"
import type { ExpressionSpecification, GeoJSONSource } from "maplibre-gl"
import { useEffect, useMemo, useRef, useState } from "react"
import { Layer, Source, useMap } from "react-map-gl/maplibre"
import { STATUS, routeColor, type ChartTheme } from "@/components/charts/palette"
import { ICONS } from "@/components/map/icons"
import { haversine } from "@/lib/geo"
import type { Vehicle } from "@/lib/realtime"

export const VEHICLE_LAYER = "vehicles"
export const VEHICLE_SOURCE = "vehicles"

const TWEEN_MS = 1000
/** A jump longer than this is a new position, not movement: it snaps instead of gliding. */
const MAX_TWEEN_M = 1500

export interface VehicleProps {
  id: string
  color: string
  icon: string
  bearing: number
  label: string
  stale: boolean
}

type Fc = FeatureCollection<Point, VehicleProps>
const EMPTY: Fc = { type: "FeatureCollection", features: [] }

export function vehicleFeatures(
  vehicles: readonly Vehicle[],
  routes: ReadonlyMap<string, { short_name: string; colour: string | null }>,
  theme: ChartTheme,
): Fc {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => {
      const route = v.route_id ? routes.get(v.route_id) : undefined
      const hasBearing = v.bearing !== null
      return {
        type: "Feature",
        id: v.id,
        geometry: { type: "Point", coordinates: [v.lon, v.lat] },
        properties: {
          id: v.id,
          color: v.stale ? STATUS.off : routeColor(route, theme),
          icon: v.stale
            ? hasBearing
              ? ICONS.arrowHollow
              : ICONS.dotHollow
            : hasBearing
              ? ICONS.arrow
              : ICONS.dot,
          bearing: v.bearing ?? 0,
          label: route?.short_name ?? "",
          stale: v.stale,
        },
      }
    }),
  }
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Vehicles as one GeoJSON source with a rotated SDF arrow per vehicle (plan 6.3). Each update
 * glides from the shown positions to the new ones over a second (snapped when reduced motion is
 * on), writing straight to the MapLibre source so React does not re-render per frame. Clusters
 * below zoom 10 keep whole-city views readable.
 */
export function VehicleLayer({
  data,
  selectedId,
  labels,
}: {
  data: Fc
  selectedId: string | undefined
  labels: boolean
}) {
  const { current: mapRef } = useMap()
  const shown = useRef(new Map<string, [number, number]>())
  // The last settled frame; React re-applies it when the style reloads (theme switch).
  const [settled, setSettled] = useState<Fc>(EMPTY)

  useEffect(() => {
    const map = mapRef?.getMap()
    const source = map?.getSource(VEHICLE_SOURCE) as GeoJSONSource | undefined
    if (!source) {
      setSettled(data)
      return
    }
    const from = new Map(shown.current)
    const snap = reducedMotion()
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const t = snap ? 1 : Math.min(1, (now - start) / TWEEN_MS)
      const ease = t * (2 - t)
      const next = new Map<string, [number, number]>()
      const features = data.features.map((f) => {
        const to = f.geometry.coordinates as [number, number]
        const a = from.get(f.properties.id)
        let at = to
        if (a && t < 1 && haversine(a, to) < MAX_TWEEN_M)
          at = [a[0] + (to[0] - a[0]) * ease, a[1] + (to[1] - a[1]) * ease]
        next.set(f.properties.id, at)
        return at === to ? f : { ...f, geometry: { type: "Point" as const, coordinates: at } }
      })
      shown.current = next
      source.setData({ type: "FeatureCollection", features })
      if (t < 1) raf = requestAnimationFrame(frame)
      else setSettled(data)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [data, mapRef])

  const selectedFilter = useMemo(
    (): ExpressionSpecification => ["==", ["get", "id"], selectedId ?? ""],
    [selectedId],
  )

  return (
    <Source
      id={VEHICLE_SOURCE}
      type="geojson"
      data={settled}
      cluster
      clusterMaxZoom={9}
      clusterRadius={40}
    >
      <Layer
        id="vehicle-clusters"
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": STATUS.info,
          "circle-opacity": 0.85,
          "circle-radius": ["step", ["get", "point_count"], 12, 20, 16, 100, 22],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }}
      />
      <Layer
        id="vehicle-selected"
        type="circle"
        filter={["all", ["!", ["has", "point_count"]], selectedFilter]}
        paint={{
          "circle-radius": 17,
          "circle-color": "rgba(251, 191, 36, 0.25)",
          "circle-stroke-color": "#d97706",
          "circle-stroke-width": 2,
        }}
      />
      <Layer
        id={VEHICLE_LAYER}
        type="symbol"
        filter={["!", ["has", "point_count"]]}
        layout={{
          "icon-image": ["get", "icon"],
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 9, 0.45, 14, 0.75, 17, 1],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "symbol-sort-key": ["case", ["get", "stale"], 0, 1],
        }}
        paint={{
          "icon-color": ["get", "color"],
          "icon-halo-color": "#ffffff",
          "icon-halo-width": 1.5,
          "icon-opacity": ["case", ["get", "stale"], 0.75, 1],
        }}
      />
      {labels && (
        <Layer
          id="vehicle-labels"
          type="symbol"
          minzoom={12}
          filter={["!", ["has", "point_count"]]}
          layout={{
            "text-field": ["get", "label"],
            "text-size": 11,
            "text-offset": [0, 1.4],
            "text-anchor": "top",
            "text-font": ["Noto Sans Bold"],
            "text-allow-overlap": false,
          }}
          paint={{
            "text-color": ["get", "color"],
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          }}
        />
      )}
    </Source>
  )
}
