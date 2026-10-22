import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { LockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { apiQuery } from "@/lib/api"
import { formatNumber } from "@/lib/format"
import { useCan } from "@/lib/permissions"

type RoleRef = components["schemas"]["RoleRef"]
type NetworkRef = components["schemas"]["NetworkRef"]

/** One cached list of roles feeds every role hover card on the page (a batched lookup). */
export function rolesQuery() {
  return { ...apiQuery("/v1/dash/roles"), staleTime: 60_000 }
}

/** Role badge; with roles.read it links to the role and shows level, description and counts. */
export function RoleChip({
  role,
  network,
  hover = true,
  onRemove,
  removeLabel,
}: {
  role: RoleRef
  network?: NetworkRef | null
  hover?: boolean
  onRemove?: () => void
  removeLabel?: string
}) {
  const canRead = useCan("roles.read", "global") === true
  const label = (
    <>
      {role.name}
      {network !== undefined && (
        <span className="font-normal text-muted-foreground">
          {" · "}
          {network ? network.name : "global"}
        </span>
      )}
    </>
  )
  const badge = (
    <Badge variant="outline" className="gap-1 bg-card">
      {canRead ? (
        <Link to="/admin/roles/$roleId" params={{ roleId: role.id }} className="hover:underline">
          {label}
        </Link>
      ) : (
        label
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 ml-0.5 rounded-full px-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          ×
        </button>
      )}
    </Badge>
  )
  if (!hover || !canRead) return badge
  return (
    <HoverCard openDelay={350} closeDelay={100}>
      <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
      <HoverCardContent align="start">
        <RoleCard role={role} />
      </HoverCardContent>
    </HoverCard>
  )
}

function RoleCard({ role }: { role: RoleRef }) {
  const { t } = useTranslation("dashboard")
  const { data } = useQuery(rolesQuery())
  const full = data?.find((r) => r.id === role.id)
  return (
    <div className="grid gap-2 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        {role.name}
        {full?.immutable && <LockIcon className="size-3.5 text-muted-foreground" />}
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        {role.key} · {t("roles.level", { level: role.level })}
      </p>
      {full && (
        <>
          <p className="text-muted-foreground">{full.description}</p>
          <p className="text-xs">
            {t("roles.chip.counts", {
              members: formatNumber(full.member_count),
              permissions: formatNumber(full.permission_count),
            })}
          </p>
        </>
      )}
    </div>
  )
}
