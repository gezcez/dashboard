import { LockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { Badge } from "@/components/ui/badge"

type AppLike = Pick<
  components["schemas"]["AppListItem"],
  "type" | "platform" | "first_party" | "system"
>

/** Type, platform, first-party and system flags as compact badges. */
export function AppBadges({ app }: { app: AppLike }) {
  const { t } = useTranslation("dashboard")
  return (
    <span className="flex flex-wrap gap-1">
      <Badge variant={app.type === "confidential" ? "brand" : "outline"}>
        {t(`apps.types.${app.type}`)}
      </Badge>
      <Badge variant="outline">{t(`apps.platforms.${app.platform}`)}</Badge>
      {app.first_party && <Badge variant="warn">{t("apps.firstParty")}</Badge>}
      {app.system && (
        <Badge variant="default">
          <LockIcon />
          {t("apps.system")}
        </Badge>
      )}
    </span>
  )
}
