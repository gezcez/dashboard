import { i18n } from "@/i18n"

const locale = () => (i18n.language === "tr" ? "tr-TR" : "en-GB")

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined) return "–"
  return new Intl.NumberFormat(locale(), options).format(value)
}

export function formatDateTime(
  iso: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "–"
  return new Intl.DateTimeFormat(
    locale(),
    options ?? { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(iso))
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
]

export function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "–"
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" })
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diffSec) >= sec || unit === "second")
      return rtf.format(Math.round(diffSec / sec), unit)
  }
  return rtf.format(0, "second")
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "–"
  if (seconds < 60) return `${formatNumber(seconds)} s`
  if (seconds < 3600) return `${formatNumber(Math.round(seconds / 60))} min`
  if (seconds < 86_400) return `${formatNumber(Math.round(seconds / 360) / 10)} h`
  return `${formatNumber(Math.round(seconds / 8640) / 10)} d`
}
