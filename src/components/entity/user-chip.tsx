import { Link } from "@tanstack/react-router"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/** Avatar, name and @username; links to the user's page when `link` is set. */
export function UserChip({
  user,
  link = false,
  className,
}: {
  user: { id: string; display_name: string; username: string | null }
  link?: boolean
  className?: string
}) {
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
  return link ? (
    <Link
      to="/admin/users/$userId"
      params={{ userId: user.id }}
      className={cn(cls, "rounded-md hover:underline")}
    >
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  )
}
