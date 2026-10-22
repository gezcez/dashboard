/**
 * Data colours for charts and maps (plan 8.4). Values mirror src/styles/tokens.css (a unit test
 * checks the surface colours); the categorical sets keep 3:1 contrast against the card colour of
 * their theme. Amber is the brand accent, so it is a categorical colour but never "warning".
 */

export type ChartTheme = "light" | "dark"

export const SURFACES = {
  light: {
    background: "#fcfbf7",
    card: "#ffffff",
    foreground: "#172554",
    muted: "rgb(23 37 84 / 0.65)",
    border: "rgb(23 37 84 / 0.1)",
    grid: "rgb(23 37 84 / 0.07)",
  },
  dark: {
    background: "#0a0f1f",
    card: "#111a33",
    foreground: "#fffbeb",
    muted: "rgb(255 251 235 / 0.65)",
    border: "rgb(255 255 255 / 0.1)",
    grid: "rgb(255 255 255 / 0.07)",
  },
} as const

export const CATEGORICAL: Record<ChartTheme, readonly string[]> = {
  light: ["#1d4ed8", "#d97706", "#0f766e", "#7c3aed", "#be185d", "#0369a1", "#4d7c0f", "#475569"],
  dark: ["#60a5fa", "#fbbf24", "#2dd4bf", "#a78bfa", "#f472b6", "#38bdf8", "#a3e635", "#cbd5e1"],
}

/** Low to high. Light: pale amber to deep brown; dark: dim to bright so highs stand out. */
export const SEQUENTIAL: Record<ChartTheme, readonly string[]> = {
  light: ["#fef3c7", "#fde68a", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#78350f"],
  dark: ["#1e2a4a", "#3b3a3a", "#78350f", "#b45309", "#d97706", "#f59e0b", "#fde68a"],
}

/** Early (blue), on time (neutral), late (orange to red), for delays. */
export const DIVERGING: Record<ChartTheme, readonly string[]> = {
  light: ["#1d4ed8", "#93c5fd", "#f1f5f9", "#fdba74", "#ea580c", "#b91c1c"],
  dark: ["#3b82f6", "#1e3a8a", "#1f2937", "#9a3412", "#ea580c", "#f87171"],
}

/** Speed ramp for maps: slow is red (congestion), fast is teal. */
export const SPEED_RAMP: readonly [number, string][] = [
  [0, "#b91c1c"],
  [10, "#ea580c"],
  [18, "#f59e0b"],
  [26, "#facc15"],
  [36, "#84cc16"],
  [50, "#0d9488"],
]

export const STATUS = {
  ok: "#16a34a",
  warn: "#ea580c",
  error: "#dc2626",
  off: "#94a3b8",
  info: "#2563eb",
} as const

/** Stable colour for an id (route code, binding) when the feed gives none. */
export function hashedColor(key: string, theme: ChartTheme = "light"): string {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  const set = CATEGORICAL[theme]
  return set[Math.abs(h) % set.length] ?? "#475569"
}

/** A route's colour from the catalogue (`RRGGBB` without #), or a hashed fallback. */
export function routeColor(
  route: { colour?: string | null; short_name?: string; id?: string } | undefined,
  theme: ChartTheme = "light",
): string {
  const c = route?.colour?.replace(/^#/, "")
  if (c && /^[0-9a-f]{6}$/i.test(c)) return `#${c}`
  return hashedColor(route?.short_name ?? route?.id ?? "?", theme)
}

/** Piecewise-linear colour from a ramp of [value, hex] stops. */
export function rampColor(ramp: readonly [number, string][], value: number): [number, number, number] {
  const rgb = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const first = ramp[0]
  const last = ramp[ramp.length - 1]
  if (!first || !last) return [128, 128, 128]
  if (value <= first[0]) return rgb(first[1])
  if (value >= last[0]) return rgb(last[1])
  for (let i = 1; i < ramp.length; i++) {
    const a = ramp[i - 1]
    const b = ramp[i]
    if (!a || !b || value > b[0]) continue
    const t = (value - a[0]) / (b[0] - a[0])
    const ca = rgb(a[1])
    const cb = rgb(b[1])
    return [0, 1, 2].map((k) => Math.round((ca[k] ?? 0) + ((cb[k] ?? 0) - (ca[k] ?? 0)) * t)) as [
      number,
      number,
      number,
    ]
  }
  return rgb(last[1])
}
