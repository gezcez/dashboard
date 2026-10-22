import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import { routeColor } from "@/components/charts/palette"
import { PageHeader } from "@/components/layout/page-header"
import { BaseMap } from "@/components/map/base-map"
import { RouteShapeLayer, StopsLayer, type ShapeLine } from "@/components/map/layers"
import { ErrorState, NotFoundState, PageSkeleton } from "@/components/states/states"
import { TimetableGrid } from "@/components/transit/timetable-grid"
import { RouteBadge } from "@/components/transit/route-badge"
import { externalId, routeQuery, shapeQuery, timetableQuery } from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDuration, formatNumber } from "@/lib/format"
import { bounds, decodePolyline } from "@/lib/geo"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"
import { useResolvedTheme } from "@/lib/theme"
import { DEFAULT_NETWORK_TIMEZONE, localDate } from "@/lib/time"
import { cn } from "@/lib/utils"

const DAY_TYPES = ["weekday", "saturday", "sunday"] as const

const searchSchema = z.object({
  dir: z.union([z.literal(0), z.literal(1)]).optional().catch(undefined),
  day: z.enum(DAY_TYPES).optional().catch(undefined),
})

export const Route = createFileRoute("/_app/n/$network/catalog/routes/$route")({
  staticData: { pageId: "network.catalog" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.catalog", context),
  loader: ({ context, params }) =>
    context.queryClient.query(routeQuery(params.route)).catch(() => undefined),
  component: RouteDetail,
})

function RouteDetail() {
  const { t } = useTranslation("ops")
  const { network } = Route.useRouteContext()
  const { route: routeId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const theme = useResolvedTheme()
  const canAnalytics = useCan("analytics.read", { network: network.id })
  const detail = useQuery(routeQuery(routeId))
  const shape = useQuery(shapeQuery(routeId))
  const dir = search.dir ?? 0
  const day = search.day ?? "weekday"
  const timetable = useQuery(timetableQuery(routeId, day, dir))

  const r = detail.data
  const color = routeColor(r, theme)
  const lines = useMemo<ShapeLine[]>(
    () =>
      (shape.data?.shapes ?? [])
        .filter((s) => s.direction === dir)
        .map((s) => ({
          id: s.pattern_id,
          color,
          coords: decodePolyline(s.polyline, shape.data?.precision ?? 6),
        })),
    [shape.data, dir, color],
  )
  const direction = r?.directions.find((d) => d.direction === dir) ?? r?.directions[0]
  const pattern = direction?.patterns[0]
  const stops = pattern?.stops ?? []
  const box = bounds([...lines.flatMap((l) => l.coords), ...stops.map((s) => [s.lon, s.lat] as [number, number])])

  if (detail.error)
    return isApiError(detail.error, "NOT_FOUND") ? (
      <NotFoundState title={t("catalog.route.notFound")} />
    ) : (
      <ErrorState onRetry={() => void detail.refetch()} />
    )
  if (!r) return <PageSkeleton />

  const today = localDate(Date.now(), DEFAULT_NETWORK_TIMEZONE)
  const ext = externalId(r.id)

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/n/$network/catalog/routes" params={{ network: network.slug }} className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeftIcon className="size-3" />
            {t("catalog.tabs.routes")}
          </Link>
        }
        title={
          <span className="flex items-center gap-3">
            <RouteBadge route={r} className="h-7 min-w-10 text-base" />
            {r.long_name}
          </span>
        }
        intro={[r.agency, t(`catalog.modes.${r.mode}`)].filter(Boolean).join(" · ")}
        actions={
          canAnalytics ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/n/$network/analytics/runtimes"
                  params={{ network: network.slug }}
                  search={{ route: ext, dir }}
                >
                  {t("catalog.route.runtimes")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/n/$network/analytics/headways"
                  params={{ network: network.slug }}
                  search={{ route: ext, dir, from: today, to: today }}
                >
                  {t("catalog.route.headways")}
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />
      <Tabs
        value={String(dir)}
        onValueChange={(v) => {
          void navigate({ search: (prev) => ({ ...prev, dir: Number(v) as 0 | 1 }), replace: true })
        }}
        className="mb-4"
      >
        <TabsList>
          {r.directions.map((d) => (
            <TabsTrigger key={d.direction} value={String(d.direction)}>
              {t("catalog.route.towards", { headsign: d.headsign ?? t("live.direction", { dir: d.direction }) })}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {box ? (
            <BaseMap key={`${routeId}-${String(dir)}`} bounds={box} className="h-[420px]">
              <RouteShapeLayer lines={lines} />
              <StopsLayer stops={stops.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon }))} color={color} />
            </BaseMap>
          ) : (
            <Skeleton className="h-[420px] rounded-2xl" />
          )}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>{t("catalog.route.timetable")}</CardTitle>
              <div className="flex gap-1" role="group" aria-label={t("catalog.route.dayType")}>
                {DAY_TYPES.map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={d === day ? "primary" : "outline"}
                    onClick={() => {
                      void navigate({ search: (prev) => ({ ...prev, day: d }), replace: true })
                    }}
                  >
                    {t(`analytics.dayTypes.${d}`)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {timetable.isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : timetable.error || !timetable.data.patterns.length ? (
                <p className="text-sm text-muted-foreground">{t("catalog.route.noTimetable")}</p>
              ) : (
                <div className="grid gap-6">
                  {timetable.data.patterns.map((p) => (
                    <div key={p.id}>
                      <h3 className="mb-2 text-sm font-semibold">
                        {p.headsign}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {t("catalog.route.departures", { count: p.departures.length })}
                        </span>
                      </h3>
                      <TimetableGrid pattern={p} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t("catalog.route.stops", { count: stops.length })}</CardTitle>
            {pattern && (
              <p className="text-sm text-muted-foreground">
                {formatNumber(Math.round(pattern.length_m / 100) / 10)} km
                {pattern.stops.at(-1)?.offset_s
                  ? ` · ${formatDuration(pattern.stops.at(-1)?.offset_s ?? 0)}`
                  : ""}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <ol className="relative grid gap-0">
              {stops.map((s, i) => (
                <li key={`${s.id}-${String(s.seq)}`} className="relative flex items-center gap-3 py-1.5 pl-6">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0 left-2 w-0.5",
                      i === 0 ? "top-1/2 h-1/2" : i === stops.length - 1 ? "h-1/2" : "h-full",
                    )}
                    style={{ backgroundColor: color }}
                  />
                  <span
                    aria-hidden
                    className="absolute left-[3px] size-3 rounded-full border-2 bg-card"
                    style={{ borderColor: color }}
                  />
                  <Link
                    to="/n/$network/catalog/stops/$stop"
                    params={{ network: network.slug, stop: s.id }}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {s.name}
                  </Link>
                  {s.offset_s !== null && (
                    <Badge variant="outline" className="tabular">
                      +{Math.round(s.offset_s / 60)}′
                    </Badge>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
