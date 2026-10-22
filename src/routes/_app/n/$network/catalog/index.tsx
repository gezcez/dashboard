import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckIcon, MinusIcon, RefreshCwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import { PageHeader } from "@/components/layout/page-header"
import { ErrorState, EmptyState } from "@/components/states/states"
import { BindingStateBadge } from "@/components/tracker/binding-state"
import { CatalogTabs } from "@/components/transit/catalog-tabs"
import {
  bindingsQuery,
  networkManifestQuery,
  type Binding,
} from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatDuration, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"

export const Route = createFileRoute("/_app/n/$network/catalog/")({
  staticData: { pageId: "network.catalog" },
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(networkManifestQuery(context.network.id)),
      context.queryClient.query(bindingsQuery(context.network.id)),
    ]).catch(() => undefined),
  component: CatalogProfile,
})

const syncRunsQuery = (networkId: number) =>
  apiQuery("/v1/dash/networks/{networkId}/sync-runs", {
    params: { path: { networkId: String(networkId) }, query: { limit: 10 } },
  })

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function Yes({ value }: { value: boolean }) {
  const { t } = useTranslation("ops")
  return value ? (
    <CheckIcon className="size-4 text-status-ok" aria-label={t("common.yes")} />
  ) : (
    <MinusIcon className="size-4 text-muted-foreground" aria-label={t("common.no")} />
  )
}

