import { useLocation, useNavigate } from "@tanstack/react-router"
import { CircleAlertIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/auth/react"

/**
 * Background session loss keeps the page and its state: a refresh failure shows a banner, and
 * signing in again returns to the same path. Sign-out from another tab goes to the signed-out page.
 */
export function SessionBanner() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expired, setExpired] = useState(false)

  useEffect(
    () =>
      auth.onEvent((event) => {
        if (event.type === "signed_out" && event.reason === "expired") setExpired(true)
        if (event.type === "signed_out" && event.reason === "user")
          void navigate({ to: "/auth/logged-out" })
        if (event.type === "signed_in" || event.type === "refreshed") setExpired(false)
      }),
    [auth, navigate],
  )

  if (!expired) return null
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 border-b bg-accent px-4 py-2.5 text-sm text-accent-foreground sm:px-6"
    >
      <CircleAlertIcon className="size-4 shrink-0" />
      <span className="flex-1">{t("session.expired")}</span>
      <Button size="sm" onClick={() => void auth.login({ returnTo: location.href })}>
        {t("session.signInAgain")}
      </Button>
    </div>
  )
}
