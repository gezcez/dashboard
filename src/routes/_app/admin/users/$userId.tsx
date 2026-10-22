import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeftIcon, BanIcon, EyeIcon, ScrollTextIcon, ShieldCheckIcon } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { initialsOf, UserChip } from "@/components/entity/user-chip"
import { UserStatusBadge } from "@/components/entity/user-status-badge"
import { ErrorState, NotFoundState } from "@/components/states/states"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BanDialog } from "@/components/users/ban-dialog"
import {
  ActivityTab,
  EmailsTab,
  ModerationHistory,
  PrivacyTab,
} from "@/components/users/history-tabs"
import { RolesTab } from "@/components/users/roles-tab"
import { SessionsTab } from "@/components/users/sessions-tab"
import { UnbanDialog } from "@/components/users/unban-dialog"
import { apiQuery, callApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { can, useCan, type PermissionKey } from "@/lib/permissions"
import { useMe } from "@/lib/me"

type DashUser = components["schemas"]["DashUser"]

const TABS = [
  "profile",
  "roles",
  "sessions",
  "activity",
  "emails",
  "privacy",
  "moderation",
] as const
type Tab = (typeof TABS)[number]

/** Each tab reads one endpoint; a tab is hidden when its permission is missing. */
const TAB_PERMISSION: Partial<Record<Tab, PermissionKey>> = {
  sessions: "users.sessions.revoke",
  activity: "audit.read",
  emails: "email.read",
}

const userQuery = (userId: string) =>
  apiQuery("/v1/dash/users/{userId}", { params: { path: { userId } } })

export const Route = createFileRoute("/_app/admin/users/$userId")({
  staticData: { pageId: "admin.users" },
  validateSearch: z.object({ tab: z.enum(TABS).optional().catch(undefined) }),
  beforeLoad: ({ context }) => assertPage("admin.users", context),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.query(userQuery(params.userId))
    } catch (error) {
      if (isApiError(error, "NOT_FOUND")) throw notFound()
      // Other errors render inline with a retry.
    }
  },
  notFoundComponent: UserNotFound,
  component: UserPage,
})

function UserNotFound() {
  const { t } = useTranslation("dashboard")
  return <NotFoundState title={t("user.notFoundTitle")} body={t("user.notFoundBody")} />
}

