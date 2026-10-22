import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { CrosshairIcon, XIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { VEHICLE_STOP_STATUS } from "@/api/realtime-types"
import { RouteBadge } from "@/components/transit/route-badge"
import { externalId, vehicleQuery, type RouteSummary } from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatClock, formatDuration, formatSpeed } from "@/lib/format"
import type { Vehicle } from "@/lib/realtime"
import { DEFAULT_NETWORK_TIMEZONE, localDate } from "@/lib/time"
import { useNow } from "@/lib/use-now"
import { cn } from "@/lib/utils"
import { motionOf } from "./filters"

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  )
}

/**
 * Right-hand vehicle panel of the live map (`?vehicle=` keeps it linkable). Live fields come
 * from the store and tick every second; duty span and runs come from the vehicle endpoint.
 * Non-modal, so the map stays usable while it is open.
 */
export function VehicleDrawer({
  network,
  vehicleId,
  vehicle,
  route,
  follow,
  onFollow,
  onClose,
}: {
  network: string
  vehicleId: string
  vehicle: Vehicle | undefined
  route: RouteSummary | undefined
  follow: boolean
  onFollow: (follow: boolean) => void
  onClose: () => void
}) {
  const { t } = useTranslation("ops")
  const now = useNow(1000)
  const detail = useQuery({ ...vehicleQuery(vehicleId), refetchInterval: 30_000 })
  const d = detail.data
  const tz = DEFAULT_NETWORK_TIMEZONE
  const age = vehicle ? Math.max(0, Math.round(now / 1000 - vehicle.vts)) : null
  const lag = vehicle?.fts ? Math.max(0, vehicle.fts - vehicle.vts) : null
  const firstRun = d?.runs_today.at(-1) ?? d?.current_run
  const today = localDate(now, tz)
  const statusKey =
    vehicle?.status === VEHICLE_STOP_STATUS.stopped
      ? "stopped"
      : vehicle?.status === VEHICLE_STOP_STATUS.incoming
        ? "incoming"
        : "inTransit"
  const motion = vehicle ? motionOf(vehicle) : null
  const routeExt = route ? externalId(route.id) : null

  return (
    <aside
      aria-label={t("live.drawer.label")}
      className="absolute inset-x-2 bottom-2 z-20 flex max-h-[60%] flex-col overflow-hidden rounded-2xl border bg-card sm:inset-x-auto sm:top-2 sm:right-2 sm:bottom-2 sm:max-h-none sm:w-80"
    >
      <header className="flex items-start gap-3 border-b p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <RouteBadge route={route} code={vehicle?.route_id ? externalId(vehicle.route_id) : null} />
            <h2 className="truncate font-semibold">
              {vehicle?.plate ?? d?.plate ?? d?.label ?? vehicleId}
            </h2>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {vehicle?.headsign ?? route?.long_name ?? t("live.drawer.noRoute")}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("live.drawer.close")}>
          <XIcon />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {!vehicle && (
          <p className="mb-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            {t("live.drawer.notLive")}
          </p>
        )}
        <div className="mb-3 flex flex-wrap gap-2">
          {motion && (
            <Badge variant={motion === "stale" ? "warn" : motion === "moving" ? "ok" : "default"}>
              {t(`live.motion.${motion}`)}
            </Badge>
          )}
          {vehicle && vehicle.dir !== null && (
            <Badge variant="outline">{t("live.direction", { dir: vehicle.dir })}</Badge>
          )}
          {d?.accessible && <Badge variant="outline">{t("live.drawer.accessible")}</Badge>}
        </div>
        <dl>
          <Row label={t("live.drawer.lastUpdate")}>
            <span className={cn(vehicle?.stale && "text-status-warn")}>
              {age === null ? "–" : t("live.drawer.ago", { duration: formatDuration(age) })}
            </span>
          </Row>
          <Row label={t("live.drawer.speed")}>{formatSpeed(vehicle?.speed)}</Row>
          <Row label={t("live.drawer.stop")}>
            {vehicle?.stop_seq === null || vehicle?.stop_seq === undefined
              ? "–"
              : t(`live.drawer.stopStatus.${statusKey}`, { seq: vehicle.stop_seq })}
          </Row>
          <Row label={t("live.drawer.trip")}>
            <span className="font-mono text-xs">{vehicle?.trip_id ?? d?.trip_id ?? "–"}</span>
          </Row>
          <Row label={t("live.drawer.feedLag")}>{lag === null ? "–" : formatDuration(lag)}</Row>
          {d?.current_run?.start_delay_s !== null && d?.current_run?.start_delay_s !== undefined && (
            <Row label={t("live.drawer.startDelay")}>
              {formatDuration(Math.abs(d.current_run.start_delay_s))}{" "}
              {d.current_run.start_delay_s >= 0 ? t("live.drawer.late") : t("live.drawer.early")}
            </Row>
          )}
          <Row label={t("live.drawer.duty")}>
            {detail.isPending ? (
              <Skeleton className="ml-auto h-4 w-24" />
            ) : firstRun ? (
              `${formatClock(firstRun.started_at, tz)} – ${formatClock(d?.last_seen_at, tz)}`
            ) : (
              "–"
            )}
          </Row>
          <Row label={t("live.drawer.runsToday")}>{d ? d.runs_today.length : "–"}</Row>
        </dl>
        <div className="mt-4 grid gap-2">
          <Button
            variant={follow ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              onFollow(!follow)
            }}
            aria-pressed={follow}
          >
            <CrosshairIcon />
            {follow ? t("live.drawer.following") : t("live.drawer.follow")}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/n/$network/live/playback"
              params={{ network }}
              search={{
                hours: 1,
                vehicle: vehicleId,
                ...(vehicle?.route_id ? { routes: [vehicle.route_id] } : {}),
              }}
            >
              {t("live.drawer.openPlayback")}
            </Link>
          </Button>
          {routeExt && (
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/n/$network/analytics/headways"
                params={{ network }}
                search={{ from: today, to: today, route: routeExt, dir: vehicle?.dir === 1 ? 1 : 0 }}
              >
                {t("live.drawer.routeHeadways")}
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/n/$network/analytics/fleet"
              params={{ network }}
              search={{ from: today, to: today }}
            >
              {t("live.drawer.fleetAnalytics")}
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  )
}
