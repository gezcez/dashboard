import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { DownloadIcon, XIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { tableSearchSchema } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { UserChip } from "@/components/entity/user-chip"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiQuery } from "@/lib/api"
import { downloadText, toCsv } from "@/lib/csv"
import { diffObjects, formatValue } from "@/lib/diff"
import { formatDateTime, formatRelative } from "@/lib/format"
import { useMe } from "@/lib/me"
import { assertPage } from "@/lib/pages"
import { cn } from "@/lib/utils"

type Entry = components["schemas"]["AuditEntry"]

const ACTION_GROUPS = ["user.", "role.", "tracker.", "app.", "settings.", "auth."] as const
const TARGET_TYPES = ["user", "role", "binding", "app", "settings", "session"] as const

const searchSchema = tableSearchSchema.extend({
  action: z.string().optional(),
  target_type: z.string().optional(),
  target_id: z.string().optional(),
})
type Search = z.infer<typeof searchSchema>

const auditQuery = (search: Search) =>
  apiQuery("/v1/dash/audit", { params: { query: { limit: 50, ...search } } })

const SEVERITY = { info: "default", warn: "warn", critical: "error" } as const

export const Route = createFileRoute("/_app/admin/audit")({
  staticData: { pageId: "admin.audit" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("admin.audit", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(auditQuery(deps)).catch(() => undefined),
  component: AuditPage,
})

function AuditPage() {
  const { t } = useTranslation("dashboard")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery({ ...auditQuery(search), placeholderData: keepPreviousData })
  const { data: me } = useMe()
  const networkName = (id: number | null) =>
    id === null ? null : (me?.networks.find((n) => n.id === id)?.name ?? `#${String(id)}`)

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })
  const filtered = Boolean(search.q || search.action || search.target_type || search.target_id)

  const columns = useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        id: "at",
        header: t("audit.columns.when"),
        meta: { sortKey: "at", firstDir: "desc" },
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.at)} className="text-muted-foreground">
            {formatRelative(row.original.at)}
          </span>
        ),
      },
      {
        id: "action",
        header: t("audit.columns.action"),
        cell: ({ row }) => (
          <Badge variant={SEVERITY[row.original.severity]} className="font-mono">
            {row.original.action}
          </Badge>
        ),
      },
      {
        id: "actor",
        header: t("audit.columns.actor"),
        meta: { hideOnMobile: true },
        cell: ({ row }) =>
          row.original.actor ? (
            <UserChip user={row.original.actor} link />
          ) : (
            <span className="text-muted-foreground">{t("audit.system")}</span>
          ),
      },
      {
        id: "target",
        header: t("audit.columns.target"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => {
          const e = row.original
          if (!e.target_label) return <span className="text-muted-foreground">–</span>
          return (
            <span className="flex min-w-0 items-center gap-2">
              {e.target_type && (
                <span className="text-xs text-muted-foreground">{e.target_type}</span>
              )}
              {e.target_type === "user" && e.target_id ? (
                <Link
                  to="/admin/users/$userId"
                  params={{ userId: e.target_id }}
                  className="truncate hover:underline"
                >
                  {e.target_label}
                </Link>
              ) : (
                <span className="truncate">{e.target_label}</span>
              )}
            </span>
          )
        },
      },
      {
        id: "network",
        header: t("audit.columns.network"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => networkName(row.original.network_id) ?? "–",
      },
    ],
    // networkName reads `me`, which only changes on refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, me],
  )

  const exportCsv = () => {
    const rows = query.data?.items ?? []
    downloadText(
      `gezcez-audit-${new Date().toISOString().slice(0, 19).replaceAll(":", "")}.csv`,
      toCsv(
        [
          "at",
          "action",
          "severity",
          "actor_id",
          "actor",
          "target_type",
          "target_id",
          "target",
          "network_id",
          "ip_prefix",
          "request_id",
          "before",
          "after",
        ],
        rows.map((e) => [
          e.at,
          e.action,
          e.severity,
          e.actor?.id,
          e.actor?.display_name,
          e.target_type,
          e.target_id,
          e.target_label,
          e.network_id,
          e.ip_prefix,
          e.request_id,
          e.before ? JSON.stringify(e.before) : "",
          e.after ? JSON.stringify(e.after) : "",
        ]),
      ),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={t("audit.eyebrow")}
        title={t("audit.title")}
        intro={t("audit.intro")}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={!query.data?.items.length}
            onClick={exportCsv}
          >
            <DownloadIcon />
            {t("audit.export")}
          </Button>
        }
      />
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("audit.search")}
        />
        <SelectFilter
          label={t("audit.columns.action")}
          value={search.action}
          options={ACTION_GROUPS.map((a) => ({ value: a, label: `${a}*` }))}
          onChange={(action) => {
            setSearch({ action })
          }}
        />
        <SelectFilter
          label={t("audit.targetType")}
          value={search.target_type}
          options={TARGET_TYPES.map((v) => ({ value: v, label: v }))}
          onChange={(target_type) => {
            setSearch({ target_type })
          }}
        />
        {search.target_id && (
          <Badge variant="outline" className="h-8 gap-1 pr-1 pl-3">
            {t("audit.targetFilter", { id: search.target_id })}
            <button
              type="button"
              className="rounded-full p-1 hover:bg-secondary"
              aria-label={t("audit.clearTarget")}
              onClick={() => {
                setSearch({ target_id: undefined })
              }}
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        )}
      </FilterBar>
      <DataTable
        caption={t("audit.title")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(e) => e.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={search.sort}
        onSortChange={(sort) => {
          setSearch({ sort })
        }}
        renderDetail={(e) => <AuditDetail entry={e} />}
        virtualize
        empty={
          <EmptyState
            title={filtered ? t("audit.noMatchTitle") : t("audit.emptyTitle")}
            actions={
              filtered && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch({
                      q: undefined,
                      action: undefined,
                      target_type: undefined,
                      target_id: undefined,
                    })
                  }}
                >
                  {t("table.clearFilters", { ns: "common" })}
                </Button>
              )
            }
          />
        }
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) =>
              void navigate({ search: (prev) => ({ ...prev, cursor }), resetScroll: true })
            }
            limit={search.limit}
            onLimit={(limit) => {
              setSearch({ limit })
            }}
          />
        }
      />
    </>
  )
}

