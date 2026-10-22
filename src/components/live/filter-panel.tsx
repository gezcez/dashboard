import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"
import { SearchFilter } from "@/components/data-table/filters"
import { RouteBadge } from "@/components/transit/route-badge"
import { compareRouteCodes, type RouteSummary } from "@/components/transit/queries"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { MOTIONS, isFiltered, type FacetCounts, type LiveSearch } from "./filters"

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
        active && "border-primary/40 bg-accent text-accent-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  )
}

function Count({ n }: { n: number }) {
  return <span className="tabular text-muted-foreground">{formatNumber(n)}</span>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 rounded accent-brand"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked)
        }}
      />
      {children}
    </label>
  )
}

/** Left panel of the live map: facets with live counts, all bound to the URL. */
export function LiveFilterPanel({
  search,
  counts,
  routes,
  agencies,
  onChange,
}: {
  search: LiveSearch
  counts: FacetCounts
  routes: RouteSummary[]
  agencies: string[]
  onChange: (patch: Partial<LiveSearch>) => void
}) {
  const { t } = useTranslation("ops")
  const selected = new Set(search.routes ?? [])
  const sorted = [...routes].sort((a, b) => compareRouteCodes(a.short_name, b.short_name))
  const toggleRoute = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange({ routes: next.size ? [...next] : undefined })
  }

  return (
    <div className="grid gap-5">
      <SearchFilter
        value={search.q}
        onChange={(q) => {
          onChange({ q })
        }}
        placeholder={t("live.filters.search")}
      />
      <Section title={t("live.filters.status")}>
        <div className="flex flex-wrap gap-1.5">
          {MOTIONS.map((m) => (
            <Pill
              key={m}
              active={search.motion === m}
              onClick={() => {
                onChange({ motion: search.motion === m ? undefined : m })
              }}
            >
              {t(`live.motion.${m}`)} <Count n={counts.motion[m]} />
            </Pill>
          ))}
        </div>
      </Section>
      <Section title={t("live.filters.direction")}>
        <div className="flex flex-wrap gap-1.5">
          {([0, 1] as const).map((d) => (
            <Pill
              key={d}
              active={search.dir === d}
              onClick={() => {
                onChange({ dir: search.dir === d ? undefined : d })
              }}
            >
              {t("live.direction", { dir: d })} <Count n={counts.dir[d]} />
            </Pill>
          ))}
        </div>
      </Section>
      {agencies.length > 1 && (
        <Section title={t("live.filters.agency")}>
          <div className="flex flex-wrap gap-1.5">
            {agencies.map((a) => (
              <Pill
                key={a}
                active={search.agency === a}
                onClick={() => {
                  onChange({ agency: search.agency === a ? undefined : a })
                }}
              >
                {a} <Count n={counts.agency.get(a) ?? 0} />
              </Pill>
            ))}
          </div>
        </Section>
      )}
      <Toggle
        checked={Boolean(search.trip)}
        onChange={(trip) => {
          onChange({ trip: trip || undefined })
        }}
      >
        {t("live.filters.onlyWithTrip")}
      </Toggle>
      <Section title={t("live.filters.routes")}>
        <ul className="-mx-1 grid max-h-72 gap-0.5 overflow-y-auto pr-1">
          {sorted.map((r) => (
            <li key={r.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-secondary">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={selected.has(r.id)}
                  onChange={() => {
                    toggleRoute(r.id)
                  }}
                />
                <RouteBadge route={r} />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.long_name}</span>
                <Count n={counts.routes.get(r.id) ?? 0} />
              </label>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t("live.filters.layers")}>
        <Toggle
          checked={Boolean(search.stops)}
          onChange={(stops) => {
            onChange({ stops: stops || undefined })
          }}
        >
          {t("live.filters.stops")}
        </Toggle>
        <Toggle
          checked={Boolean(search.labels)}
          onChange={(labels) => {
            onChange({ labels: labels || undefined })
          }}
        >
          {t("live.filters.labels")}
        </Toggle>
      </Section>
      {isFiltered(search) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onChange({
              routes: undefined,
              dir: undefined,
              motion: undefined,
              agency: undefined,
              q: undefined,
              trip: undefined,
            })
          }}
        >
          {t("table.clearFilters", { ns: "common" })}
        </Button>
      )}
    </div>
  )
}
