import { createFileRoute, notFound } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { AuthLayout } from "@/components/layout/auth-layout"
import { isMock } from "@/env"
import { mockSession } from "@/mocks/session"

/** Mock builds only: stands in for oauth.gezcez.com/logout (ends the mock identity session). */
export const Route = createFileRoute("/mock/logout")({
  validateSearch: z.object({ post_logout_redirect_uri: z.string().optional() }),
  beforeLoad: () => {
    if (!isMock) throw notFound()
  },
  component: MockLogout,
})

function MockLogout() {
  const { t } = useTranslation("auth")
  const { post_logout_redirect_uri } = Route.useSearch()
  useEffect(() => {
    mockSession.set(null)
    let target = "/auth/logged-out"
    try {
      const url = new URL(post_logout_redirect_uri ?? "")
      if (url.origin === window.location.origin) target = url.pathname
    } catch {
      // keep default
    }
    window.location.replace(target)
  }, [post_logout_redirect_uri])
  return (
    <AuthLayout>
      <p role="status">{t("mock.loggingOut")}</p>
    </AuthLayout>
  )
}
