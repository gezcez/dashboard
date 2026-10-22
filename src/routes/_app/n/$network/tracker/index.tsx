import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { BindingStatusView } from "@/api/realtime-types"
import { DataTable } from "@/components/data-table/data-table"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { BindingStateBadge } from "@/components/tracker/binding-state"
import { CredentialsBadge } from "@/components/tracker/credentials"
import { useTrackerStatus } from "@/components/tracker/use-tracker-status"
import { bindingsQuery, trackerQuery, type Binding } from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/ui/status-dot"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useNow } from "@/lib/use-now"

export const Route = createFileRoute("/_app/n/$network/tracker/")({
  staticData: { pageId: "network.tracker" },
  beforeLoad: ({ context }) => assertPage("network.tracker", context),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(bindingsQuery(context.network.id)),
      context.queryClient.query(trackerQuery(context.network.id)),
    ]).catch(() => undefined),
  component: TrackerList,
})

interface Row {
  binding: Binding
  status: BindingStatusView | undefined
}

function TrackerList() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const bindings = useQuery(bindingsQuery(network.id))
  const tracker = useTrackerStatus(network.id)
  useNow(5000)

  const rows = useMemo<Row[] | undefined>(
    () => bindings.data?.map((b) => ({ binding: b, status: tracker.bindings.get(b.id) })),
    [bindings.data, tracker.bindings],
  )

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "binding",
        header: t("tracker.columns.binding"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => (
          <Link
            to="/n/$network/tracker/$binding"
            params={{ network: network.slug, binding: String(row.original.binding.id) }}
            className="font-semibold hover:underline"
          >
            {row.original.binding.provider_key}/{row.original.binding.external_ref}
          </Link>
        ),
      },
      {
        id: "state",
        header: t("tracker.columns.state"),
        cell: ({ row }) => (
          <span title={row.original.status?.message ?? undefined}>
            <BindingStateBadge state={row.original.status?.state ?? row.original.binding.state} />
          </span>
        ),
      },
      {
        id: "mode",
        header: t("tracker.columns.mode"),
        meta: { hideOnMobile: true },
        cell: ({ row }) =>
          row.original.status?.url_variant ? (
            <Badge variant={row.original.status.url_variant === "fallback" ? "warn" : "default"}>
              {t(`tracker.urlVariant.${row.original.status.url_variant}`)}
            </Badge>
          ) : (
            "–"
          ),
      },
      {
        id: "interval",
        header: t("tracker.columns.interval"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => (
          <span className="tabular">{formatNumber(row.original.status?.interval_s ?? row.original.binding.poll_interval_s)} s</span>
        ),
      },
      {
        id: "last_poll",
        header: t("tracker.columns.lastPoll"),
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.status?.last_poll_at)} className="whitespace-nowrap">
            {formatRelative(row.original.status?.last_poll_at)}
          </span>
        ),
      },
      {
        id: "outcome",
        header: t("tracker.columns.outcome"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => {
          const o = row.original.status?.last_outcome
          return o ? (
            <StatusDot status={o === "ok" ? "ok" : o === "empty" ? "warn" : "error"} label={o} showLabel className="text-xs" />
          ) : (
            "–"
          )
        },
      },
      {
        id: "vehicles",
        header: t("tracker.columns.vehicles"),
        meta: { className: "text-right" },
        cell: ({ row }) => <span className="tabular">{formatNumber(row.original.status?.live_vehicles)}</span>,
      },
      {
        id: "failures",
        header: t("tracker.columns.failures"),
        meta: { hideOnMobile: true, className: "text-right" },
        cell: ({ row }) => (
          <span className="tabular">{formatNumber(row.original.status?.consecutive_failures)}</span>
        ),
      },
      {
        id: "token",
        header: t("tracker.columns.token"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => <CredentialsBadge credentials={row.original.status?.credentials ?? null} />,
      },
    ],
    [t, network.slug],
  )

  return (
    <>
      <PageHeader
        eyebrow={network.name}
        title={t("tracker.title")}
        intro={t("tracker.intro")}
        actions={
          tracker.runner && (
            <Badge variant={tracker.running ? "ok" : "warn"}>
              {t("tracker.runner", { runner: tracker.runner })}
            </Badge>
          )
        }
      />
      <DataTable
        caption={t("tracker.title")}
        columns={columns}
        rows={rows}
        getRowId={(r) => String(r.binding.id)}
        isPending={bindings.isPending}
        error={bindings.error ?? tracker.error}
        onRetry={() => {
          void bindings.refetch()
          tracker.refetch()
        }}
        empty={<EmptyState title={t("tracker.empty")} />}
      />
    </>
  )
}
