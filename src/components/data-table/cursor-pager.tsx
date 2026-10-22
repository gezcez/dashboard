import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PAGE_LIMITS, type Page } from "@/api/pagination"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"

/** Prev/next over opaque cursors (backend 7.0) plus the capped total. */
export function CursorPager({
  page,
  onCursor,
  limit,
  onLimit,
}: {
  page: Pick<Page<unknown>, "next_cursor" | "prev_cursor" | "total"> | undefined
  onCursor: (cursor: string | undefined) => void
  /** With onLimit, a rows-per-page select (25 to 200) is shown. */
  limit?: number
  onLimit?: (limit: number) => void
}) {
  const { t } = useTranslation()
  const total = page?.total
  return (
    <nav className="flex items-center justify-between gap-2" aria-label={t("table.pagination")}>
      <p className="tabular text-xs text-muted-foreground">
        {page === undefined
          ? " "
          : total === null || total === undefined
            ? t("table.totalMany")
            : t("table.total", { count: total, formatted: formatNumber(total) })}
      </p>
      <div className="flex items-center gap-1">
        {onLimit && (
          <label className="mr-2 flex items-center gap-2 text-xs text-muted-foreground">
            {t("table.perPage")}
            <select
              value={limit ?? PAGE_LIMITS[1]}
              onChange={(e) => {
                onLimit(Number(e.target.value))
              }}
              className="tabular h-8 rounded-full border bg-card px-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {PAGE_LIMITS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!page?.prev_cursor}
          aria-label={t("table.prev")}
          onClick={() => {
            // The first page has no cursor; a prev cursor pointing at offset 0 is still valid.
            onCursor(page?.prev_cursor ?? undefined)
          }}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!page?.next_cursor}
          aria-label={t("table.next")}
          onClick={() => {
            onCursor(page?.next_cursor ?? undefined)
          }}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
