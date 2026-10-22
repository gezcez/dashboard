import type { StyleSpecification } from "maplibre-gl"

/**
 * Basemap styles (plan 8.5). The URLs come from VITE_MAP_STYLE_LIGHT/DARK, so moving from
 * OpenFreeMap to tiles.gezcez.com is a config change. OpenFreeMap has no dark positron, so when
 * both variables name the same style the dark one is derived here by recolouring every paint
 * colour into the navy family of tokens.css.
 */

export type MapTheme = "light" | "dark"

/** Background of the offline fallback, matching tokens.css --background per theme. */
export const FALLBACK_BACKGROUND: Record<MapTheme, string> = {
  light: "#f1efe8",
  dark: "#0a0f1f",
}

/** A blank style used when the tile host cannot be reached; data layers still render on it. */
export function fallbackStyle(theme: MapTheme): StyleSpecification {
  return {
    version: 8,
    name: `gezcez-offline-${theme}`,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": FALLBACK_BACKGROUND[theme] },
      },
    ],
  }
}

interface Hsl {
  h: number
  s: number
  l: number
  a: number
}

const HEX = /^#([0-9a-f]{3,8})$/i
const FUNC = /^(rgba?|hsla?)\(([^)]+)\)$/i

/** Parses the CSS colour forms MapLibre styles use (hex, rgb[a], hsl[a]). */
export function parseColor(input: string): Hsl | null {
  const s = input.trim()
  let r: number, g: number, b: number
  let a = 1
  const hex = HEX.exec(s)
  if (hex) {
    let h = hex[1] ?? ""
    if (h.length === 3 || h.length === 4)
      h = h
        .split("")
        .map((c) => c + c)
        .join("")
    if (h.length !== 6 && h.length !== 8) return null
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255
    return rgbToHsl(r, g, b, a)
  }
  const fn = FUNC.exec(s)
  if (!fn) return null
  const kind = (fn[1] ?? "").toLowerCase()
  const parts = (fn[2] ?? "").split(/[\s,/]+/).filter(Boolean)
  const num = (v: string | undefined, scale: number) =>
    v === undefined ? NaN : v.endsWith("%") ? (parseFloat(v) / 100) * scale : parseFloat(v)
  if (parts[3] !== undefined) a = num(parts[3], 1)
  if (kind.startsWith("rgb")) {
    r = num(parts[0], 255)
    g = num(parts[1], 255)
    b = num(parts[2], 255)
    if ([r, g, b, a].some(Number.isNaN)) return null
    return rgbToHsl(r, g, b, a)
  }
  const h = parseFloat(parts[0] ?? "")
  const sat = num(parts[1], 1)
  const l = num(parts[2], 1)
  if ([h, sat, l, a].some(Number.isNaN)) return null
  return { h: ((h % 360) + 360) % 360, s: sat, l, a }
}

function rgbToHsl(r: number, g: number, b: number, a: number): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l, a }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: h * 60, s, l, a }
}

function hslString({ h, s, l, a }: Hsl): string {
  const pct = (v: number) => `${String(Math.round(Math.min(1, Math.max(0, v)) * 1000) / 10)}%`
  const base = `${String(Math.round(h))}, ${pct(s)}, ${pct(l)}`
  return a < 1 ? `hsla(${base}, ${String(Math.round(a * 100) / 100)})` : `hsl(${base})`
}

type Role = "fill" | "line" | "text" | "halo"

/** Navy hue of tokens.css; dark surfaces lean towards it, as in the dashboard's dark mode. */
const NAVY_HUE = 225

/**
 * Maps a light-style colour to the dark theme. Fills invert (paper becomes navy), lines stay a
 * little lighter than the ground so roads read, text inverts and halos sink into the ground.
 */
export function darkColor(input: string, role: Role): string {
  const c = parseColor(input)
  if (!c) return input
  const tint = (h: number, s: number) => ({
    h: s < 0.08 ? NAVY_HUE : h,
    s: Math.min(0.5, s * 0.5 + 0.18),
  })
  switch (role) {
    case "fill": {
      const { h, s } = tint(c.h, c.s)
      return hslString({ h, s, l: 0.07 + (1 - c.l) * 0.36, a: c.a })
    }
    case "line": {
      const { h, s } = tint(c.h, c.s)
      return hslString({ h, s, l: 0.13 + c.l * 0.15, a: c.a })
    }
    case "text":
      return hslString({ h: c.h, s: Math.min(c.s, 0.3), l: 0.95 - c.l * 0.5, a: c.a })
    case "halo":
      return hslString({ h: NAVY_HUE, s: 0.5, l: 0.06 + (1 - c.l) * 0.1, a: c.a })
  }
}

const PAINT_ROLES: Record<string, Role> = {
  "background-color": "fill",
  "fill-color": "fill",
  "fill-outline-color": "line",
  "fill-extrusion-color": "fill",
  "line-color": "line",
  "text-color": "text",
  "text-halo-color": "halo",
  "icon-color": "text",
  "icon-halo-color": "halo",
  "circle-color": "line",
  "circle-stroke-color": "halo",
}

/** Walks a paint value (plain colour, legacy stops or an expression) recolouring strings. */
function recolourValue(value: unknown, role: Role): unknown {
  if (typeof value === "string") return parseColor(value) ? darkColor(value, role) : value
  if (Array.isArray(value)) return value.map((v) => recolourValue(v, role))
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = recolourValue(v, role)
    return out
  }
  return value
}

/** Returns a copy of a light style with every paint colour mapped to the dark palette. */
export function darkenStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    name: `${style.name ?? "style"} (gezcez dark)`,
    layers: style.layers.map((layer) => {
      if (!("paint" in layer) || !layer.paint) return layer
      const paint: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(layer.paint as Record<string, unknown>)) {
        const role = PAINT_ROLES[key]
        paint[key] = role ? recolourValue(value, role) : value
      }
      return { ...layer, paint } as typeof layer
    }),
  }
}

/** Fetches the style JSON for a theme, deriving dark from light when both URLs are the same. */
export async function loadStyle(
  urls: Record<MapTheme, string>,
  theme: MapTheme,
  fetchImpl: typeof fetch = fetch,
): Promise<StyleSpecification> {
  const url = urls[theme]
  const res = await fetchImpl(url, { credentials: "omit" })
  if (!res.ok) throw new Error(`style ${url}: HTTP ${String(res.status)}`)
  const style = (await res.json()) as StyleSpecification
  return theme === "dark" && urls.dark === urls.light ? darkenStyle(style) : style
}
