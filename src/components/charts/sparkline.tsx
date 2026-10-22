import { cn } from "@/lib/utils"

/**
 * Tiny inline SVG trend for KPI tiles (plan 8.4: no chart library on light pages). Decorative:
 * the tile's number carries the meaning, so the SVG is hidden from screen readers.
 */
export function Sparkline({
  values,
  className,
  area = true,
}: {
  values: number[]
  className?: string
  area?: boolean
}) {
  if (values.length < 2) return <div className={cn("h-8", className)} aria-hidden />
  const W = 100
  const H = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map(
    (v, i) => [(i / (values.length - 1)) * W, H - 2 - ((v - min) / span) * (H - 4)] as const,
  )
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")
  return (
    <svg
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full text-brand", className)}
      aria-hidden
    >
      {area && <path d={`${line}L${String(W)},${String(H)}L0,${String(H)}Z`} className="fill-current opacity-15" />}
      <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
