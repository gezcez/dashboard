import { ShieldCheckIcon, ShieldIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { isAuthError } from "@/auth/errors"
import { useAuth } from "@/auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { elevationEndsAt, SUDO_MAX_AGE_S, useSudoStore } from "@/lib/sudo"

/**
 * The step-up prompt behind runWithSudo. The popup opens from this dialog's click so browsers
 * allow it; a blocked popup falls back to a full redirect (the action is not replayed).
 */
export function StepUpDialog() {
  const { t } = useTranslation()
  const auth = useAuth()
  const pending = useSudoStore((s) => s.pending)
  const setPending = useSudoStore((s) => s.setPending)
  const markElevated = useSudoStore((s) => s.markElevated)
  const [state, setState] = useState<"idle" | "working" | "cancelled" | "failed">("idle")
  const waiting = useRef<AbortController | null>(null)

  useEffect(() => {
    if (pending) setState("idle")
  }, [pending])

  const close = (elevated: boolean) => {
    waiting.current?.abort()
    waiting.current = null
    pending?.resolve(elevated)
    setPending(null)
  }

  const confirm = async () => {
    setState("working")
    const controller = new AbortController()
    waiting.current = controller
    try {
      const result = await auth.stepUp({ maxAge: SUDO_MAX_AGE_S, signal: controller.signal })
      if (result.type === "redirected") return
      const authTime = auth.claims()?.authTime
      if (authTime) markElevated(authTime)
      close(true)
    } catch (error) {
      if (controller.signal.aborted) return
      setState(isAuthError(error, "cancelled") ? "cancelled" : "failed")
    }
  }

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) close(false)
      }}
    >
      <DialogContent closeLabel={t("close")} className="max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl brand-gradient text-navy">
            <ShieldIcon className="size-5" />
          </span>
          <DialogTitle>{t("stepUp.title")}</DialogTitle>
          <DialogDescription>{t("stepUp.body")}</DialogDescription>
        </DialogHeader>
        {(state === "cancelled" || state === "failed") && (
          <p role="alert" className="text-sm text-destructive">
            {state === "cancelled" ? t("stepUp.cancelled") : t("stepUp.failed")}
          </p>
        )}
        <DialogFooter>
          {/* Cancel stays live while waiting: the popup cannot tell us it was closed. */}
          <Button
            variant="ghost"
            onClick={() => {
              close(false)
            }}
          >
            {t("cancel")}
          </Button>
          <Button variant="primary" disabled={state === "working"} onClick={() => void confirm()}>
            {state === "working" ? t("stepUp.waiting") : t("stepUp.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, "0")}`
}

/** Top-bar countdown while a step-up from this tab is fresh. Clicking it ends elevation early. */
export function SudoPill() {
  const { t } = useTranslation()
  const shownFor = useSudoStore((s) => s.shownFor)
  const endedFor = useSudoStore((s) => s.endedFor)
  const end = useSudoStore((s) => s.end)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (shownFor === null) return
    const id = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [shownFor])

  const endsAt = elevationEndsAt(shownFor, endedFor, now)
  if (shownFor === null || endsAt === null) return null
  const label = t("stepUp.elevated", { time: formatCountdown(endsAt - now) })
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="brand"
          size="sm"
          className="tabular"
          onClick={() => {
            end(shownFor)
          }}
          aria-label={`${label}. ${t("stepUp.endElevation")}`}
        >
          <ShieldCheckIcon />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("stepUp.endElevation")}</TooltipContent>
    </Tooltip>
  )
}
