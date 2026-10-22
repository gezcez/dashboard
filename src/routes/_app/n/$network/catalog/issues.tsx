import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import { tableSearchSchema } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { CatalogTabs } from "@/components/transit/catalog-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"

type Issue = components["schemas"]["IssueDto"]
type IssueStatus = components["schemas"]["IssueStatus"]

const STATUSES = ["open", "acknowledged", "resolved", "ignored"] as const
const SEVERITIES = ["critical", "warning", "info"] as const
const TYPES = [
  "route_not_in_catalog",
  "route_never_seen",
  "stop_without_coordinates",
  "duplicate_stops",
  "trip_without_timetable",
  "staff_route_leak",
] as const

const searchSchema = tableSearchSchema.extend({
  status: z.enum(STATUSES).optional().catch(undefined),
  severity: z.enum(SEVERITIES).optional().catch(undefined),
  type: z.enum(TYPES).optional().catch(undefined),
})
type Search = z.infer<typeof searchSchema>

const issuesQuery = (networkId: number, search: Search) =>
  apiQuery("/v1/dash/networks/{networkId}/issues", {
    params: { path: { networkId: String(networkId) }, query: { limit: 50, ...search } },
  })

export const Route = createFileRoute("/_app/n/$network/catalog/issues")({
  staticData: { pageId: "network.catalog" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(issuesQuery(context.network.id, deps)).catch(() => undefined),
  component: IssuesPage,
})

const SEVERITY_VARIANT = { critical: "error", warning: "warn", info: "default" } as const
const STATUS_VARIANT = {
  open: "brand",
  acknowledged: "default",
  resolved: "ok",
  ignored: "outline",
} as const

function IssuesPage() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const canWrite = useCan("catalog.write", { network: network.id }) === true
  const query = useQuery({ ...issuesQuery(network.id, search), placeholderData: keepPreviousData })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ignoring, setIgnoring] = useState(false)
  const setSearch = (patch: Partial<Search>) => {
    setSelected(new Set())
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })
  }

  const update = useMutation({
    mutationFn: (v: { ids: string[]; status: IssueStatus; reason?: string; previous?: Map<string, IssueStatus> }) =>
      callApi("patch", "/v1/dash/networks/{networkId}/issues", {
        params: { path: { networkId: String(network.id) } },
        body: { ids: v.ids, status: v.status, ...(v.reason ? { reason: v.reason } : {}) },
      }),
    onSuccess: (r, v) => {
      setSelected(new Set())
      setIgnoring(false)
      const previous = v.previous
      // L1 changes (acknowledge, resolve, reopen) get a 6 s undo; ignore needed a reason.
      toast.success(t("catalog.issues.updated", { count: r.updated, status: t(`catalog.issues.status.${v.status}`) }), {
        duration: 6000,
        action:
          previous && v.status !== "ignored"
            ? {
                label: t("catalog.issues.undo"),
                onClick: () => {
                  const groups = new Map<IssueStatus, string[]>()
                  for (const [id, s] of previous) groups.set(s, [...(groups.get(s) ?? []), id])
                  for (const [status, ids] of groups) update.mutate({ ids, status })
                },
              }
            : undefined,
      })
    },
    onError: (e) => toast.error(isApiError(e) ? apiErrorMessage(e) : t("catalog.issues.failed")),
    onSettled: () => invalidateApi(queryClient, "/v1/dash/networks/{networkId}/issues"),
  })

  const items = query.data?.items
  const apply = (status: IssueStatus, reason?: string) => {
    const previous = new Map<string, IssueStatus>()
    for (const i of items ?? []) if (selected.has(i.id)) previous.set(i.id, i.status)
    update.mutate({ ids: [...selected], status, reason, previous })
  }

  const allOnPage = (items ?? []).map((i) => i.id)
  const allChecked = allOnPage.length > 0 && allOnPage.every((id) => selected.has(id))
  const columns = useMemo<ColumnDef<Issue>[]>(
    () => [
      ...(canWrite
        ? [
            {
              id: "select",
              header: () => (
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  aria-label={t("catalog.issues.selectAll")}
                  checked={allChecked}
                  onChange={(e) => {
                    setSelected(e.target.checked ? new Set(allOnPage) : new Set())
                  }}
                />
              ),
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  aria-label={t("catalog.issues.select", { label: row.original.entity.label ?? row.original.entity.id })}
                  checked={selected.has(row.original.id)}
                  onChange={(e) => {
                    const next = new Set(selected)
                    if (e.target.checked) next.add(row.original.id)
                    else next.delete(row.original.id)
                    setSelected(next)
                  }}
                />
              ),
            } satisfies ColumnDef<Issue>,
          ]
        : []),
      {
        id: "severity",
        header: t("catalog.issues.severity"),
        meta: { sortKey: "severity" },
        cell: ({ row }) => (
          <Badge variant={SEVERITY_VARIANT[row.original.severity]}>
            {t(`catalog.issues.severities.${row.original.severity}`)}
          </Badge>
        ),
      },
      {
        id: "type",
        header: t("catalog.issues.type"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{t(`catalog.issues.types.${row.original.type}`)}</p>
            {row.original.details && (
              <p className="truncate text-xs text-muted-foreground">{row.original.details}</p>
            )}
          </div>
        ),
      },
      {
        id: "entity",
        header: t("catalog.issues.entity"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
            <span className="text-muted-foreground">{t(`catalog.issues.entities.${row.original.entity.type}`)}</span>
            <span className="font-medium">{row.original.entity.label ?? row.original.entity.id}</span>
          </span>
        ),
      },
      {
        id: "status",
        header: t("catalog.issues.statusLabel"),
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]} title={row.original.reason ?? undefined}>
            {t(`catalog.issues.status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        id: "last_detected_at",
        header: t("catalog.issues.lastDetected"),
        meta: { sortKey: "last_detected_at", firstDir: "desc", hideOnMobile: true },
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.last_detected_at)} className="whitespace-nowrap">
            {formatRelative(row.original.last_detected_at)}
            <span className="ml-1 text-xs text-muted-foreground">×{formatNumber(row.original.occurrences)}</span>
          </span>
        ),
      },
      {
        id: "first_detected_at",
        header: t("catalog.issues.firstDetected"),
        meta: { sortKey: "first_detected_at", firstDir: "desc", hideOnMobile: true },
        cell: ({ row }) => formatDateTime(row.original.first_detected_at, { dateStyle: "medium" }),
      },
    ],
    [t, canWrite, selected, allChecked, allOnPage],
  )

  const counts = query.data?.counts as Record<string, number> | undefined
  const filtered = Boolean(search.q || search.status || search.severity || search.type)

  return (
    <>
      <PageHeader eyebrow={network.cityName} title={t("catalog.title")} intro={t("catalog.issues.intro")} />
      <CatalogTabs active="issues" />
      {counts && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSearch({ severity: search.severity === s ? undefined : s, status: "open" })
              }}
              className="rounded-full focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Badge variant={SEVERITY_VARIANT[s]}>
                {t("catalog.issues.openCount", { count: counts[s] ?? 0, severity: t(`catalog.issues.severities.${s}`) })}
              </Badge>
            </button>
          ))}
        </div>
      )}
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("catalog.issues.search")}
        />
        <SelectFilter
          label={t("catalog.issues.statusLabel")}
          value={search.status}
          options={STATUSES.map((s) => ({ value: s, label: t(`catalog.issues.status.${s}`) }))}
          onChange={(status) => {
            setSearch({ status })
          }}
        />
        <SelectFilter
          label={t("catalog.issues.severity")}
          value={search.severity}
          options={SEVERITIES.map((s) => ({ value: s, label: t(`catalog.issues.severities.${s}`) }))}
          onChange={(severity) => {
            setSearch({ severity })
          }}
        />
        <SelectFilter
          label={t("catalog.issues.type")}
          value={search.type}
          options={TYPES.map((s) => ({ value: s, label: t(`catalog.issues.types.${s}`) }))}
          onChange={(type) => {
            setSearch({ type })
          }}
        />
      </FilterBar>
      {canWrite && selected.size > 0 && (
        <div
          role="region"
          aria-label={t("catalog.issues.bulk")}
          className="sticky top-16 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-4 py-2"
        >
          <span className="text-sm font-medium">{t("catalog.issues.selected", { count: selected.size })}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => { apply("acknowledged") }}>
              {t("catalog.issues.actions.acknowledge")}
            </Button>
            <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => { apply("resolved") }}>
              {t("catalog.issues.actions.resolve")}
            </Button>
            <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => { apply("open") }}>
              {t("catalog.issues.actions.reopen")}
            </Button>
            <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => { setIgnoring(true) }}>
              {t("catalog.issues.actions.ignore")}
            </Button>
          </div>
        </div>
      )}
      <DataTable
        caption={t("catalog.tabs.issues")}
        columns={columns}
        rows={items}
        getRowId={(i) => i.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={search.sort}
        onSortChange={(sort) => {
          setSearch({ sort })
        }}
        empty={
          <EmptyState title={filtered ? t("catalog.issues.noMatch") : t("catalog.issues.empty")}>
            {filtered ? null : t("catalog.issues.emptyBody")}
          </EmptyState>
        }
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) => {
              setSelected(new Set())
              void navigate({ search: (prev) => ({ ...prev, cursor }) })
            }}
          />
        }
      />
      <IgnoreDialog
        open={ignoring}
        count={selected.size}
        pending={update.isPending}
        onOpenChange={setIgnoring}
        onConfirm={(reason) => {
          apply("ignored", reason)
        }}
      />
    </>
  )
}

function IgnoreDialog({
  open,
  count,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  count: number
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}) {
  const { t } = useTranslation("ops")
  const [reason, setReason] = useState("")
  const valid = reason.trim().length >= 3
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!pending) onOpenChange(o) }}>
      <DialogContent closeLabel={t("close", { ns: "common" })}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) onConfirm(reason.trim())
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("catalog.issues.ignoreTitle", { count })}</DialogTitle>
            <DialogDescription>{t("catalog.issues.ignoreBody")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="ignore-reason">{t("catalog.issues.reason")}</Label>
            <Textarea
              id="ignore-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
              }}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false) }} disabled={pending}>
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={!valid || pending}>
              {pending ? t("catalog.issues.saving") : t("catalog.issues.actions.ignore")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
