import { Link } from "@tanstack/react-router"
import { NetworkIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateTime, formatRelative } from "@/lib/format"
import { UserChip } from "./user-chip"

export function NetworkChip({ network }: { network: { slug: string; name: string } }) {
  return (
    <Link
      to="/n/$network"
      params={{ network: network.slug }}
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      <NetworkIcon className="size-3.5 text-muted-foreground" />
      {network.name}
    </Link>
  )
}

/** "by <user> · 3 days ago" with the exact time on hover; `by` null means the system. */
export function AuditInfo({
  by,
  at,
  compact = false,
}: {
  by: { id: string; display_name: string; username: string | null } | null
  at: string
  compact?: boolean
}) {
  const { t } = useTranslation("dashboard")
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {by ? (
        compact ? (
          <span className="truncate">{by.display_name}</span>
        ) : (
          <UserChip user={by} link />
        )
      ) : (
        <span className="text-muted-foreground">{t("audit.system")}</span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <time dateTime={at} tabIndex={0} className="text-xs text-muted-foreground">
            {formatRelative(at)}
          </time>
        </TooltipTrigger>
        <TooltipContent>
          {formatDateTime(at, { dateStyle: "full", timeStyle: "medium" })}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}
