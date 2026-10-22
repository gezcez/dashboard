import { Link } from "@tanstack/react-router"
import { CompassIcon, InboxIcon, LockIcon, TriangleAlertIcon, UserRoundXIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateCard } from "./state-card"

export function ForbiddenState({
  permission,
  network,
}: {
  permission: string
  network?: string | null
}) {
  const { t } = useTranslation()
  const code = (
    <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-sm text-foreground" />
  )
  return (
    <StateCard
      icon={LockIcon}
      title={t("states.forbiddenTitle")}
      actions={
        <Button asChild variant="outline">
          <Link to="/">{t("goHome")}</Link>
        </Button>
      }
    >
      <p>
        {network ? (
          <Trans
            i18nKey="states.forbiddenBodyNetwork"
            values={{ permission, network }}
            components={{ code }}
          />
        ) : (
          <Trans i18nKey="states.forbiddenBody" values={{ permission }} components={{ code }} />
        )}
      </p>
      <p className="mt-2 text-sm">{t("states.forbiddenHint")}</p>
    </StateCard>
  )
}

export function NotFoundState({ title, body }: { title?: string; body?: string }) {
  const { t } = useTranslation()
  return (
    <StateCard
      icon={CompassIcon}
      title={title ?? t("states.notFoundTitle")}
      actions={
        <Button asChild variant="outline">
          <Link to="/">{t("goHome")}</Link>
        </Button>
      }
    >
      {body ?? t("states.notFoundBody")}
    </StateCard>
  )
}

export function ErrorState({
  message,
  requestId,
  onRetry,
}: {
  message?: string
  requestId?: string | null
  onRetry?: () => void
}) {
  const { t } = useTranslation()
  return (
    <StateCard
      icon={TriangleAlertIcon}
      title={t("states.errorTitle")}
      actions={onRetry && <Button onClick={onRetry}>{t("retry")}</Button>}
    >
      <p>{message ?? t("states.errorBody")}</p>
      {requestId && <p className="mt-2 font-mono text-xs">{t("requestId", { id: requestId })}</p>}
    </StateCard>
  )
}

export function EmptyState({
  title,
  children,
  actions,
}: {
  title?: string
  children?: ReactNode
  actions?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <StateCard
      icon={InboxIcon}
      tone="muted"
      title={title ?? t("states.emptyTitle")}
      actions={actions}
      className="max-w-none"
    >
      {children}
    </StateCard>
  )
}

export function NoRolesState() {
  const { t } = useTranslation()
  return (
    <StateCard icon={UserRoundXIcon} title={t("states.noRolesTitle")}>
      {t("states.noRolesBody")}
    </StateCard>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
