import { useTranslation } from "react-i18next"
import { formatDateTime, formatNumber } from "@/lib/format"

/**
 * Tokens issued per day as plain SVG bars (no chart library for one series). The bars carry
 * <title> tooltips and the figure has a text summary for screen readers.
 */
export function UsageChart({ usage }: { usage: { date: string; tokens: number }[] }) {
  const { t } = useTranslation("dashboard")
  if (usage.length === 0)
    return <p className="text-sm text-muted-foreground">{t("apps.usage.empty")}</p>
  const max = Math.max(1, ...usage.map((d) => d.tokens))
  const total = usage.reduce((sum, d) => sum + d.tokens, 0)
  const W = usage.length * 10
  const H = 100
  const first = usage[0]
  const last = usage[usage.length - 1]
  return (
    <figure className="grid gap-1">
      <svg
        viewBox={`0 0 ${String(W)} ${String(H)}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label={t("apps.usage.summary", {
          days: usage.length,
          total: formatNumber(total),
          max: formatNumber(max),
        })}
      >
        {usage.map((d, i) => {
          const h = Math.max(0.5, (d.tokens / max) * (H - 2))
          return (
            <rect
              key={d.date}
              x={i * 10 + 1}
              y={H - h}
              width={8}
              height={h}
              className="fill-brand hover:fill-brand-strong"
            >
              <title>
                {formatDateTime(d.date, { dateStyle: "medium" })}: {formatNumber(d.tokens)}
              </title>
            </rect>
          )
        })}
      </svg>
      <div className="flex justify-between border-t pt-1 text-xs text-muted-foreground">
        <span>{first && formatDateTime(first.date, { dateStyle: "medium" })}</span>
        <span>{last && formatDateTime(last.date, { dateStyle: "medium" })}</span>
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {t("apps.usage.caption", { total: formatNumber(total), max: formatNumber(max) })}
      </figcaption>
    </figure>
  )
}