function CatalogProfile() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const manifest = useQuery(networkManifestQuery(network.id))
  const bindings = useQuery(bindingsQuery(network.id))
  const runs = useQuery(syncRunsQuery(network.id))
  const m = manifest.data

  return (
    <>
      <PageHeader eyebrow={network.cityName} title={t("catalog.title")} intro={t("catalog.intro")} />
      <CatalogTabs active="profile" />
      {manifest.error ? (
        <ErrorState onRetry={() => void manifest.refetch()} />
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("catalog.profile.title")}</CardTitle>
              <CardDescription>{t("catalog.profile.readOnly")}</CardDescription>
            </CardHeader>
            <CardContent>
              {!m ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label={t("catalog.profile.name")}>{m.name}</Field>
                  <Field label={t("catalog.profile.slug")}>
                    <span className="font-mono text-xs">{m.slug}</span>
                  </Field>
                  <Field label={t("catalog.profile.operator")}>{m.operator_name ?? "–"}</Field>
                  <Field label={t("catalog.profile.status")}>
                    <Badge variant={m.status === "active" ? "ok" : m.status === "degraded" ? "warn" : "error"}>
                      {t(`catalog.networkStatus.${m.status}`)}
                    </Badge>
                  </Field>
                  <Field label={t("catalog.profile.modes")}>
                    {m.modes.map((mode) => t(`catalog.modes.${mode}`)).join(", ")}
                  </Field>
                  <Field label={t("catalog.profile.staticSynced")}>
                    <span title={formatDateTime(m.freshness.static_synced_at)}>
                      {formatRelative(m.freshness.static_synced_at)}
                    </span>
                    {m.freshness.static_may_be_outdated && (
                      <Badge variant="warn" className="ml-2">
                        {t("catalog.profile.outdated")}
                      </Badge>
                    )}
                  </Field>
                  <Field label={t("catalog.profile.realtimeFeed")}>
                    {formatRelative(m.freshness.realtime_feed_at)}
                  </Field>
                  <Field label={t("catalog.profile.pack")}>
                    <span className="font-mono text-xs">{m.pack_version ?? "–"}</span>
                  </Field>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("catalog.bindings.title")}</CardTitle>
              <CardDescription>{t("catalog.bindings.intro")}</CardDescription>
            </CardHeader>
            <CardContent>
              {bindings.error ? (
                <ErrorState onRetry={() => void bindings.refetch()} />
              ) : bindings.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : bindings.data.length === 0 ? (
                <EmptyState title={t("catalog.bindings.empty")} />
              ) : (
                <div className="grid gap-3">
                  {bindings.data.map((b) => (
                    <BindingRow key={b.id} binding={b} networkId={network.id} network={network.slug} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("catalog.privacy.title")}</CardTitle>
              <CardDescription>{t("catalog.privacy.intro")}</CardDescription>
            </CardHeader>
            <CardContent>
              {m && m.privacy.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("catalog.privacy.none")}</p>
              )}
              {m?.privacy.map((p) => (
                <div key={p.provider} className="mb-4 last:mb-0">
                  <h3 className="mb-2 text-sm font-semibold">{p.provider}</h3>
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("catalog.privacy.key")}</TableHead>
                          <TableHead>{t("catalog.privacy.collected")}</TableHead>
                          <TableHead>{t("catalog.privacy.optOut")}</TableHead>
                          <TableHead>{t("catalog.privacy.details")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {p.pulled_data.map((d) => (
                          <TableRow key={d.key}>
                            <TableCell className="font-mono text-xs">{d.key}</TableCell>
                            <TableCell>
                              <Yes value={d.is_collected} />
                            </TableCell>
                            <TableCell>
                              <Yes value={d.can_optout} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{d.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
              {m && m.attribution.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("catalog.privacy.attribution")}{" "}
                  {m.attribution.map((a) => a.name).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("catalog.sync.runsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {runs.error ? (
                <ErrorState onRetry={() => void runs.refetch()} />
              ) : runs.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : runs.data.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("catalog.sync.noRuns")}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("catalog.sync.started")}</TableHead>
                        <TableHead>{t("catalog.sync.status")}</TableHead>
                        <TableHead>{t("catalog.sync.trigger")}</TableHead>
                        <TableHead>{t("catalog.sync.duration")}</TableHead>
                        <TableHead>{t("catalog.sync.counts")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.data.items.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{formatDateTime(r.started_at)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                r.status === "failed" ? "error" : r.status === "running" ? "brand" : "ok"
                              }
                              title={r.error ?? undefined}
                            >
                              {t(`catalog.sync.statuses.${r.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>{r.trigger}</TableCell>
                          <TableCell className="tabular">
                            {r.finished_at
                              ? formatDuration(
                                  Math.round((Date.parse(r.finished_at) - Date.parse(r.started_at)) / 1000),
                                )
                              : "–"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {r.counts
                              ? Object.entries(r.counts)
                                  .map(([k, v]) => `${k} ${String(v)}`)
                                  .join(" · ")
                              : r.error ?? "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

function BindingRow({
  binding,
  networkId,
  network,
}: {
  binding: Binding
  networkId: number
  network: string
}) {
  const { t } = useTranslation("ops")
  const queryClient = useQueryClient()
  const canSync = useCan("catalog.sync", { network: networkId })
  const canTracker = useCan("tracker.read", { network: networkId })
  const sync = useMutation({
    mutationFn: () =>
      callApi("post", "/v1/dash/networks/{networkId}/bindings/{bindingId}/sync", {
        params: { path: { networkId: String(networkId), bindingId: String(binding.id) } },
      }),
    onSuccess: (r) => {
      if (r.status === "failed") toast.error(t("catalog.sync.failed", { error: r.error ?? "" }))
      else toast.success(t(`catalog.sync.done.${r.status}`))
    },
    onError: (e) => toast.error(isApiError(e) ? apiErrorMessage(e) : t("catalog.sync.failed", { error: "" })),
    onSettled: () => invalidateApi(queryClient, `/v1/dash/networks/{networkId}/sync-runs`),
  })
  const caps = Object.entries(binding.capabilities)
    .filter(([, v]) => v === true || (typeof v === "string" && v !== "none"))
    .map(([k]) => k)
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            {binding.provider_key}/{binding.external_ref}
          </span>
          <BindingStateBadge state={binding.state} />
          {binding.status !== "active" && <Badge variant="warn">{t(`catalog.bindings.status.${binding.status}`)}</Badge>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("catalog.bindings.interval", { s: binding.poll_interval_s, idle: binding.idle_poll_interval_s })}
          {" · "}
          {t("catalog.bindings.lastFeed", { when: formatRelative(binding.last_feed_at) })}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {caps.map((c) => (
            <Badge key={c} variant="outline" className="font-mono text-[10px]">
              {c}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        {canTracker && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/n/$network/tracker/$binding" params={{ network, binding: String(binding.id) }}>
              {t("catalog.bindings.openTracker")}
            </Link>
          </Button>
        )}
        {canSync && (
          <Button
            size="sm"
            variant="outline"
            disabled={sync.isPending}
            onClick={() => {
              sync.mutate()
            }}
          >
            <RefreshCwIcon className={sync.isPending ? "animate-spin" : undefined} />
            {sync.isPending ? t("catalog.sync.running") : t("catalog.sync.now")}
          </Button>
        )}
      </div>
    </div>
  )
}
