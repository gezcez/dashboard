import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PlusIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { z } from "zod"
import { tableSearchSchema } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { AppBadges } from "@/components/apps/app-badges"
import { CreateAppDialog } from "@/components/apps/create-app-dialog"
import { SecretOnceDialog } from "@/components/apps/secret-once-dialog"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter } from "@/components/data-table/filters"
import { AppChip } from "@/components/entity/misc-chips"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { Button } from "@/components/ui/button"
import { apiQuery } from "@/lib/api"
import { formatDateTime, formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"

type App = components["schemas"]["AppListItem"]
type Search = z.infer<typeof tableSearchSchema>

const appsQuery = (search: Search) =>
  apiQuery("/v1/dash/apps", { params: { query: { limit: 50, ...search } } })

export const Route = createFileRoute("/_app/admin/apps/")({
  staticData: { pageId: "admin.apps" },
  validateSearch: tableSearchSchema,
  beforeLoad: ({ context }) => assertPage("admin.apps", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(appsQuery(deps)).catch(() => undefined),
  component: AppsPage,
})

function AppsPage() {
  const { t } = useTranslation("dashboard")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const go = useNavigate()
  const query = useQuery({ ...appsQuery(search), placeholderData: keepPreviousData })
  const canWrite = useCan("apps.write", "global") === true
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ clientId: string; secret: string } | null>(null)
  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })

  const columns = useMemo<ColumnDef<App>[]>(
    () => [
      {
        id: "name",
        header: t("apps.columns.app"),
        meta: { sortKey: "name", className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => <AppChip app={row.original} />,
      },
      {
        id: "type",
        header: t("apps.columns.type"),
        meta: { className: "min-w-56" },
        cell: ({ row }) => <AppBadges app={row.original} />,
      },
      {
        id: "redirects",
        header: t("apps.columns.redirects"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => (
          <span className="tabular">{formatNumber(row.original.redirect_uri_count)}</span>
        ),
      },
      {
        id: "families",
        header: t("apps.columns.families"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => (
          <span className="tabular">{formatNumber(row.original.active_families)}</span>
        ),
      },
      {
        id: "tokens_24h",
        header: t("apps.columns.tokens"),
        meta: {
          sortKey: "tokens_24h",
          firstDir: "desc",
          hideOnMobile: true,
          className: "text-right",
        },
        cell: ({ row }) => <span className="tabular">{formatNumber(row.original.tokens_24h)}</span>,
      },
      {
        id: "created_at",
        header: t("apps.columns.created"),
        meta: { sortKey: "created_at", firstDir: "desc", hideOnMobile: true },
        cell: ({ row }) => formatDateTime(row.original.created_at, { dateStyle: "medium" }),
      },
    ],
    [t],
  )

  return (
    <>
      <PageHeader
        eyebrow={t("apps.eyebrow")}
        title={t("apps.title")}
        intro={t("apps.intro")}
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setCreating(true)
              }}
            >
              <PlusIcon />
              {t("apps.create.action")}
            </Button>
          )
        }
      />
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("apps.search")}
        />
      </FilterBar>
      <DataTable
        caption={t("apps.title")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(a) => a.client_id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={search.sort}
        onSortChange={(sort) => {
          setSearch({ sort })
        }}
        empty={<EmptyState title={search.q ? t("apps.noMatch") : t("apps.empty")} />}
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) =>
              void navigate({ search: (prev) => ({ ...prev, cursor }), resetScroll: true })
            }
          />
        }
      />
      <CreateAppDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={({ app, secret }) => {
          if (secret) setCreated({ clientId: app.client_id, secret })
          else void go({ to: "/admin/apps/$appId", params: { appId: app.client_id } })
        }}
      />
      <SecretOnceDialog
        secret={created?.secret ?? null}
        clientId={created?.clientId ?? ""}
        onDone={() => {
          const clientId = created?.clientId
          setCreated(null)
          if (clientId) void go({ to: "/admin/apps/$appId", params: { appId: clientId } })
        }}
      />
    </>
  )
}
