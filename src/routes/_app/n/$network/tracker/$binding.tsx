import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, RefreshCwIcon, RotateCcwIcon, ZapIcon } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import type { BindingStatusView } from "@/api/realtime-types"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { ErrorState, NotFoundState, PageSkeleton } from "@/components/states/states"
import { BindingStateBadge } from "@/components/tracker/binding-state"
import { ConfigEditor } from "@/components/tracker/config-editor"
import { CredentialsBadge, CredentialsPanel } from "@/components/tracker/credentials"
import { KillSwitch, useBindingControl } from "@/components/tracker/kill-switch"
import { LiveLogs } from "@/components/tracker/live-logs"
import { PollLog } from "@/components/tracker/poll-log"
import { StatusCharts } from "@/components/tracker/status-charts"
import { useTrackerStatus } from "@/components/tracker/use-tracker-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiQuery } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"

const TABS = ["status", "polls", "token", "fallback", "config", "logs"] as const

const searchSchema = z.object({
  tab: z.enum(TABS).optional().catch(undefined),
})

const bindingQuery = (networkId: number, bindingId: string) =>
  apiQuery("/v1/dash/networks/{networkId}/bindings/{bindingId}", {
    params: { path: { networkId: String(networkId), bindingId } },
  })

export const Route = createFileRoute("/_app/n/$network/tracker/$binding")({
  staticData: { pageId: "network.tracker" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.tracker", context),
  loader: ({ context, params }) =>
    context.queryClient.query(bindingQuery(context.network.id, params.binding)).catch(() => undefined),
  component: BindingDetail,
})

function BindingDetail() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { binding: bindingParam } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const bindingId = Number(bindingParam)
  const binding = useQuery({ ...bindingQuery(network.id, bindingParam), refetchInterval: 30_000 })
  const tracker = useTrackerStatus(network.id)
  const status = tracker.bindings.get(bindingId)
  const canControl = useCan("tracker.control", { network: network.id }) === true
  const control = useBindingControl(network.id, bindingId)
  const tab = search.tab ?? "status"

  if (binding.error)
    return isApiError(binding.error, "NOT_FOUND") ? (
      <NotFoundState title={t("tracker.notFound")} />
    ) : (
      <ErrorState onRetry={() => void binding.refetch()} />
    )
  const b = binding.data
  if (!b) return <PageSkeleton />
  const name = `${b.provider_key}/${b.external_ref}`

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/n/$network/tracker" params={{ network: network.slug }} className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeftIcon className="size-3" />
            {t("tracker.title")}
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {name}
            <BindingStateBadge state={status?.state ?? b.state} />
          </span>
        }
        intro={status?.message ?? b.state_message ?? undefined}
        actions={
          canControl && (
            <Button
              variant="outline"
              size="sm"
              disabled={control.isPending}
              onClick={() => {
                control.mutate({ action: "poll-now" })
              }}
            >
              <ZapIcon />
              {t("tracker.pollNow")}
            </Button>
          )
        }
      />
      <div className="mb-4">
        <KillSwitch binding={b} status={status} networkName={network.name} control={control} canControl={canControl} />
      </div>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          void navigate({ search: { tab: v === "status" ? undefined : (v as (typeof TABS)[number]) }, replace: true })
        }}
      >
        <TabsList className="mb-4 flex-wrap">
          {TABS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`tracker.tabs.${k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="status">
          <StatusTab networkId={network.id} bindingId={bindingId} status={status} />
        </TabsContent>
        <TabsContent value="polls">
          <PollLog networkId={network.id} bindingId={bindingId} />
        </TabsContent>
        <TabsContent value="token">
          <Card className="grid gap-4 p-5">
            <CredentialsPanel credentials={status?.credentials ?? null} />
            {canControl && status?.credentials && (
              <ActionButton
                control={control}
                action="refresh-token"
                icon={<RefreshCwIcon />}
                title={t("tracker.token.refreshTitle", { name })}
                effect={t("tracker.token.refreshEffect")}
                label={t("tracker.token.refresh")}
              />
            )}
          </Card>
        </TabsContent>
        <TabsContent value="fallback">
          <Card className="grid gap-4 p-5">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{t("tracker.fallback.current")}</dt>
                <dd>
                  <Badge variant={status?.url_variant === "fallback" ? "warn" : "default"}>
                    {status?.url_variant ? t(`tracker.urlVariant.${status.url_variant}`) : "–"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("tracker.fallback.baseUrl")}</dt>
                <dd className="font-mono text-xs break-all">
                  {String((status?.url_variant === "fallback" ? b.config.fallback_url : b.config.base_url) ?? "–")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("tracker.fallback.lastFeed")}</dt>
                <dd className="text-sm">{formatRelative(status?.last_feed_at)}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">{t("tracker.fallback.explain")}</p>
            {canControl && (
              <ActionButton
                control={control}
                action="reset-url"
                icon={<RotateCcwIcon />}
                title={t("tracker.fallback.resetTitle", { name })}
                effect={t("tracker.fallback.resetEffect")}
                label={t("tracker.fallback.reset")}
                disabled={status?.url_variant !== "fallback"}
              />
            )}
          </Card>
        </TabsContent>
        <TabsContent value="config">
          <Card className="p-5">
            <ConfigEditor key={b.updated_at ?? ""} binding={b} networkId={network.id} />
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <LiveLogs bindingId={bindingId} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function ActionButton({
  control,
  action,
  icon,
  title,
  effect,
  label,
  disabled,
}: {
  control: ReturnType<typeof useBindingControl>
  action: "reset-url" | "refresh-token"
  icon: ReactNode
  title: string
  effect: string
  label: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const pending = control.isPending && control.variables.action === action
  return (
    <>
      <Button
        variant="outline"
        className="justify-self-start"
        disabled={disabled || pending}
        onClick={() => {
          setOpen(true)
        }}
      >
        {icon}
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        effect={effect}
        confirmLabel={label}
        destructive={false}
        pending={pending}
        error={
          control.error && !isSudoCancelled(control.error) && isApiError(control.error)
            ? apiErrorMessage(control.error)
            : null
        }
        onConfirm={() => {
          control.mutate(
            { action },
            {
              onSuccess: () => {
                setOpen(false)
              },
            },
          )
        }}
      />
    </>
  )
}

function StatusTab({
  networkId,
  bindingId,
  status,
}: {
  networkId: number
  bindingId: number
  status: BindingStatusView | undefined
}) {
  const { t } = useTranslation("ops")
  const path = { networkId: String(networkId), bindingId: String(bindingId) }
  const stats = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/bindings/{bindingId}/stats", { params: { path } }),
    refetchInterval: 30_000,
  })
  // The last 24 h at 5-minute buckets, re-anchored on every refetch.
  const [anchor] = useState(() => Date.now())
  const series = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/bindings/{bindingId}/series", {
      params: {
        path,
        query: {
          from: new Date(anchor - 86_400_000).toISOString(),
          to: new Date(anchor).toISOString(),
          bucket: "5m",
        },
      },
    }),
    refetchInterval: 5 * 60_000,
  })
  const s = stats.data
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiTile label={t("tracker.kpis.vehicles")} value={formatNumber(status?.live_vehicles ?? s?.live_vehicles)} />
        <KpiTile
          label={t("tracker.kpis.success")}
          value={
            s?.success_rate === null || s?.success_rate === undefined
              ? "–"
              : formatNumber(s.success_rate, { style: "percent", maximumFractionDigits: 1 })
          }
          hint={s ? t("tracker.kpis.window", { hours: s.window_hours }) : undefined}
        />
        <KpiTile
          label={t("tracker.kpis.lastPoll")}
          value={formatRelative(status?.last_poll_at)}
          hint={status?.last_poll_at ? formatDateTime(status.last_poll_at) : undefined}
        />
        <KpiTile
          label={t("tracker.kpis.failures")}
          value={formatNumber(status?.consecutive_failures)}
          hint={status?.last_outcome ?? undefined}
        />
        <KpiTile label={t("tracker.kpis.token")} value={<CredentialsBadge credentials={status?.credentials ?? null} />} />
      </div>
      {series.error ? (
        <ErrorState onRetry={() => void series.refetch()} />
      ) : series.data ? (
        <StatusCharts series={series.data} bindingId={bindingId} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      )}
    </div>
  )
}
