import { Link, useParams } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "profile", to: "/n/$network/catalog" },
  { key: "routes", to: "/n/$network/catalog/routes" },
  { key: "stops", to: "/n/$network/catalog/stops" },
  { key: "issues", to: "/n/$network/catalog/issues" },
] as const

export type CatalogTab = (typeof TABS)[number]["key"]

/** Section tabs shared by the catalogue pages. */
export function CatalogTabs({ active }: { active: CatalogTab }) {
  const { t } = useTranslation("ops")
  const { network } = useParams({ from: "/_app/n/$network" })
  return (
    <nav aria-label={t("catalog.tabsLabel")} className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          params={{ network }}
          aria-current={tab.key === active ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            tab.key === active &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {t(`catalog.tabs.${tab.key}`)}
        </Link>
      ))}
    </nav>
  )
}
