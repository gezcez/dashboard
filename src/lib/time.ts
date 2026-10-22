/**
 * Network time. Every gezcez network is in Turkey today and neither `me` nor the network
 * context carries a timezone yet, so pages use this default; analytics responses carry the
 * authoritative `meta.timezone` and override it.
 */
export const DEFAULT_NETWORK_TIMEZONE = "Europe/Istanbul"

/** YYYY-MM-DD of an instant in a timezone. */
export function localDate(ms: number, timeZone: string = DEFAULT_NETWORK_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms))
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Inclusive day count between two YYYY-MM-DD dates. */
export function daySpan(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000) + 1
}

/** Offset of a timezone from UTC at an instant, in ms (positive east of Greenwich). */
export function tzOffsetMs(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  )
  return asUtc - Math.floor(ms / 1000) * 1000
}

/** A local wall-clock ISO string (`2026-10-22T14:00`) in a timezone to epoch ms. */
export function localIsoToMs(iso: string, timeZone: string = DEFAULT_NETWORK_TIMEZONE): number {
  const naive = Date.parse(`${iso.length === 10 ? `${iso}T00:00` : iso}Z`)
  return naive - tzOffsetMs(naive, timeZone)
}