function UserPage() {
  const { t } = useTranslation("dashboard")
  const { userId } = Route.useParams()
  const { tab = "profile" } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery(userQuery(userId))
  const canModerate = useCan("moderation.write", "global") === true
  const { data: me } = useMe()
  const tabs = TABS.filter((id) => {
    const key = TAB_PERMISSION[id]
    return !key || can(me, key, "global") === true
  })
  const [dialog, setDialog] = useState<"ban" | "unban" | null>(null)

  const back = (
    <Link
      to="/admin/users"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      {t("user.back")}
    </Link>
  )

  if (query.isPending) {
    return (
      <>
        {back}
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="grid gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </>
    )
  }
  if (query.error) {
    return (
      <>
        {back}
        <ErrorState
          message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
          requestId={isApiError(query.error) ? query.error.requestId : null}
          onRetry={() => void query.refetch()}
        />
      </>
    )
  }

  const user = query.data
  const banned = user.ban !== null

  return (
    <>
      {back}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 rounded-2xl text-lg">
            <AvatarFallback className="rounded-2xl">{initialsOf(user.display_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Eyebrow>{t("user.eyebrow")}</Eyebrow>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
              <span className="truncate">{user.display_name}</span>
              <UserStatusBadge status={user.status} />
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {user.username ? `@${user.username} · ` : ""}
              {user.id}
            </p>
          </div>
        </div>
        {/* The moderation tab has its own ban and lift-ban button. */}
        {canModerate && tab !== "moderation" && (
          <div className="flex gap-2">
            {banned ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDialog("unban")
                }}
              >
                <ShieldCheckIcon />
                {t("user.unban.action")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => {
                  setDialog("ban")
                }}
              >
                <BanIcon />
                {t("user.ban.action")}
              </Button>
            )}
          </div>
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          void navigate({
            search: { tab: value === "profile" ? undefined : (value as Tab) },
            replace: true,
          })
        }
      >
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((id) => (
            <TabsTrigger key={id} value={id}>
              {t(`user.tabs.${id}`)}
              {id === "roles" && (
                <Badge variant="outline" className="ml-1.5 px-1.5 py-0">
                  {user.roles.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RolesTab user={user} />
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <SessionsTab user={user} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab userId={user.id} />
        </TabsContent>
        <TabsContent value="emails" className="mt-4">
          <EmailsTab userId={user.id} />
        </TabsContent>
        <TabsContent value="privacy" className="mt-4">
          <PrivacyTab userId={user.id} />
        </TabsContent>
        <TabsContent value="moderation" className="mt-4">
          <ModerationTab
            user={user}
            canModerate={canModerate}
            onBan={() => {
              setDialog("ban")
            }}
            onUnban={() => {
              setDialog("unban")
            }}
          />
        </TabsContent>
      </Tabs>

      <BanDialog
        user={user}
        open={dialog === "ban"}
        onOpenChange={(open) => {
          setDialog(open ? "ban" : null)
        }}
      />
      <UnbanDialog
        user={user}
        open={dialog === "unban"}
        onOpenChange={(open) => {
          setDialog(open ? "unban" : null)
        }}
      />
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}

function ProfileTab({ user }: { user: DashUser }) {
  const { t } = useTranslation("dashboard")
  const canAudit = useCan("audit.read", "global") === true
  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("user.profile.account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <Field label={t("user.profile.displayName")}>{user.display_name}</Field>
            <Field label={t("user.profile.username")}>
              {user.username ? `@${user.username}` : <NotSet />}
            </Field>
            <Field label={t("user.profile.email")}>
              <EmailField user={user} />
            </Field>
            <Field label={t("user.profile.language")}>
              {t(`user.profile.locales.${user.locale}`)}
            </Field>
            <Field label={t("user.profile.joined")}>{formatDateTime(user.created_at)}</Field>
            <Field label={t("user.profile.lastActive")}>
              <span title={formatDateTime(user.last_active_at)}>
                {formatRelative(user.last_active_at)}
              </span>
            </Field>
          </dl>
        </CardContent>
      </Card>
      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("user.profile.signIn")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              <MethodBadge
                on={user.methods.email_code}
                label={
                  user.methods.email_code
                    ? t("user.profile.methods.emailCode")
                    : t("user.profile.methods.noEmailCode")
                }
              />
              <MethodBadge
                on={user.methods.password}
                label={
                  user.methods.password
                    ? t("user.profile.methods.password")
                    : t("user.profile.methods.noPassword")
                }
              />
              <MethodBadge
                on={user.methods.passkeys > 0}
                label={
                  user.methods.passkeys > 0
                    ? t("user.profile.methods.passkeys", { count: user.methods.passkeys })
                    : t("user.profile.methods.noPasskeys")
                }
              />
            </ul>
          </CardContent>
        </Card>
        {canAudit && (
          <Card>
            <CardHeader>
              <CardTitle>{t("user.profile.activity")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">{t("user.profile.activityBody")}</p>
              <div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/audit" search={{ target_id: user.id }}>
                    <ScrollTextIcon />
                    {t("user.profile.openAudit")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/** A method the user has not set up is plain muted text, not a struck-through chip. */
function MethodBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <li>
      {on ? (
        <Badge variant="ok">{label}</Badge>
      ) : (
        <span className="inline-flex px-1 py-0.5 text-xs text-muted-foreground">{label}</span>
      )}
    </li>
  )
}

function NotSet() {
  const { t } = useTranslation()
  return <span className="text-muted-foreground">{t("notSet")}</span>
}

/** Masked by default; revealing needs users.pii.read and is audit-logged on the server. */
function EmailField({ user }: { user: DashUser }) {
  const { t } = useTranslation("dashboard")
  const canReveal = useCan("users.pii.read", "global") === true
  const reveal = useMutation({
    mutationFn: () =>
      callApi("post", "/v1/dash/users/{userId}/reveal-email", {
        params: { path: { userId: user.id } },
      }),
    onError: (error) => {
      toast.error(isApiError(error) ? apiErrorMessage(error) : t("user.profile.revealFailed"))
    },
  })
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs">{reveal.data?.email ?? user.email_masked}</span>
      {user.email_verified ? (
        <Badge variant="ok">{t("user.profile.verified")}</Badge>
      ) : (
        <Badge variant="warn">{t("user.profile.unverified")}</Badge>
      )}
      {canReveal && !reveal.data && (
        <Button
          variant="link"
          size="sm"
          className="h-auto"
          disabled={reveal.isPending}
          onClick={() => {
            reveal.mutate()
          }}
          title={t("user.profile.revealHint")}
        >
          <EyeIcon />
          {t("user.profile.reveal")}
        </Button>
      )}
    </span>
  )
}

function ModerationTab({
  user,
  canModerate,
  onBan,
  onUnban,
}: {
  user: DashUser
  canModerate: boolean
  onBan: () => void
  onUnban: () => void
}) {
  const { t } = useTranslation("dashboard")
  const canRead = useCan("moderation.read", "global") === true
  const ban = user.ban
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {ban ? t("user.moderation.banned") : t("user.moderation.notBanned")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ban ? (
            <dl className="divide-y">
              <Field label={t("user.moderation.until")}>
                {ban.until ? formatDateTime(ban.until) : t("user.ban.durations.permanent")}
              </Field>
              <Field label={t("user.moderation.publicReason")}>{ban.public_reason}</Field>
              <Field label={t("user.moderation.privateReason")}>
                {ban.private_reason ?? <NotSet />}
              </Field>
              <Field label={t("user.moderation.by")}>
                {ban.created_by ? <UserChip user={ban.created_by} link /> : t("user.roles.system")}
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatDateTime(ban.created_at)}
                </span>
              </Field>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{t("user.moderation.notBannedBody")}</p>
          )}
          {canModerate && (
            <div className="mt-4">
              {ban ? (
                <Button variant="outline" onClick={onUnban}>
                  <ShieldCheckIcon />
                  {t("user.unban.action")}
                </Button>
              ) : (
                <Button variant="destructive" onClick={onBan}>
                  <BanIcon />
                  {t("user.ban.action")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {canRead && <ModerationHistory userId={user.id} />}
    </div>
  )
}
