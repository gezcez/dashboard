import { CheckIcon, TriangleAlertIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { BindingStatusView } from "@/api/realtime-types"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, formatDuration, formatRelative } from "@/lib/format"
import { useNow } from "@/lib/use-now"

type Credentials = NonNullable<BindingStatusView["credentials"]>

const VARIANT = {
  ok: "ok",
  refreshing: "brand",
  missing: "error",
  auth_failed: "error",
  unknown: "default",
} as const

/** Upstream token state with its expiry countdown; the token itself is never shown or sent. */
export function CredentialsBadge({ credentials }: { credentials: Credentials | null }) {
  const { t } = useTranslation("ops")
  const now = useNow(1000)
  if (!credentials) return <span className="text-muted-foreground">{t("tracker.token.none")}</span>
  const left = credentials.expires_at
    ? Math.round((Date.parse(credentials.expires_at) - now) / 1000)
    : null
  return (
    <Badge variant={VARIANT[credentials.state]} title={formatDateTime(credentials.expires_at)}>
      {t(`tracker.token.states.${credentials.state}`)}
      {left !== null && left > 0 && ` · ${formatDuration(left)}`}
    </Badge>
  )
}

/** Token tab body: realm, refresh history and which secrets the backend has (names only). */
export function CredentialsPanel({ credentials }: { credentials: Credentials | null }) {
  const { t } = useTranslation("ops")
  if (!credentials)
    return <p className="text-sm text-muted-foreground">{t("tracker.token.notNeeded")}</p>
  const rows: [string, ReactNode][] = [
    [t("tracker.token.state"), <CredentialsBadge key="s" credentials={credentials} />],
    [t("tracker.token.realm"), <span key="r" className="font-mono text-xs">{credentials.realm}</span>],
    [t("tracker.token.expires"), formatDateTime(credentials.expires_at)],
    [t("tracker.token.refreshed"), formatRelative(credentials.refreshed_at)],
    [t("tracker.token.failures"), String(credentials.failures)],
  ]
  const secrets = Object.entries(credentials.secrets_set)
  return (
    <div className="grid gap-4">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t("tracker.token.secrets")}</h3>
        <p className="mb-2 text-xs text-muted-foreground">{t("tracker.token.secretsHint")}</p>
        <ul className="grid gap-1">
          {secrets.map(([name, set]) => (
            <li key={name} className="flex items-center gap-2 text-sm">
              {set ? (
                <CheckIcon className="size-4 text-status-ok" aria-hidden />
              ) : (
                <TriangleAlertIcon className="size-4 text-status-warn" aria-hidden />
              )}
              <code className="font-mono text-xs">{name}</code>
              {!set && <Badge variant="warn">{t("tracker.token.missing")}</Badge>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
