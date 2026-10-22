import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { auth, isAuthError, type AuthErrorKind, type CallbackResult } from "@/auth"

export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
})

// One exchange per callback URL, even when React StrictMode mounts the effect twice.
const exchanges = new Map<string, Promise<CallbackResult>>()

function CallbackPage() {
  const { t } = useTranslation("auth")
  const router = useRouter()
  const [error, setError] = useState<AuthErrorKind | null>(null)

  useEffect(() => {
    const href = window.location.href
    let exchange = exchanges.get(href)
    if (!exchange) {
      exchange = auth.handleCallback(href)
      exchanges.set(href, exchange)
    }
    exchange
      .then(({ returnTo }) => router.history.replace(returnTo))
      .catch((e: unknown) => setError(isAuthError(e) ? e.kind : "server"))
  }, [router])

  if (!error) {
    return (
      <AuthLayout>
        <p className="font-semibold" role="status">
          {t("callback.working")}
        </p>
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </AuthLayout>
    )
  }
  return (
    <AuthLayout>
      <h1 className="text-xl font-bold tracking-tight">{t("callback.failedTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t(`callback.errors.${error}`)}</p>
      <Button className="mt-6 w-full" onClick={() => void auth.login({ returnTo: "/" })}>
        {t("callback.tryAgain")}
      </Button>
    </AuthLayout>
  )
}
