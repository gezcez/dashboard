import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import type { MapLayerMouseEvent } from "react-map-gl/maplibre"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter } from "@/components/data-table/filters"
import { PageHeader } from "@/components/layout/page-header"
import { BaseMap } from "@/components/map/base-map"
import { StopsLayer, STOPS_LAYER } from "@/components/map/layers"
import { EmptyState } from "@/components/states/states"
import { CatalogTabs } from "@/components/transit/catalog-tabs"
import type { StopSummary } from "@/components/transit/queries"
import { Skeleton } from "@/components/ui/skeleton"
import { apiQuery } from "@/lib/api"
import { bounds } from "@/lib/geo"
import { assertPage } from "@/lib/pages"

const searchSchema = z.object({
  q: z.string().optional(),
  cursor: z.string().optional(),
})
type Search = z.infer<typeof searchSchema>

const listQuery = (networkId: number, search: Search) =>
  apiQuery("/v1/networks/{networkId}/stops", {
    params: { path: { networkId: String(networkId) }, query: { limit: 100, ...search } },
  })

export const Route = createFileRoute("/_app/n/$network/catalog/stops/")({
  staticData: { pageId: "network.catalog" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(listQuery(context.network.id, deps)).catch(() => undefined),
  component: StopsBrowser,
})

function StopsBrowser() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery({ ...listQuery(network.id, search), placeholderData: keepPreviousData })
  const items = query.data?.items
  const points = useMemo(
    () => (items ?? []).map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon })),
    [items],
  )
  const box = bounds(points.map((p) => [p.lon, p.lat]))

  const columns = useMemo<ColumnDef<StopSummary>[]>(
    () => [
      {
        id: "name",
        header: t("catalog.stops.name"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => (
          <Link
            to="/n/$network/catalog/stops/$stop"
            params={{ network: network.slug, stop: row.original.id }}
            className="block truncate font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "code",
        header: t("catalog.stops.code"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code ?? "–"}</span>,
      },
      {
        id: "coords",
        header: t("catalog.stops.coords"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <span className="tabular text-xs text-muted-foreground">
            {row.original.lat.toFixed(5)}, {row.original.lon.toFixed(5)}
          </span>
        ),
      },
    ],
    [t, network.slug],
  )

  const onClick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties.id as string | undefined
    if (id)
      void navigate({
        to: "/n/$network/catalog/stops/$stop",
        params: { network: network.slug, stop: id },
      })
  }

  return (
    <>
      <PageHeader eyebrow={network.cityName} title={t("catalog.title")} intro={t("catalog.stops.intro")} />
      <CatalogTabs active="stops" />
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            void navigate({ search: { q }, replace: true })
          }}
          placeholder={t("catalog.stops.search")}
        />
      </FilterBar>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="min-w-0">
          <DataTable
            caption={t("catalog.tabs.stops")}
            columns={columns}
            rows={items}
            getRowId={(s) => s.id}
            isPending={query.isPending}
            isFetching={query.isPlaceholderData}
            error={query.error}
            onRetry={() => void query.refetch()}
            empty={<EmptyState title={t("catalog.stops.empty")} />}
            footer={
              <CursorPager
                page={query.data}
                onCursor={(cursor) => void navigate({ search: (prev) => ({ ...prev, cursor }) })}
              />
            }
          />
        </div>
        {box ? (
          <BaseMap
            key={box.join(",")}
            bounds={box}
            className="h-[560px] xl:sticky xl:top-20"
            interactiveLayerIds={[STOPS_LAYER]}
            onClick={onClick}
          >
            <StopsLayer stops={points} />
          </BaseMap>
        ) : (
          <Skeleton className="h-[560px] rounded-2xl" />
        )}
      </div>
    </>
  )
}
