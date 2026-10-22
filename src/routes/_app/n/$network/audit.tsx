import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { tableSearchSchema } from "@/api/pagination"
import { ACTION_GROUPS, AuditDetail, useAuditColumns } from "@/components/audit/audit-columns"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { apiQuery } from "@/lib/api"
import { assertPage } from "@/lib/pages"

const searchSchema = tableSearchSchema.extend({ action: z.string().optional() })
type Search = z.infer<typeof searchSchema>

const networkAuditQuery = (networkId: number, search: Search) =>
  apiQuery("/v1/dash/networks/{networkId}/audit", {
    params: { path: { networkId: String(networkId) }, query: { limit: 50, ...search } },
  })

export const Route = createFileRoute("/_app/n/$network/audit")({
  staticData: { pageId: "network.audit" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.audit", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(networkAuditQuery(context.network.id, deps)).catch(() => undefined),
  component: NetworkAuditPage,
})

/** The audit log filtered to one network, for network admins (audit.read in that network). */
function NetworkAuditPage() {
  const { t } = useTranslation("dashboard")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery({
    ...networkAuditQuery(network.id, search),
    placeholderData: keepPreviousData,
  })
  const columns = useAuditColumns({ network: false })
  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })

  return (
    <>
      <PageHeader eyebrow={network.name} title={t("audit.title")} intro={t("audit.networkIntro")} />
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
            title={search.q || search.action ? t("audit.noMatchTitle") : t("audit.emptyTitle")}
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
