import { cn } from "@/lib/utils"

export type Status = "ok" | "warn" | "error" | "off" | "info"

const colors: Record<Status, string> = {
  ok: "bg-status-ok",
  warn: "bg-status-warn",
  error: "bg-status-error",
  off: "bg-status-off",
  info: "bg-status-info",
}

/** Colour is never the only signal: always pass a visible or screen-reader label. */
export function StatusDot({
  status,
  label,
  showLabel = false,
  className,
}: {
  status: Status
  label: string
  showLabel?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", colors[status])} />
      <span className={showLabel ? undefined : "sr-only"}>{label}</span>
    </span>
  )
}
