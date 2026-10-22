import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { ScrollTextIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { AuditDetail, useAuditColumns } from "@/components/audit/audit-columns"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { EmailStatusBadge } from "@/components/email/email-status-badge"
import { AuditInfo } from "@/components/entity/misc-chips"
import { ModerationBadge } from "@/components/entity/moderation-badge"
import { EmptyState, ErrorState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiQuery } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatRelative } from "@/lib/format"
import { useCan } from "@/lib/permissions"

type Delivery = components["schemas"]["EmailDelivery"]

/** Audit entries where the user is actor or target (plan 6.8). Paging is local to the tab. */
export function ActivityTab({ userId }: { userId: string }) {
  const { t } = useTranslation("dashboard")
  const [cursor, setCursor] = useState<string>()
  const query = useQuery({
    ...apiQuery("/v1/dash/users/{userId}/activity", {
      params: { path: { userId }, query: { limit: 25, cursor } },
    }),
    placeholderData: keepPreviousData,
  })
  const columns = useAuditColumns()
  const canAudit = useCan("audit.read", "global") === true
  return (
    <div className="grid gap-3">
      {canAudit && (
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/audit" search={{ target_id: userId }}>
              <ScrollTextIcon />
              {t("user.profile.openAudit")}
            </Link>
          </Button>
        </div>
      )}
      <DataTable
        caption={t("user.tabs.activity")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(e) => e.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        renderDetail={(e) => <AuditDetail entry={e} />}
        empty={<EmptyState title={t("user.activity.empty")} />}
        footer={<CursorPager page={query.data} onCursor={setCursor} />}
      />
    </div>
  )
}

/** Deliveries to this user: metadata only, OTP and activation content is never stored. */
export function EmailsTab({ userId }: { userId: string }) {
  const { t } = useTranslation("dashboard")
  const [cursor, setCursor] = useState<string>()
  const query = useQuery({
    ...apiQuery("/v1/dash/users/{userId}/emails", {
      params: { path: { userId }, query: { limit: 25, cursor } },
    }),
    placeholderData: keepPreviousData,
  })
  const columns = useMemo<ColumnDef<Delivery>[]>(
    () => [
      {
        id: "created_at",
        header: t("email.columns.sent"),
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.created_at)} className="text-muted-foreground">
            {formatRelative(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "template",
        header: t("email.columns.template"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => <code className="font-mono text-xs">{row.original.template}</code>,
      },
      {
        id: "subject",
        header: t("email.columns.subject"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => <span className="block truncate">{row.original.subject}</span>,
      },
      {
        id: "status",
        header: t("email.columns.status"),
        cell: ({ row }) => <EmailStatusBadge status={row.original.status} />,
      },
    ],
    [t],
  )
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">{t("user.emails.note")}</p>
      <DataTable
        caption={t("user.tabs.emails")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(d) => d.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={<EmptyState title={t("user.emails.empty")} />}
        footer={<CursorPager page={query.data} onCursor={setCursor} />}
      />
    </div>
  )
}

/** KVKK/GDPR export and deletion requests. Admins see them; they don't create them. */
export function PrivacyTab({ userId }: { userId: string }) {
  const { t } = useTranslation("dashboard")
  const query = useQuery(
    apiQuery("/v1/dash/users/{userId}/privacy", { params: { path: { userId } } }),
  )
  if (query.error)
    return (
      <ErrorState
        message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
        requestId={isApiError(query.error) ? query.error.requestId : null}
        onRetry={() => void query.refetch()}
      />
    )
  if (!query.data) return <Skeleton className="h-48 rounded-2xl" />
  const { deletion, exports } = query.data
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("user.privacy.deletion")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {deletion ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt className="text-muted-foreground">{t("user.privacy.status")}</dt>
              <dd>
                <Badge
                  variant={
                    deletion.status === "scheduled"
                      ? "warn"
                      : deletion.status === "completed"
                        ? "error"
                        : "default"
                  }
                >
                  {t(`user.privacy.deletionStatus.${deletion.status}`)}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">{t("user.privacy.requested")}</dt>
              <dd>{formatDateTime(deletion.requested_at)}</dd>
              <dt className="text-muted-foreground">{t("user.privacy.deleteAfter")}</dt>
              <dd>{formatDateTime(deletion.delete_after, { dateStyle: "medium" })}</dd>
            </dl>
          ) : (
            <p className="text-muted-foreground">{t("user.privacy.noDeletion")}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("user.privacy.exports")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {exports.length === 0 ? (
            <p className="text-muted-foreground">{t("user.privacy.noExports")}</p>
          ) : (
            <ul className="grid gap-2">
              {exports.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {formatDateTime(e.requested_at, { dateStyle: "medium" })}
                    {e.expires_at && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t("user.privacy.expires", {
                          date: formatDateTime(e.expires_at, { dateStyle: "medium" }),
                        })}
                      </span>
                    )}
                  </span>
                  <Badge
                    variant={
                      e.status === "ready" ? "ok" : e.status === "failed" ? "error" : "default"
                    }
                  >
                    {t(`user.privacy.exportStatus.${e.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Past moderation actions for one user, newest first (needs moderation.read). */
export function ModerationHistory({ userId }: { userId: string }) {
  const { t } = useTranslation("dashboard")
  const query = useQuery(
    apiQuery("/v1/dash/moderation", { params: { query: { q: userId, limit: 50 } } }),
  )
  const items = query.data?.items.filter((m) => m.user.id === userId)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("user.moderation.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!items ? (
          <Skeleton className="h-24" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("user.moderation.noHistory")}</p>
        ) : (
          <ol className="grid gap-3 border-l pl-4">
            {items.map((m) => (
              <li key={m.id} className="relative text-sm">
                <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border" />
                <div className="flex flex-wrap items-center gap-2">
                  <ModerationBadge action={m.action} />
                  {m.active && <Badge variant="outline">{t("moderation.active")}</Badge>}
                  <AuditInfo by={m.by} at={m.at} compact />
                </div>
                {m.public_reason && <p className="mt-1">{m.public_reason}</p>}
                {m.private_reason && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.private_reason}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
