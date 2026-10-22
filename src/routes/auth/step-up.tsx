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
 * Step-up callback. In a popup it exchanges the code (rotating gz_rt to the fresh session),
 * reports `{ ok, state }` to the waiting tab and closes. The identity pages send COOP
 * same-origin, so `window.opener` is usually null here: the transaction's popup flag says which
 * mode this is, and the result goes over BroadcastChannel (postMessage only when an opener
 * survives). In redirect mode it returns to the page; the action is not replayed automatically.
 */
function StepUpPage() {
  const { t } = useTranslation("auth")
  const router = useRouter()
  const [state, setState] = useState<"working" | "done" | "failed">("working")

  useEffect(() => {
    const href = window.location.href
    const opener = window.opener as Window | null
    const state = new URL(href).searchParams.get("state") ?? ""
    let exchange = exchanges.get(href)
    if (!exchange) {
      exchange = auth.handleCallback(href)
      exchanges.set(href, exchange)
    }
    exchange
      .then((result) => {
        const { returnTo, popup } = result as { returnTo: string; popup: boolean }
        if (popup) {
          auth.reportStepUp(true, state, opener)
          setState("done")
          window.close()
        } else {
          router.history.replace(returnTo)
          toast.success(i18n.t("stepUp.redirected"))
        }
      })
      .catch(() => {
        // The flag is unknown when the exchange failed; a report no tab waits for is harmless.
        auth.reportStepUp(false, state, opener)
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
