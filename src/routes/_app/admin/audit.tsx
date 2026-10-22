import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { DownloadIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { tableSearchSchema } from "@/api/pagination"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { ACTION_GROUPS, AuditDetail, useAuditColumns } from "@/components/audit/audit-columns"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiQuery } from "@/lib/api"
import { downloadText, toCsv } from "@/lib/csv"
import { assertPage } from "@/lib/pages"

const TARGET_TYPES = ["user", "role", "binding", "app", "settings", "session"] as const

const searchSchema = tableSearchSchema.extend({
  action: z.string().optional(),
  target_type: z.string().optional(),
  target_id: z.string().optional(),
})
type Search = z.infer<typeof searchSchema>

const auditQuery = (search: Search) =>
  apiQuery("/v1/dash/audit", { params: { query: { limit: 50, ...search } } })

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

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })
  const filtered = Boolean(search.q || search.action || search.target_type || search.target_id)

  const columns = useAuditColumns()

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
