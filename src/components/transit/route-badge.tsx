import { routeColor } from "@/components/charts/palette"
import { cn } from "@/lib/utils"

/** Route code on its catalogue colour, the way riders see it on the bus. */
export function RouteBadge({
  route,
  code,
  className,
}: {
  route?: { short_name: string; colour?: string | null; text_colour?: string | null }
  /** Shown when the route is not in the catalogue (feed-only routes). */
  code?: string | null
  className?: string
}) {
  const label = route?.short_name ?? code ?? "?"
  const bg = routeColor(route ?? { short_name: label })
  const fg = route?.text_colour ? `#${route.text_colour.replace(/^#/, "")}` : "#ffffff"
  return (
    <span
      className={cn(
        "tabular inline-flex h-5 min-w-8 items-center justify-center rounded-md px-1.5 text-xs font-bold",
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  )
}
