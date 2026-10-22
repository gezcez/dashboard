import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { tableSearchSchema } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { USER_STATUSES, UserStatusBadge } from "@/components/entity/user-status-badge"
import { UserChip } from "@/components/entity/user-chip"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { Button } from "@/components/ui/button"
import { apiQuery } from "@/lib/api"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"

type User = components["schemas"]["DashUserListItem"]

const searchSchema = tableSearchSchema.extend({
  status: z.enum(["active", "unverified", "banned", "pending_deletion"]).optional(),
})
type Search = z.infer<typeof searchSchema>

const usersQuery = (search: Search) =>
  apiQuery("/v1/dash/users", { params: { query: { limit: 50, ...search } } })

export const Route = createFileRoute("/_app/admin/users/")({
  staticData: { pageId: "admin.users" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("admin.users", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(usersQuery(deps)).catch(() => undefined),
  component: UsersPage,
})

function UsersPage() {
  const { t } = useTranslation("dashboard")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery({ ...usersQuery(search), placeholderData: keepPreviousData })

  /** Any filter or sort change starts again from the first page. */
  const setSearch = (patch: Partial<Search>) =>
    void navigate({
      search: (prev) => ({ ...prev, cursor: undefined, ...patch }),
      replace: true,
    })
  const filtered = Boolean(search.q || search.status)

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "user",
        header: t("users.columns.user"),
        meta: { sortKey: "display_name", className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => <UserChip user={row.original} link />,
      },
      {
        id: "email",
        header: t("users.columns.email"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.email_masked}
          </span>
        ),
      },
      {
        id: "status",
        header: t("users.columns.status"),
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      },
      {
        id: "roles",
        header: t("users.columns.roles"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => <span className="tabular">{formatNumber(row.original.role_count)}</span>,
      },
      {
        id: "last_active_at",
        header: t("users.columns.lastActive"),
        meta: { sortKey: "last_active_at", firstDir: "desc", hideOnMobile: true },
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.last_active_at)}>
            {formatRelative(row.original.last_active_at)}
          </span>
        ),
      },
      {
        id: "created_at",
        header: t("users.columns.joined"),
        meta: { sortKey: "created_at", firstDir: "desc", hideOnMobile: true },
        cell: ({ row }) => formatDateTime(row.original.created_at, { dateStyle: "medium" }),
      },
    ],
    [t],
  )

  return (
    <>
      <PageHeader eyebrow={t("users.eyebrow")} title={t("users.title")} intro={t("users.intro")} />
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("users.search")}
        />
        <SelectFilter
          label={t("users.columns.status")}
          value={search.status}
          options={USER_STATUSES.map((s) => ({ value: s, label: t(`userStatus.${s}`) }))}
          onChange={(status) => {
            setSearch({ status })
          }}
        />
      </FilterBar>
      <DataTable
        caption={t("users.title")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(u) => u.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={search.sort}
        onSortChange={(sort) => {
          setSearch({ sort })
        }}
        empty={
          <EmptyState
            title={filtered ? t("users.noMatchTitle") : t("users.emptyTitle")}
            actions={
              filtered && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch({ q: undefined, status: undefined })
                  }}
                >
                  {t("table.clearFilters", { ns: "common" })}
                </Button>
              )
            }
          >
            {filtered ? t("users.noMatchBody") : null}
          </EmptyState>
        }
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) =>
              void navigate({ search: (prev) => ({ ...prev, cursor }), resetScroll: true })
            }
          />
        }
      />
    </>
  )
}
