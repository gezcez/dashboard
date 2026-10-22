import type { FeatureCollection, LineString, Point } from "geojson"
import { useMemo } from "react"
import { Layer, Source } from "react-map-gl/maplibre"
import type { LngLat } from "@/lib/geo"

export interface ShapeLine {
  id: string
  color: string
  coords: LngLat[]
  /** Dashed for the return direction so both read on a shared street. */
  dashed?: boolean
}

/** Route shapes as casing plus coloured line, under the vehicles. */
export function RouteShapeLayer({ id = "shapes", lines }: { id?: string; lines: ShapeLine[] }) {
  const data = useMemo<FeatureCollection<LineString, { color: string; dashed: boolean }>>(
    () => ({
      type: "FeatureCollection",
      features: lines.map((l) => ({
        type: "Feature",
        id: l.id,
        geometry: { type: "LineString", coordinates: l.coords },
        properties: { color: l.color, dashed: Boolean(l.dashed) },
      })),
    }),
    [lines],
  )
  return (
    <Source id={id} type="geojson" data={data}>
      <Layer
        id={`${id}-casing`}
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{ "line-color": "#ffffff", "line-opacity": 0.7, "line-width": 6 }}
      />
      <Layer
        id={`${id}-line`}
        type="line"
        filter={["!", ["get", "dashed"]]}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{ "line-color": ["get", "color"], "line-width": 3.5 }}
      />
      <Layer
        id={`${id}-dashed`}
        type="line"
        filter={["get", "dashed"]}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{ "line-color": ["get", "color"], "line-width": 3, "line-dasharray": [1.5, 1.5] }}
      />
    </Source>
  )
}

export interface StopPoint {
  id: string
  name: string
  lon: number
  lat: number
  /** Optional emphasis, 0 to 1 (dwell map, selected stop). */
  weight?: number
}

export const STOPS_LAYER = "stops-circle"

/** Stops as small rings; `weight` scales them (dwell map). */
export function StopsLayer({
  id = "stops",
  stops,
  color = "#172554",
  selectedId,
}: {
  id?: string
  stops: StopPoint[]
  color?: string
  selectedId?: string
}) {
  const data = useMemo<FeatureCollection<Point, { id: string; name: string; weight: number }>>(
    () => ({
      type: "FeatureCollection",
      features: stops.map((s) => ({
        type: "Feature",
        id: s.id,
        geometry: { type: "Point", coordinates: [s.lon, s.lat] },
        properties: { id: s.id, name: s.name, weight: s.weight ?? 0 },
      })),
    }),
    [stops],
  )
  return (
    <Source id={id} type="geojson" data={data}>
      <Layer
        id={id === "stops" ? STOPS_LAYER : `${id}-circle`}
        type="circle"
        paint={{
          "circle-radius": ["+", 3.5, ["*", 12, ["get", "weight"]]],
          "circle-color": "#ffffff",
          "circle-stroke-color": [
            "case",
            ["==", ["get", "id"], selectedId ?? ""],
            "#d97706",
            color,
          ],
          "circle-stroke-width": ["case", ["==", ["get", "id"], selectedId ?? ""], 3, 1.5],
          "circle-opacity": 0.9,
        }}
      />
    </Source>
  )
}

/** A vehicle's recent path, fading from old to new. */
export function TrailLayer({ coords, color }: { coords: LngLat[]; color: string }) {
  const data = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: "FeatureCollection",
      features:
        coords.length > 1
          ? [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: coords },
                properties: {},
              },
            ]
          : [],
    }),
    [coords],
  )
  return (
    <Source id="trail" type="geojson" data={data} lineMetrics>
      <Layer
        id="trail-line"
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-width": 4,
          "line-gradient": [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            "rgba(148, 163, 184, 0.1)",
            1,
            color,
          ],
        }}
      />
    </Source>
  )
}
