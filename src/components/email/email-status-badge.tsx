import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { Badge } from "@/components/ui/badge"

type EmailStatus = components["schemas"]["EmailStatus"]

export const EMAIL_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "complained",
  "failed",
] as const satisfies EmailStatus[]

const VARIANT = {
  queued: "default",
  sent: "default",
  delivered: "ok",
  bounced: "error",
  complained: "warn",
  failed: "error",
} as const satisfies Record<EmailStatus, string>

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const { t } = useTranslation("dashboard")
  return <Badge variant={VARIANT[status]}>{t(`email.status.${status}`)}</Badge>
}
