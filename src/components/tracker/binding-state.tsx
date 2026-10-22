import { useTranslation } from "react-i18next"
import type { BindingState } from "@/api/realtime-types"
import { StatusDot, type Status } from "@/components/ui/status-dot"
import { cn } from "@/lib/utils"

const STATUS: Record<BindingState, Status> = {
  ok: "ok",
  degraded: "warn",
  down: "error",
  paused: "off",
  killed: "error",
  unknown: "off",
}

/** A binding's tracker state as a labelled dot (colour is never the only signal). */
export function BindingStateBadge({
  state,
  className,
}: {
  state: BindingState
  className?: string
}) {
  const { t } = useTranslation("ops")
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <StatusDot status={STATUS[state]} label={t(`tracker.state.${state}`)} showLabel className="text-xs" />
    </span>
  )
}
