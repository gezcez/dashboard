import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiQuery } from "@/lib/api"
import { formatDateTime, formatRelative } from "@/lib/format"
import { useCan } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { RoleChip } from "./role-chip"
import { UserStatusBadge } from "./user-status-badge"

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

interface UserLike {
  id: string
  display_name: string
  username: string | null
}

/**
 * Avatar, name and @username. With `link` it goes to the user's page and shows a hover card;
 * the card fetches the user lazily (same query key as the detail page, so it is cached once)
 * and only for viewers who hold users.read.
 */
export function UserChip({
  user,
  link = false,
  className,
}: {
  user: UserLike
  link?: boolean
  className?: string
}) {
  const canRead = useCan("users.read", "global") === true
  const body = (
    <>
      <Avatar className="size-7 text-[0.65rem]">
        <AvatarFallback>{initialsOf(user.display_name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-medium">{user.display_name}</span>
        {user.username && (
          <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
        )}
      </span>
    </>
  )
  const cls = cn("inline-flex max-w-full min-w-0 items-center gap-2", className)
  if (!link || !canRead) return <span className={cls}>{body}</span>
  return (
    <HoverCard openDelay={350} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          to="/admin/users/$userId"
          params={{ userId: user.id }}
          className={cn(cls, "rounded-md hover:underline")}
        >
          {body}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent align="start">
        <UserCard user={user} />
      </HoverCardContent>
    </HoverCard>
  )
}

function UserCard({ user }: { user: UserLike }) {
  const { t } = useTranslation("dashboard")
  const query = useQuery({
    ...apiQuery("/v1/dash/users/{userId}", { params: { path: { userId: user.id } } }),
    staleTime: 60_000,
  })
  const u = query.data
  return (
    <div className="grid gap-3 text-sm">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 rounded-xl">
          <AvatarFallback className="rounded-xl">{initialsOf(user.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.display_name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {user.username ? `@${user.username}` : user.id}
          </p>
        </div>
      </div>
      {!u ? (
        <Skeleton className="h-12" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <UserStatusBadge status={u.status} />
            {u.roles.slice(0, 3).map((a) => (
              <RoleChip
                key={`${String(a.role.id)}:${String(a.network?.id ?? "g")}`}
                role={a.role}
                network={a.network}
                hover={false}
              />
            ))}
            {u.roles.length > 3 && (
              <span className="text-xs text-muted-foreground">+{u.roles.length - 3}</span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-1 text-xs">
            <dt className="text-muted-foreground">{t("user.profile.joined")}</dt>
            <dd>{formatDateTime(u.created_at, { dateStyle: "medium" })}</dd>
            <dt className="text-muted-foreground">{t("user.profile.lastActive")}</dt>
            <dd>{formatRelative(u.last_active_at)}</dd>
          </dl>
        </>
      )}
    </div>
  )
}
