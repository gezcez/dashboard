import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DEFAULT_NETWORK_TIMEZONE } from "@/lib/time"

/**
 * Time formatting for analytics charts: network time by default, UTC when the view asks for it
 * (plan 6.6). ECharts would otherwise format in the viewer's own timezone.
 */
export function useTimeFormat(utc?: boolean) {
  const { i18n } = useTranslation()
  const locale = i18n.language === "tr" ? "tr-TR" : "en-GB"
  const timeZone = utc ? "UTC" : DEFAULT_NETWORK_TIMEZONE
  return useMemo(() => {
    const clock = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    })
    const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone })
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
    return {
      timeZone,
      /** Axis label: the date at midnight, the clock otherwise. */
      axis: (value: number) => {
        const c = clock.format(value)
        return c === "00:00" ? day.format(value) : c
      },
      clock: (value: number) => clock.format(value),
      dateTime: (value: number) => `${day.format(value)} ${clock.format(value)}`,
      /** Monday-first weekday names. */
      weekdays: Array.from({ length: 7 }, (_, d) => weekday.format(Date.UTC(2024, 0, 1 + d))),
    }
  }, [locale, timeZone])
}
