import { useQuery } from "@tanstack/react-query"
import { ShieldAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { apiQuery } from "@/lib/api"
import { useCan } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type PermissionInfo = Pick<
  components["schemas"]["PermissionInfo"],
  "description" | "scope" | "sudo"
>

export function permissionsQuery() {
  return { ...apiQuery("/v1/dash/permissions"), staleTime: 5 * 60_000 }
}

/** `PermissionKey` in mono; hover shows description, scope and the sudo flag. */
export function PermissionChip({
  permission,
  info,
  className,
}: {
  permission: string
  /** Pass when the page already has it (matrix); otherwise it is looked up once per page. */
  info?: PermissionInfo
  className?: string
}) {
  const canRead = useCan("permissions.read", "global") === true
  const code = <code className={cn("font-mono text-xs", className)}>{permission}</code>
  if (!info && !canRead) return code
  return (
    <HoverCard openDelay={350} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          tabIndex={0}
          className="cursor-help rounded-sm underline decoration-dotted underline-offset-4"
        >
          {code}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start">
        <PermissionCard permission={permission} info={info} />
      </HoverCardContent>
    </HoverCard>
  )
}

function PermissionCard({ permission, info }: { permission: string; info?: PermissionInfo }) {
  const { t } = useTranslation("dashboard")
  const query = useQuery({ ...permissionsQuery(), enabled: !info })
  const p: PermissionInfo | undefined = info ?? query.data?.find((x) => x.key === permission)
  return (
    <div className="grid gap-2 text-sm">
      <code className="font-mono text-xs font-semibold">{permission}</code>
      {p ? (
        <>
          <p className="text-muted-foreground">{p.description}</p>
          <p className="flex flex-wrap gap-2 text-xs">
            <span>{t(`permissions.scope.${p.scope}`)}</span>
            {p.sudo && (
              <span className="inline-flex items-center gap-1 text-status-warn-fg">
                <ShieldAlertIcon className="size-3.5" />
                {t("permissions.sudo")}
              </span>
            )}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t("permissions.unknown")}</p>
      )}
    </div>
  )
}
