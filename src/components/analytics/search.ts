import { z } from "zod"
import type { paths } from "@/api/schema.gen"
import { addDays, daySpan, localDate } from "@/lib/time"

/**
 * Shared analytics filters (plan 6.6), all in the URL. Dates are local to the network; routes
 * are the analytics' external codes (`42041`), which the backend also accepts.
 */

export const MAX_DAYS = 90
export const DAY_TYPES = ["all", "weekday", "saturday", "sunday"] as const
export type DayType = (typeof DAY_TYPES)[number]
export const PRESETS = ["today", "yesterday", "7d", "30d"] as const
export type Preset = (typeof PRESETS)[number]

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const hour = z.number().int().min(0).max(23)

export const analyticsSearchSchema = z.object({
  from: date.optional().catch(undefined),
  to: date.optional().catch(undefined),
  day: z.enum(DAY_TYPES).optional().catch(undefined),
  hf: hour.optional().catch(undefined),
  ht: hour.optional().catch(undefined),
  /** One route (external code). */
  route: z.string().optional(),
  dir: z.union([z.literal(0), z.literal(1)]).optional().catch(undefined),
  /** Show the result rows as a table instead of charts. */
  table: z.boolean().optional().catch(undefined),
  /** Show times in UTC instead of network time. */
  utc: z.boolean().optional().catch(undefined),
  /** Page-specific: dwell stop, speed hour and resolution, fleet granularity. */
  stop: z.string().optional(),
  hour: hour.optional().catch(undefined),
  res: z.number().int().min(5).max(10).optional().catch(undefined),
  gran: z.enum(["5m", "1h", "1d"]).optional().catch(undefined),
  /** Overlay the previous period of the same length. */
  cmp: z.boolean().optional().catch(undefined),
})
export type AnalyticsSearch = z.infer<typeof analyticsSearchSchema>

export interface Range {
  from: string
  to: string
}

/** The effective date range: the URL's, else the last 7 days ending today. */
export function rangeOf(search: Pick<AnalyticsSearch, "from" | "to">, now = Date.now()): Range {
  const today = localDate(now)
  const to = search.to ?? today
  const from = search.from ?? addDays(to, -6)
  return from <= to ? { from, to } : { from: to, to: from }
}

export function presetRange(preset: Preset, now = Date.now()): Range {
  const today = localDate(now)
  switch (preset) {
    case "today":
      return { from: today, to: today }
    case "yesterday": {
      const y = addDays(today, -1)
      return { from: y, to: y }
    }
    case "7d":
      return { from: addDays(today, -6), to: today }
    case "30d":
      return { from: addDays(today, -29), to: today }
  }
}

export function presetOf(range: Range, now = Date.now()): Preset | null {
  return PRESETS.find((p) => {
    const r = presetRange(p, now)
    return r.from === range.from && r.to === range.to
  }) ?? null
}

export function rangeError(range: Range): "tooLong" | null {
  return daySpan(range.from, range.to) > MAX_DAYS ? "tooLong" : null
}

/** A closed range (ending before today) never changes, so it is cached for good. */
export function isClosed(range: Range, now = Date.now()): boolean {
  return range.to < localDate(now)
}

export type MetricQuery = NonNullable<
  paths["/v1/dash/networks/{networkId}/analytics/{metric}"]["get"]["parameters"]["query"]
>

/** Shared filters as backend query params; pages add their own (route, stop, res...). */
export function baseParams(search: AnalyticsSearch, now = Date.now()): MetricQuery {
  const range = rangeOf(search, now)
  return {
    from: range.from,
    to: range.to,
    day_type: search.day && search.day !== "all" ? search.day : undefined,
    hour_from: search.hf,
    hour_to: search.ht,
  }
}

/** Drops undefined values so query keys stay stable and URLs clean. */
export function compact(q: MetricQuery): MetricQuery {
  return Object.fromEntries(
    Object.entries(q).filter(([, v]) => v !== undefined && v !== ""),
  ) as MetricQuery
}

/** The period of the same length right before `range` (compare-to). */
export function previousRange(range: Range): Range {
  const span = daySpan(range.from, range.to)
  return { from: addDays(range.from, -span), to: addDays(range.from, -1) }
}

/** fleet.hourly bucket size that keeps a chart around a few hundred points. */
export function autoGranularity(range: Range): "5m" | "1h" | "1d" {
  const span = daySpan(range.from, range.to)
  return span <= 2 ? "5m" : span <= 14 ? "1h" : "1d"
}
