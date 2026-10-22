import { useTranslation } from "react-i18next"
import { SelectFilter } from "@/components/data-table/filters"
import { compareRouteCodes, externalId, type RouteSummary } from "@/components/transit/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DAY_TYPES,
  MAX_DAYS,
  PRESETS,
  presetOf,
  presetRange,
  rangeError,
  rangeOf,
  type AnalyticsSearch,
} from "./search"

const HOURS = Array.from({ length: 24 }, (_, h) => h)

/**
 * The sticky analytics filter bar (plan 6.6): date presets or a custom range (max 90 days), day
 * type, hour range, and, on views that use them, route and direction. Everything is URL state.
 */
export function AnalyticsFilterBar({
  search,
  onChange,
  routes,
  show,
}: {
  search: AnalyticsSearch
  onChange: (patch: Partial<AnalyticsSearch>) => void
  routes: RouteSummary[]
  show: { route?: boolean; direction?: boolean; hours?: boolean; dayType?: boolean }
}) {
  const { t } = useTranslation("ops")
  const range = rangeOf(search)
  const preset = presetOf(range)
  const error = rangeError(range)
  const routeOptions = [...routes]
    .filter((r) => !r.short_name.startsWith("419"))
    .sort((a, b) => compareRouteCodes(a.short_name, b.short_name))
    .map((r) => ({ value: externalId(r.id), label: `${r.short_name} · ${r.long_name}` }))

  return (
    <div className="sticky top-14 z-10 -mx-4 mb-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label={t("analytics.filters.range")}>
          {PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? "primary" : "outline"}
              onClick={() => {
                onChange(presetRange(p))
              }}
            >
              {t(`analytics.presets.${p}`)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            aria-label={t("analytics.filters.from")}
            value={range.from}
            max={range.to}
            className={cn("h-8 w-36 text-sm", error && "border-destructive")}
            onChange={(e) => {
              if (e.target.value) onChange({ from: e.target.value })
            }}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            aria-label={t("analytics.filters.to")}
            value={range.to}
            min={range.from}
            className={cn("h-8 w-36 text-sm", error && "border-destructive")}
            onChange={(e) => {
              if (e.target.value) onChange({ to: e.target.value })
            }}
          />
        </div>
        {show.dayType !== false && (
          <SelectFilter
            label={t("analytics.filters.dayType")}
            value={search.day && search.day !== "all" ? search.day : undefined}
            options={DAY_TYPES.filter((d) => d !== "all").map((d) => ({
              value: d,
              label: t(`analytics.dayTypes.${d}`),
            }))}
            onChange={(day) => {
              onChange({ day })
            }}
          />
        )}
        {show.hours !== false && (
          <>
            <SelectFilter
              label={t("analytics.filters.hourFrom")}
              value={search.hf === undefined ? undefined : String(search.hf)}
              options={HOURS.map((h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }))}
              onChange={(v) => {
                onChange({ hf: v === undefined ? undefined : Number(v) })
              }}
            />
            <SelectFilter
              label={t("analytics.filters.hourTo")}
              value={search.ht === undefined ? undefined : String(search.ht)}
              options={HOURS.map((h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:59` }))}
              onChange={(v) => {
                onChange({ ht: v === undefined ? undefined : Number(v) })
              }}
            />
          </>
        )}
        {show.route && (
          <SelectFilter
            label={t("analytics.filters.route")}
            value={search.route}
            options={routeOptions}
            onChange={(route) => {
              onChange({ route })
            }}
          />
        )}
        {show.direction && (
          <SelectFilter
            label={t("analytics.filters.direction")}
            value={search.dir === undefined ? undefined : String(search.dir)}
            options={[0, 1].map((d) => ({ value: String(d), label: t("live.direction", { dir: d }) }))}
            onChange={(v) => {
              onChange({ dir: v === undefined ? undefined : (Number(v) as 0 | 1) })
            }}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t("analytics.filters.tooLong", { days: MAX_DAYS })}
        </p>
      )}
    </div>
  )
}
