import { useTranslation } from "react-i18next"
import { StatusDot, type Status } from "@/components/ui/status-dot"
import type { ConnectionState } from "@/lib/realtime"

const STATUS: Record<ConnectionState, Status> = {
  idle: "off",
  connecting: "info",
  open: "ok",
  reconnecting: "warn",
  fallback: "warn",
}

/** Socket state for live pages: live, connecting, reconnecting, or polling fallback. */
export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const { t } = useTranslation("ops")
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1">
      <StatusDot
        status={STATUS[state]}
        label={t(`live.connection.${state}`)}
        showLabel
        className="text-xs"
      />
    </span>
  )
}
