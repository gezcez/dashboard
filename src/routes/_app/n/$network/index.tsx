import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ActivityIcon, BusIcon, GaugeIcon, RouteIcon, TriangleAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState } from "@/components/states/states"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { apiQuery } from "@/lib/api"
import { formatDuration, formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"

const overviewQuery = (networkId: number) =>
  apiQuery("/v1/dash/networks/{networkId}/overview", {
    params: { path: { networkId: String(networkId) } },
  })

export const Route = createFileRoute("/_app/n/$network/")({
  staticData: { pageId: "network.overview" },
  beforeLoad: ({ context }) => assertPage("network.overview", context),
  loader: ({ context }) =>
    context.queryClient.query(overviewQuery(context.network.id)).catch(() => undefined),
  component: NetworkOverview,
})

function NetworkOverview() {
  const { t } = useTranslation("dashboard")
  const { network } = Route.useRouteContext()
  const { data, isPending, error, refetch } = useQuery(overviewQuery(network.id))

  return (
    <>
      <PageHeader
        eyebrow={network.cityName}
        title={network.name}
        intro={t("overview.networkIntro")}
      />
      {error ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {isPending ? (
            Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : (
            <>
              <KpiTile
                label={t("overview.kpis.vehiclesNow")}
                value={formatNumber(data.kpis.vehicles_now)}
                icon={<BusIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.routesRunning")}
                value={formatNumber(data.kpis.routes_running)}
                icon={<RouteIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.feedLag")}
                value={formatDuration(data.kpis.median_feed_lag_s)}
                icon={<ActivityIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.quality")}
                value={formatNumber(data.kpis.quality_score)}
                icon={<GaugeIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.openIssues")}
                value={formatNumber(data.kpis.open_issues)}
                icon={<TriangleAlertIcon className="size-4" />}
              />
            </>
          )}
        </div>
      )}
      <div className="mt-6">
        <EmptyState title={t("overview.emptyTitle")}>{t("overview.emptyBody")}</EmptyState>
      </div>
    </>
  )
}
