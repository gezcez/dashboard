import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AuthLayout } from "@/components/layout/auth-layout"
import { auth } from "@/auth"
import { i18n } from "@/i18n"

export const Route = createFileRoute("/auth/step-up")({
  component: StepUpPage,
})

const exchanges = new Map<string, Promise<unknown>>()

/**
 * Step-up callback. In popup mode it exchanges the code (rotating gz_rt to the fresh session),
 * tells the opener `{ type: "gz-step-up", ok }` with a strict target origin, and closes. In
 * redirect mode it returns to the page; the dangerous action is not replayed automatically.
 */
function StepUpPage() {
  const { t } = useTranslation("auth")
  const router = useRouter()
  const [state, setState] = useState<"working" | "done" | "failed">("working")

  useEffect(() => {
    const href = window.location.href
    const opener = window.opener as Window | null
    let exchange = exchanges.get(href)
    if (!exchange) {
      exchange = auth.handleCallback(href)
      exchanges.set(href, exchange)
    }
    exchange
      .then((result) => {
        const { returnTo } = result as { returnTo: string }
        if (opener) {
          auth.reportStepUp(true, opener)
          setState("done")
          window.close()
        } else {
          router.history.replace(returnTo)
          toast.success(i18n.t("stepUp.redirected"))
        }
      })
      .catch(() => {
        if (opener) auth.reportStepUp(false, opener)
        setState("failed")
      })
  }, [router])

  return (
    <AuthLayout>
      <p className="font-semibold" role="status">
        {state === "working"
          ? t("stepUp.working")
          : state === "done"
            ? t("stepUp.done")
            : t("stepUp.failed")}
      </p>
    </AuthLayout>
  )
}
