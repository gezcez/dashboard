import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Logo } from "@/components/ui/logo"

export const Route = createFileRoute("/")({
  component: ScaffoldHome,
})

function ScaffoldHome() {
  const { t } = useTranslation()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface-cream p-6 text-center">
      <Logo />
      <Eyebrow>{t("comingSoon")}</Eyebrow>
      <h1 className="text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
      <Button asChild variant="outline">
        <Link to="/ui-kit">{t("nav.uiKit")}</Link>
      </Button>
    </main>
  )
}
