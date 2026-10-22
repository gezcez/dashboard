import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/ui/eyebrow"
import { useAuth } from "@/auth/react"

export const Route = createFileRoute("/auth/logged-out")({
  component: LoggedOutPage,
})

function LoggedOutPage() {
  const { t } = useTranslation("auth")
  const auth = useAuth()
  return (
    <AuthLayout>
      <Eyebrow>{t("login.eyebrow")}</Eyebrow>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{t("loggedOut.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("loggedOut.body")}</p>
      <Button size="lg" className="mt-6 w-full" onClick={() => void auth.login({ returnTo: "/" })}>
        {t("loggedOut.signIn")}
      </Button>
    </AuthLayout>
  )
}
