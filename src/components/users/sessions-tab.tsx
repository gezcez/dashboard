import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOutIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { ErrorState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatRelative } from "@/lib/format"
import { useCan } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"

type Session = components["schemas"]["UserSession"]
type Target = { kind: "one"; session: Session } | { kind: "all" }

/** SSO sessions and refresh-token families per app (plan 6.8). IPs arrive truncated to /24. */
export function SessionsTab({ user }: { user: { id: string; display_name: string } }) {
  const { t } = useTranslation("dashboard")
  const canRevoke = useCan("users.sessions.revoke", "global") === true
  const query = useQuery(
    apiQuery("/v1/dash/users/{userId}/sessions", { params: { path: { userId: user.id } } }),
  )
  const [target, setTarget] = useState<Target | null>(null)

  if (query.error)
    return (
      <ErrorState
        message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
        requestId={isApiError(query.error) ? query.error.requestId : null}
        onRetry={() => void query.refetch()}
      />
    )
  if (!query.data) return <Skeleton className="h-48 rounded-2xl" />
  const sessions = query.data

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("user.sessions.summary", { count: sessions.length })}
        </p>
        {canRevoke && sessions.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setTarget({ kind: "all" })
            }}
          >
            <LogOutIcon />
            {t("user.sessions.revokeAll")}
          </Button>
        )}
      </div>
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("user.sessions.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <caption className="sr-only">{t("user.tabs.sessions")}</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("user.sessions.app")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("user.sessions.device")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("user.sessions.ip")}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("user.sessions.lastUsed")}
                </TableHead>
                <TableHead className="hidden lg:table-cell">{t("user.sessions.expires")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("user.sessions.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.kind === "sso" ? "brand" : "outline"}>
                        {t(`user.sessions.kinds.${s.kind}`)}
                      </Badge>
                      <span className="font-medium">{s.app?.name ?? t("user.sessions.sso")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("user.sessions.created", { when: formatDateTime(s.created_at) })}
                    </span>
                  </TableCell>
                  <TableCell className="hidden whitespace-normal md:table-cell">
                    {s.device}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs lg:table-cell">
                    {s.ip_prefix ?? "–"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span title={formatDateTime(s.last_used_at)}>
                      {formatRelative(s.last_used_at)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDateTime(s.expires_at, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="text-right">
                    {canRevoke && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTarget({ kind: "one", session: s })
                        }}
                      >
                        {t("user.sessions.revoke")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <RevokeDialog
        user={user}
        target={target}
        count={sessions.length}
        onClose={() => {
          setTarget(null)
        }}
      />
    </div>
  )
}

/** L2 with a required reason; "revoke all" is also sudo (x-gezcez-sudo). */
function RevokeDialog({
  user,
  target,
  count,
  onClose,
}: {
  user: { id: string; display_name: string }
  target: Target | null
  count: number
  onClose: () => void
}) {
  const { t } = useTranslation("dashboard")
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const revoke = useMutation({
    mutationFn: ({ target, reason }: { target: Target; reason: string }) =>
      target.kind === "all"
        ? sudo(() =>
            callApi("post", "/v1/dash/users/{userId}/sessions/revoke-all", {
              params: { path: { userId: user.id } },
              body: { reason },
            }),
          )
        : callApi("delete", "/v1/dash/users/{userId}/sessions/{sessionId}", {
            params: { path: { userId: user.id, sessionId: target.session.id } },
            body: { reason },
          }),
    onSuccess: ({ revoked }) => {
      toast.success(t("user.sessions.revoked", { count: revoked }))
      onClose()
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/users/{userId}/sessions"),
  })
  const error =
    revoke.error && !isSudoCancelled(revoke.error)
      ? isApiError(revoke.error)
        ? apiErrorMessage(revoke.error)
        : t("user.sessions.failed")
      : null
  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          revoke.reset()
          onClose()
        }
      }}
      title={
        target?.kind === "all"
          ? t("user.sessions.revokeAllTitle", { name: user.display_name })
          : t("user.sessions.revokeTitle")
      }
      effect={
        target?.kind === "all"
          ? t("user.sessions.revokeAllEffect", { name: user.display_name, count })
          : t("user.sessions.revokeEffect", {
              app: target?.session.app?.name ?? t("user.sessions.sso"),
              device: target?.session.device ?? "",
            })
      }
      reasonLabel={t("user.sessions.reason")}
      confirmLabel={
        target?.kind === "all" ? t("user.sessions.revokeAll") : t("user.sessions.revoke")
      }
      pending={revoke.isPending}
      error={error}
      onConfirm={(reason) => {
        if (target) revoke.mutate({ target, reason })
      }}
    />
  )
}
