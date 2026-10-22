import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BusIcon, NetworkIcon, TriangleAlertIcon, UsersIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusDot } from "@/components/ui/status-dot"
import { apiQuery } from "@/lib/api"
import { formatDuration, formatNumber, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"

const overviewQuery = () => ({ ...apiQuery("/v1/dash/overview"), refetchInterval: 30_000 })
const healthQuery = () => ({ ...apiQuery("/v1/dash/system/health"), refetchInterval: 30_000 })

export const Route = createFileRoute("/_app/admin/")({
  staticData: { pageId: "admin.overview" },
  beforeLoad: ({ context }) => assertPage("admin.overview", context),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(apiQuery("/v1/dash/overview")).catch(() => undefined),
      context.queryClient.query(apiQuery("/v1/dash/system/health")).catch(() => undefined),
    ]),
  component: GlobalOverview,
})

const SEVERITY = { info: "default", warn: "warn", critical: "error" } as const

function GlobalOverview() {
  const { t } = useTranslation("dashboard")
  const overview = useQuery(overviewQuery())
  const health = useQuery(healthQuery())
  const kpis = overview.data?.kpis

  return (
    <>
      <PageHeader
        eyebrow={t("overview.eyebrow")}
        title={t("overview.title")}
        intro={t("overview.intro")}
      />

      {overview.error ? (
        <ErrorState onRetry={() => void overview.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {!kpis ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : (
            <>
              <KpiTile
                label={t("overview.kpis.activeVehicles")}
                value={formatNumber(kpis.active_vehicles)}
                icon={<BusIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.networksLive")}
                value={formatNumber(kpis.networks_live)}
                hint={t("overview.kpis.ofTotal", { total: kpis.networks_total })}
                icon={<NetworkIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.users")}
                value={formatNumber(kpis.users_total)}
                hint={t("overview.kpis.signups7d", { count: kpis.signups_7d })}
                icon={<UsersIcon className="size-4" />}
              />
              <KpiTile
                label={t("overview.kpis.openIssues")}
                value={formatNumber(kpis.open_issues)}
                icon={<TriangleAlertIcon className="size-4" />}
              />
            </>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("overview.health")}</CardTitle>
            {health.data && (
              <p className="font-mono text-xs text-muted-foreground">
                {t("overview.version", {
                  version: health.data.version,
                  sha: health.data.git_sha,
                  mode: health.data.mode,
                })}
                {" · "}
                {formatDuration(health.data.uptime_s)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {health.isPending ? (
              <Skeleton className="h-40" />
            ) : health.error ? (
              <ErrorState onRetry={() => void health.refetch()} />
            ) : (
              <ul className="divide-y">
                {health.data.checks.map((c) => (
                  <li
                    key={c.key}
                    className="flex items-center gap-3 py-2 text-sm"
                    title={c.threshold ?? undefined}
                  >
                    <StatusDot status={c.status} label={c.status} />
                    <span className="font-mono text-xs">{c.key}</span>
                    <span className="ml-auto text-right text-muted-foreground">{c.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview.recentEvents")}</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.isPending ? (
              <Skeleton className="h-40" />
            ) : !overview.data?.recent_events.length ? (
              <p className="text-sm text-muted-foreground">{t("overview.noEvents")}</p>
            ) : (
              <ul className="divide-y">
                {overview.data.recent_events.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
                  >
                    <Badge variant={SEVERITY[e.severity]} className="font-mono">
                      {e.action}
                    </Badge>
                    <span className="min-w-0 truncate">
                      {e.actor?.display_name}
                      {e.target_label && (
                        <span className="text-muted-foreground"> → {e.target_label}</span>
                      )}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelative(e.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <EmptyState title={t("overview.emptyTitle")}>{t("overview.emptyBody")}</EmptyState>
      </div>
    </>
  )
}
