import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { components } from "@/api/schema.gen"
import { apiQuery } from "@/lib/api"
import { compact, isClosed, type MetricQuery } from "./search"

export type MetricKey = components["schemas"]["MetricCatalogDto"]["metrics"][number]["key"]
export type MetricResult = components["schemas"]["MetricResultDto"]
export type Cell = MetricResult["rows"][number][number]
export type Row = Record<string, Cell>

/** Ranges that include today refresh every 5 minutes; closed ranges never go stale (plan 6.6). */
const OPEN_RANGE_REFRESH_MS = 5 * 60_000

export const metricQuery = (networkId: number, metric: MetricKey, query: MetricQuery) => {
  const closed = Boolean(query.to) && isClosed({ from: query.from ?? "", to: query.to ?? "" })
  return {
    ...apiQuery("/v1/dash/networks/{networkId}/analytics/{metric}", {
      params: { path: { networkId: String(networkId), metric }, query: compact(query) },
    }),
    staleTime: closed ? Infinity : OPEN_RANGE_REFRESH_MS,
    refetchInterval: closed ? (false as const) : OPEN_RANGE_REFRESH_MS,
  }
}

/** Columnar rows to objects keyed by column name. */
export function toObjects(result: Pick<MetricResult, "columns" | "rows"> | undefined): Row[] {
  if (!result) return []
  return result.rows.map((r) => {
    const o: Row = {}
    result.columns.forEach((c, i) => {
      o[c] = r[i] ?? null
    })
    return o
  })
}

export function useMetric(
  networkId: number,
  metric: MetricKey,
  query: MetricQuery,
  options: { enabled?: boolean } = {},
) {
  const q = useQuery({
    ...metricQuery(networkId, metric, query),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  })
  const rows = useMemo(() => toObjects(q.data), [q.data])
  return { ...q, rows }
}

export const num = (v: Cell | undefined): number | null => (typeof v === "number" ? v : null)
export const str = (v: Cell | undefined): string => (v === null || v === undefined ? "" : String(v))

/** Median of numbers (ignores nulls); null for an empty list. */
export function median(values: (number | null)[]): number | null {
  const xs = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  if (xs.length === 0) return null
  const mid = xs.length >> 1
  return xs.length % 2 ? (xs[mid] ?? null) : ((xs[mid - 1] ?? 0) + (xs[mid] ?? 0)) / 2
}

/** Weighted mean, for shares averaged over groups of different sizes. */
export function weightedMean(pairs: [number | null, number | null][]): number | null {
  let sum = 0
  let weight = 0
  for (const [v, w] of pairs) {
    if (v === null || w === null) continue
    sum += v * w
    weight += w
  }
  return weight > 0 ? sum / weight : null
}
