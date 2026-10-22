import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import { useMetric, num, str } from "@/components/analytics/use-metric"
import { PageHeader } from "@/components/layout/page-header"
import { BaseMap } from "@/components/map/base-map"
import { StopsLayer } from "@/components/map/layers"
import { ErrorState, NotFoundState, PageSkeleton } from "@/components/states/states"
import { RouteBadge } from "@/components/transit/route-badge"
import { departuresQuery, externalId, stopQuery } from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { formatClock, formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"
import { addDays, DEFAULT_NETWORK_TIMEZONE, localDate } from "@/lib/time"

export const Route = createFileRoute("/_app/n/$network/catalog/stops/$stop")({
  staticData: { pageId: "network.catalog" },
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  loader: ({ context, params }) =>
    context.queryClient.query(stopQuery(params.stop)).catch(() => undefined),
  component: StopDetail,
})

function StopDetail() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { stop: stopId } = Route.useParams()
  const tz = DEFAULT_NETWORK_TIMEZONE
  const detail = useQuery(stopQuery(stopId))
  const departures = useQuery(departuresQuery(stopId))
  const canAnalytics = useCan("analytics.read", { network: network.id }) === true
  const today = localDate(Date.now(), tz)
  const range = { from: addDays(today, -6), to: today }
  const dwell = useMetric(
    network.id,
    "dwell.stops",
    { ...range, stop_id: externalId(stopId) },
    { enabled: canAnalytics },
  )
  const headways = useMetric(network.id, "headways.observed", range, { enabled: canAnalytics })

  if (detail.error)
    return isApiError(detail.error, "NOT_FOUND") ? (
      <NotFoundState title={t("catalog.stop.notFound")} />
    ) : (
      <ErrorState onRetry={() => void detail.refetch()} />
    )
  const s = detail.data
  if (!s) return <PageSkeleton />

  const dwellRows = dwell.rows
  const dwellN = dwellRows.reduce((a, r) => a + (num(r.n) ?? 0), 0)
  const dwellMedian =
    dwellN > 0
      ? dwellRows.reduce((a, r) => a + (num(r.median_dwell_s) ?? 0) * (num(r.n) ?? 0), 0) / dwellN
      : null
  const ext = externalId(stopId)
  const hw = headways.rows.filter((r) => str(r.stop_ext) === ext)
  const hwN = hw.reduce((a, r) => a + (num(r.n) ?? 0), 0)
  const hwMedian =
    hwN > 0 ? hw.reduce((a, r) => a + (num(r.median_headway_min) ?? 0) * (num(r.n) ?? 0), 0) / hwN : null

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/n/$network/catalog/stops" params={{ network: network.slug }} className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeftIcon className="size-3" />
            {t("catalog.tabs.stops")}
          </Link>
        }
        title={s.name}
        intro={
          <span className="font-mono text-xs">
            {s.id}
            {s.code ? ` · ${s.code}` : ""} · {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
          </span>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <BaseMap
            initialViewState={{ longitude: s.lon, latitude: s.lat, zoom: 16 }}
            className="h-[360px]"
          >
            <StopsLayer stops={[{ id: s.id, name: s.name, lat: s.lat, lon: s.lon, weight: 0.5 }]} selectedId={s.id} />
          </BaseMap>
          {canAnalytics && (
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiTile
                label={t("catalog.stop.dwell")}
                value={dwell.isPending ? <Skeleton className="h-7 w-16" /> : dwellMedian === null ? "–" : `${formatNumber(Math.round(dwellMedian))} s`}
                hint={t("catalog.stop.last7")}
              />
              <KpiTile
                label={t("catalog.stop.headway")}
                value={headways.isPending ? <Skeleton className="h-7 w-16" /> : hwMedian === null ? "–" : `${formatNumber(hwMedian, { maximumFractionDigits: 1 })} min`}
                hint={t("catalog.stop.last7")}
              />
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t("catalog.stop.routes", { count: s.routes.length })}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {s.routes.map((r) => (
                <Link
                  key={r.id}
                  to="/n/$network/catalog/routes/$route"
                  params={{ network: network.slug, route: r.id }}
                  className="inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm hover:bg-secondary"
                >
                  <RouteBadge route={r} />
                  <span className="max-w-48 truncate">{r.long_name}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t("catalog.stop.departures")}</CardTitle>
          </CardHeader>
          <CardContent>
            {departures.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : departures.error || departures.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("catalog.stop.noDepartures")}</p>
            ) : (
              <ul className="grid gap-1">
                {departures.data.items.map((d, i) => (
                  <li key={`${d.trip_id ?? ""}-${String(i)}`} className="flex items-center gap-2 border-b py-1.5 text-sm last:border-0">
                    <RouteBadge route={d.route} />
                    <span className="min-w-0 flex-1 truncate">{d.headsign ?? d.route.long_name}</span>
                    {d.source !== "schedule" && (
                      <Badge variant="ok">{t(`catalog.stop.source.${d.source}`)}</Badge>
                    )}
                    <span className="tabular font-semibold">
                      {formatClock(d.predicted_at ?? d.scheduled_at, tz)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
