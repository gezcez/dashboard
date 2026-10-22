import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { Badge } from "@/components/ui/badge"

type Action = components["schemas"]["ModerationAction"]["action"]

export const MODERATION_ACTIONS = ["ban", "unban", "warn", "note"] as const satisfies Action[]

const VARIANT = { ban: "error", unban: "ok", warn: "warn", note: "default" } as const

export function ModerationBadge({ action }: { action: Action }) {
  const { t } = useTranslation("dashboard")
  return <Badge variant={VARIANT[action]}>{t(`moderation.actions.${action}`)}</Badge>
}
