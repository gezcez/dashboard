import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar } from "@/components/data-table/filters"
import { EmptyState } from "@/components/states/states"
import { Toggle } from "@/components/live/filter-panel"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/ui/status-dot"
import { apiQuery } from "@/lib/api"
import { formatClock, formatNumber } from "@/lib/format"
import { DEFAULT_NETWORK_TIMEZONE } from "@/lib/time"

type Poll = components["schemas"]["PollPageDto"]["items"][number]

export const pollsQuery = (networkId: number, bindingId: number, cursor?: string, limit = 200) =>
  apiQuery("/v1/dash/networks/{networkId}/bindings/{bindingId}/polls", {
    params: {
      path: { networkId: String(networkId), bindingId: String(bindingId) },
      query: { limit, ...(cursor ? { cursor } : {}) },
    },
  })

/** Outcomes that still delivered a usable snapshot. */
const USABLE = new Set(["ok", "empty", "duplicate_header"])
export const pollStatus = (outcome: string) =>
  outcome === "ok" ? "ok" : USABLE.has(outcome) ? "warn" : "error"

const droppedTotal = (p: Poll) =>
  p.dropped ? Object.values(p.dropped).reduce<number>((a, v) => a + (typeof v === "number" ? v : 0), 0) : 0

/**
 * Poll log (plan 6.5): newest first, 200 per page, rows virtualised. "Errors only" filters the
 * loaded page: the backend's polls endpoint has no outcome filter yet.
 */
export function PollLog({ networkId, bindingId }: { networkId: number; bindingId: number }) {
  const { t } = useTranslation("ops")
  const [cursor, setCursor] = useState<string | undefined>()
  const [errorsOnly, setErrorsOnly] = useState(false)
  const query = useQuery({
    ...pollsQuery(networkId, bindingId, cursor),
    placeholderData: keepPreviousData,
    refetchInterval: cursor ? false : 15_000,
  })
  const rows = useMemo(
    () => (errorsOnly ? query.data?.items.filter((p) => !USABLE.has(p.outcome)) : query.data?.items),
    [query.data, errorsOnly],
  )

  const columns = useMemo<ColumnDef<Poll>[]>(
    () => [
      {
        id: "time",
        header: t("tracker.polls.time"),
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap">
            {formatClock(row.original.started_at, DEFAULT_NETWORK_TIMEZONE, true)}
          </span>
        ),
      },
      {
        id: "outcome",
        header: t("tracker.polls.outcome"),
        cell: ({ row }) => (
          <StatusDot
            status={pollStatus(row.original.outcome)}
            label={row.original.outcome}
            showLabel
            className="text-xs"
          />
        ),
      },
      {
        id: "endpoint",
        header: t("tracker.polls.endpoint"),
        meta: { hideOnMobile: true },
        cell: ({ row }) =>
          row.original.url_variant ? (
            <Badge variant={row.original.url_variant === "fallback" ? "warn" : "outline"}>
              {t(`tracker.urlVariant.${row.original.url_variant}`)}
            </Badge>
          ) : (
            "–"
          ),
      },
      {
        id: "http",
        header: "HTTP",
        meta: { hideOnMobile: true },
        cell: ({ row }) => <span className="tabular">{row.original.http_status ?? "–"}</span>,
      },
      {
        id: "latency",
        header: t("tracker.polls.latency"),
        meta: { className: "text-right" },
        cell: ({ row }) => <span className="tabular">{formatNumber(row.original.duration_ms)} ms</span>,
      },
      {
        id: "entities",
        header: t("tracker.polls.entities"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => <span className="tabular">{formatNumber(row.original.entities)}</span>,
      },
      {
        id: "inserted",
        header: t("tracker.polls.inserted"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => <span className="tabular">{formatNumber(row.original.inserted)}</span>,
      },
      {
        id: "dropped",
        header: t("tracker.polls.dropped"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => <span className="tabular">{formatNumber(droppedTotal(row.original))}</span>,
      },
      {
        id: "error",
        header: t("tracker.polls.error"),
        meta: { className: "w-full max-w-0" },
        cell: ({ row }) => (
          <span className="block truncate text-xs text-status-error" title={row.original.error ?? undefined}>
            {row.original.error ?? ""}
          </span>
        ),
      },
    ],
    [t],
  )

  return (
    <div className="grid gap-3">
      <FilterBar>
        <Toggle checked={errorsOnly} onChange={setErrorsOnly}>
          {t("tracker.polls.errorsOnly")}
        </Toggle>
      </FilterBar>
      <DataTable
        caption={t("tracker.tabs.polls")}
        columns={columns}
        rows={rows}
        getRowId={(p) => String(p.id)}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        virtualize
        renderDetail={(p) => (
          <dl className="grid gap-x-6 gap-y-2 p-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("tracker.polls.feedAt")}</dt>
              <dd className="tabular">{p.feed_at ?? "–"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("tracker.polls.accepted")}</dt>
              <dd className="tabular">{formatNumber(p.accepted)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("tracker.polls.droppedBy")}</dt>
              <dd className="font-mono">
                {p.dropped
                  ? Object.entries(p.dropped)
                      .map(([k, v]) => `${k}=${String(v)}`)
                      .join(" ")
                  : "–"}
              </dd>
            </div>
            {p.error && (
              <div className="sm:col-span-3">
                <dt className="text-muted-foreground">{t("tracker.polls.error")}</dt>
                <dd className="font-mono break-all whitespace-pre-wrap">{p.error}</dd>
              </div>
            )}
          </dl>
        )}
        empty={
          <EmptyState title={errorsOnly ? t("tracker.polls.noErrors") : t("tracker.polls.empty")} />
        }
        footer={<CursorPager page={query.data} onCursor={setCursor} />}
      />
    </div>
  )
}