const KIND_CLASS = {
  added: "text-status-ok",
  removed: "text-destructive line-through",
  changed: "",
  same: "text-muted-foreground",
} as const

function AuditDetail({ entry }: { entry: Entry }) {
  const { t } = useTranslation("dashboard")
  const rows = diffObjects(entry.before, entry.after)
  return (
    <div className="grid gap-4 py-2 lg:grid-cols-[1fr_2fr]">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">{t("audit.detail.at")}</dt>
        <dd>{formatDateTime(entry.at, { dateStyle: "medium", timeStyle: "medium" })}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.id")}</dt>
        <dd className="font-mono">{entry.id}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.requestId")}</dt>
        <dd className="font-mono">{entry.request_id ?? "–"}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.ip")}</dt>
        <dd className="font-mono">{entry.ip_prefix ?? "–"}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.target")}</dt>
        <dd className="font-mono break-all">
          {entry.target_type ?? "–"}
          {entry.target_id ? ` · ${entry.target_id}` : ""}
        </dd>
      </dl>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("audit.detail.noChanges")}</p>
      ) : (
        <table className="w-full text-xs">
          <caption className="sr-only">{t("audit.detail.changes")}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-4 font-medium">{t("audit.detail.field")}</th>
              <th className="py-1 pr-4 font-medium">{t("audit.detail.before")}</th>
              <th className="py-1 font-medium">{t("audit.detail.after")}</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => (
              <tr key={r.key} className="border-t align-top">
                <td className="py-1 pr-4">{r.key}</td>
                <td
                  className={cn(
                    "py-1 pr-4 break-all",
                    r.kind === "changed" ? "text-destructive line-through" : KIND_CLASS[r.kind],
                  )}
                >
                  {formatValue(r.before)}
                </td>
                <td
                  className={cn(
                    "py-1 break-all",
                    r.kind === "changed"
                      ? "text-status-ok"
                      : r.kind === "removed"
                        ? ""
                        : KIND_CLASS[r.kind],
                  )}
                >
                  {formatValue(r.after)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
