import "maplibre-gl/dist/maplibre-gl.css"
import { useQuery } from "@tanstack/react-query"
import type { MapLibreEvent, MapStyleImageMissingEvent } from "maplibre-gl"
import { forwardRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import MapGL, {
  AttributionControl,
  NavigationControl,
  type MapProps,
  type MapRef,
} from "react-map-gl/maplibre"
import { env } from "@/env"
import { useResolvedTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { addMissingImage } from "./icons"
import { fallbackStyle, loadStyle, type MapTheme } from "./styles"

const STYLE_URLS: Record<MapTheme, string> = {
  light: env.VITE_MAP_STYLE_LIGHT,
  dark: env.VITE_MAP_STYLE_DARK,
}

/** The basemap style for the current theme, or the offline fallback when tiles are unreachable. */
export function useMapStyle() {
  const theme = useResolvedTheme()
  const query = useQuery({
    queryKey: ["map-style", theme, STYLE_URLS[theme]],
    queryFn: () => loadStyle(STYLE_URLS, theme),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
  return {
    theme,
    style: query.data ?? (query.isError ? fallbackStyle(theme) : undefined),
    offline: query.isError,
  }
}

export type BaseMapProps = Omit<MapProps, "mapStyle" | "children"> & {
  children?: ReactNode
  className?: string
  /** Initial extent as [west, south, east, north]. */
  bounds?: [number, number, number, number]
  /** Hides the zoom buttons (preview maps). */
  controls?: boolean
  /** Rendered over the map, top left (legends, toggles). */
  overlay?: ReactNode
}

/**
 * MapLibre basemap shared by every map page (plan 8.5): the theme's style from env, required
 * attribution, the vehicle and stop sprites generated on demand, and a visible notice when the
 * tile host cannot be reached so data layers still show on a plain ground.
 */
export const BaseMap = forwardRef<MapRef, BaseMapProps>(function BaseMap(
  { children, className, bounds, controls = true, overlay, initialViewState, onLoad, ...props },
  ref,
) {
  const { t } = useTranslation("ops")
  const { style, offline } = useMapStyle()

  const handleLoad = (e: MapLibreEvent) => {
    e.target.on("styleimagemissing", (ev: MapStyleImageMissingEvent) => {
      addMissingImage(e.target, ev.id)
    })
    onLoad?.(e)
  }

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border bg-muted [&_.maplibregl-ctrl-attrib]:text-[10px]",
        className,
      )}
    >
      {style ? (
        <MapGL
          ref={ref}
          mapStyle={style}
          attributionControl={false}
          initialViewState={
            initialViewState ?? (bounds ? { bounds, fitBoundsOptions: { padding: 32 } } : undefined)
          }
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
          onLoad={handleLoad}
          style={{ position: "absolute", inset: 0 }}
          {...props}
        >
          <AttributionControl compact position="bottom-right" />
          {controls && <NavigationControl position="top-right" showCompass={false} />}
          {children}
        </MapGL>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      )}
      {overlay && <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">{overlay}</div>}
      {offline && (
        <p className="absolute bottom-2 left-2 z-10 rounded-full bg-card/90 px-2.5 py-1 text-xs text-muted-foreground">
          {t("map.offline")}
        </p>
      )}
    </div>
  )
})
