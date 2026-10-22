import { createFileRoute } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/ui/eyebrow"
import { useAuth } from "@/auth/react"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
})

/**
 * Sign-in entry. When a protected route bounced here (`?redirect=`), the authorize redirect starts
 * immediately, as the contract's requireAuth does; visited directly it waits for the button.
 */
function LoginPage() {
  const { t } = useTranslation("auth")
  const auth = useAuth()
  const { redirect } = Route.useSearch()
  const [starting, setStarting] = useState(false)
  const started = useRef(false)

  const start = () => {
    if (started.current) return
    started.current = true
    setStarting(true)
    void auth.login({ returnTo: redirect ?? "/" }).catch(() => {
      started.current = false
      setStarting(false)
    })
  }

  useEffect(() => {
    if (redirect) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, [])

  return (
    <AuthLayout footer={t("login.footer")}>
      <Eyebrow>{t("login.eyebrow")}</Eyebrow>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{t("login.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("login.body")}</p>
      <Button size="lg" className="mt-6 w-full" onClick={start} disabled={starting}>
        {starting ? t("login.redirecting") : t("login.button")}
        {!starting && <ArrowRightIcon />}
      </Button>
    </AuthLayout>
  )
}
