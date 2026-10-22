import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { Badge } from "@/components/ui/badge"

type UserStatus = components["schemas"]["UserStatus"]

const VARIANT = {
  active: "ok",
  unverified: "outline",
  banned: "error",
  pending_deletion: "warn",
} as const satisfies Record<UserStatus, string>

export const USER_STATUSES = Object.keys(VARIANT) as UserStatus[]

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { t } = useTranslation("dashboard")
  return <Badge variant={VARIANT[status]}>{t(`userStatus.${status}`)}</Badge>
}
