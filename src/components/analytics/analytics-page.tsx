import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/components/layout/page-header"
import { useRouteIndex } from "@/components/transit/queries"
import { cn } from "@/lib/utils"
import { AnalyticsFilterBar } from "./filter-bar"
import { MethodologyButton, TableToggle } from "./panels"
import type { AnalyticsSearch } from "./search"

export const VIEWS = [
  "index",
  "fleet",
  "runtimes",
  "headways",
  "adherence",
  "dwell",
  "speed",
  "quality",
] as const
export type View = (typeof VIEWS)[number]

const PATHS = {
  index: "/n/$network/analytics",
  fleet: "/n/$network/analytics/fleet",
  runtimes: "/n/$network/analytics/runtimes",
  headways: "/n/$network/analytics/headways",
  adherence: "/n/$network/analytics/adherence",
  dwell: "/n/$network/analytics/dwell",
  speed: "/n/$network/analytics/speed",
  quality: "/n/$network/analytics/quality",
} as const satisfies Record<View, string>

/** Search state of the analytics section, shared by every view (validated by its layout). */
export function useAnalyticsSearch() {
  const search = useSearch({ from: "/_app/n/$network/analytics" })
  const navigate = useNavigate({ from: "/n/$network/analytics" })
  const setSearch = (patch: Partial<AnalyticsSearch>) =>
    void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true })
  return { search, setSearch }
}

/**
 * Frame of every analytics view: title, view tabs (filters carry over), the sticky filter bar,
 * and the methodology, export and table toggles.
 */
export function AnalyticsPage({
  view,
  networkId,
  networkName,
  show = {},
  actions,
  methodology,
  children,
}: {
  view: View
  networkId: number
  networkName: string
  show?: { route?: boolean; direction?: boolean; hours?: boolean; dayType?: boolean }
  actions?: ReactNode
  methodology?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation("ops")
  const { network } = useParams({ from: "/_app/n/$network" })
  const { search, setSearch } = useAnalyticsSearch()
  const routes = useRouteIndex(networkId)
  return (
    <>
      <PageHeader
        eyebrow={`${networkName} · ${t("analytics.title")}`}
        title={t(`analytics.views.${view}.title`)}
        intro={t(`analytics.views.${view}.intro`)}
        actions={
          view === "index" ? undefined : (
            <>
              {methodology && (
                <MethodologyButton title={t(`analytics.views.${view}.title`)}>
                  {methodology}
                </MethodologyButton>
              )}
              <TableToggle
                on={Boolean(search.table)}
                onChange={(table) => {
                  setSearch({ table: table || undefined })
                }}
              />
              {actions}
            </>
          )
        }
      />
      <nav
        aria-label={t("analytics.views.label")}
        className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {VIEWS.map((v) => (
          <Link
            key={v}
            to={PATHS[v]}
            params={{ network }}
            search={(prev) => prev}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              v === view && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            aria-current={v === view ? "page" : undefined}
          >
            {t(`analytics.views.${v}.tab`)}
          </Link>
        ))}
      </nav>
      <AnalyticsFilterBar search={search} onChange={setSearch} routes={routes.list} show={show} />
      {children}
    </>
  )
}
