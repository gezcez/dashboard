import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox"
import { useControl } from "react-map-gl/maplibre"

/**
 * deck.gl layers interleaved with the MapLibre layers (plan 8.5), so labels of the basemap stay
 * on top. Only the playback and speed pages import this, keeping deck.gl in their chunks.
 */
export function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay({ ...props, interleaved: true }))
  overlay.setProps(props)
  return null
}
