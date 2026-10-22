import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { CatalogTabs } from "@/components/transit/catalog-tabs"
import { RouteBadge } from "@/components/transit/route-badge"
import type { RouteSummary } from "@/components/transit/queries"
import { apiQuery } from "@/lib/api"
import { assertPage } from "@/lib/pages"

/** GTFS route_type of each mode the filter offers (the routes endpoint filters by route_type). */
const MODES = { bus: 3, tram: 0, metro: 1, rail: 2, ferry: 4 } as const
type Mode = keyof typeof MODES
const MODE_KEYS = Object.keys(MODES) as Mode[]

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["bus", "tram", "metro", "rail", "ferry"]).optional().catch(undefined),
  cursor: z.string().optional(),
})
type Search = z.infer<typeof searchSchema>

const listQuery = (networkId: number, search: Search) =>
  apiQuery("/v1/networks/{networkId}/routes", {
    params: {
      path: { networkId: String(networkId) },
      query: {
        limit: 50,
        q: search.q,
        cursor: search.cursor,
        ...(search.type ? { type: MODES[search.type] } : {}),
      },
    },
  })

export const Route = createFileRoute("/_app/n/$network/catalog/routes/")({
  staticData: { pageId: "network.catalog" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(listQuery(context.network.id, deps)).catch(() => undefined),
  component: RoutesBrowser,
})

function RoutesBrowser() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery({ ...listQuery(network.id, search), placeholderData: keepPreviousData })
  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })

  const columns = useMemo<ColumnDef<RouteSummary>[]>(
    () => [
      {
        id: "code",
        header: t("catalog.routes.code"),
        cell: ({ row }) => <RouteBadge route={row.original} />,
      },
      {
        id: "name",
        header: t("catalog.routes.name"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => (
          <Link
            to="/n/$network/catalog/routes/$route"
            params={{ network: network.slug, route: row.original.id }}
            className="block truncate font-medium hover:underline"
          >
            {row.original.long_name}
          </Link>
        ),
      },
      {
        id: "agency",
        header: t("catalog.routes.agency"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => row.original.agency ?? "–",
      },
      {
        id: "mode",
        header: t("catalog.routes.mode"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => t(`catalog.modes.${row.original.mode}`),
      },
      {
        id: "id",
        header: t("catalog.routes.id"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>,
      },
    ],
    [t, network.slug],
  )

  return (
    <>
      <PageHeader eyebrow={network.cityName} title={t("catalog.title")} intro={t("catalog.routes.intro")} />
      <CatalogTabs active="routes" />
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("catalog.routes.search")}
        />
        <SelectFilter
          label={t("catalog.routes.mode")}
          value={search.type}
          options={MODE_KEYS.map((m) => ({ value: m, label: t(`catalog.modes.${m}`) }))}
          onChange={(type) => {
            setSearch({ type })
          }}
        />
      </FilterBar>
      <DataTable
        caption={t("catalog.tabs.routes")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(r) => r.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={<EmptyState title={t("catalog.routes.empty")} />}
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) => void navigate({ search: (prev) => ({ ...prev, cursor }) })}
          />
        }
      />
    </>
  )
}
