import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CirclePauseIcon, CirclePlayIcon, TriangleAlertIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { BindingStatusView } from "@/api/realtime-types"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { isSudoCancelled } from "@/lib/sudo"
import { formatDateTime } from "@/lib/format"
import { useSudo } from "@/lib/use-sudo"
import { cn } from "@/lib/utils"
import type { Binding } from "@/components/transit/queries"

export type ControlAction = "pause" | "resume" | "poll-now" | "reset-url" | "refresh-token"

/** How long the page waits for the worker's status push before warning (plan 6.5). */
export const ACK_TIMEOUT_MS = 10_000

/**
 * Tracker control calls (`POST .../bindings/{id}/control`). Pessimistic: the API answers after
 * the worker acknowledges; when it answers without a confirmed status, the page watches the
 * `tracker.status` push for 10 s and then says the worker has not confirmed.
 */
export function useBindingControl(networkId: number, bindingId: number) {
  const { t } = useTranslation("ops")
  const sudo = useSudo()
  const queryClient = useQueryClient()
  const [unconfirmed, setUnconfirmed] = useState<ControlAction | null>(null)
  const mutation = useMutation({
    mutationFn: ({ action, reason }: { action: ControlAction; reason?: string }) =>
      sudo(() =>
        callApi("post", "/v1/dash/networks/{networkId}/bindings/{bindingId}/control", {
          params: { path: { networkId: String(networkId), bindingId: String(bindingId) } },
          body: { action, ...(reason ? { reason } : {}) },
        }),
      ),
    onMutate: () => {
      setUnconfirmed(null)
    },
    onSuccess: (result, { action }) => {
      if (!result.ok) {
        toast.error(t("tracker.control.failed", { error: result.error ?? "" }))
        return
      }
      if (!result.status) setUnconfirmed(action)
      toast.success(t(`tracker.control.done.${action}`))
    },
    onError: (error) => {
      if (isSudoCancelled(error)) return
      toast.error(isApiError(error) ? apiErrorMessage(error) : t("tracker.control.failed", { error: "" }))
    },
    onSettled: () =>
      Promise.all([
        invalidateApi(queryClient, "/v1/dash/networks/{networkId}/tracker"),
        invalidateApi(queryClient, "/v1/dash/networks/{networkId}/bindings"),
      ]),
  })
  const clearUnconfirmed = useCallback(() => {
    setUnconfirmed(null)
  }, [])
  return { ...mutation, unconfirmed, clearUnconfirmed }
}

/**
 * The binding's one big control (plan 6.5): running or paused, with who, when and why. Pause and
 * resume are L2 (reason, sudo) and never optimistic; amber "not confirmed" after 10 s without
 * a status push from the worker.
 */
export function KillSwitch({
  binding,
  status,
  networkName,
  control,
  canControl,
}: {
  binding: Binding
  status: BindingStatusView | undefined
  networkName: string
  control: ReturnType<typeof useBindingControl>
  canControl: boolean
}) {
  const { t } = useTranslation("ops")
  const [dialog, setDialog] = useState<"pause" | "resume" | null>(null)
  const paused = (status?.state ?? binding.state) === "paused" || binding.status === "paused"
  const killed = (status?.state ?? binding.state) === "killed"
  const name = `${binding.provider_key}/${binding.external_ref}`

  // A push confirming the requested state clears the warning; otherwise it shows after 10 s.
  const [timedOut, setTimedOut] = useState(false)
  const pending = control.unconfirmed
  const { clearUnconfirmed } = control
  useEffect(() => {
    setTimedOut(false)
    if (!pending) return
    const confirmed = pending === "pause" ? paused : pending === "resume" ? !paused : true
    if (confirmed) {
      clearUnconfirmed()
      return
    }
    const id = window.setTimeout(() => {
      setTimedOut(true)
    }, ACK_TIMEOUT_MS)
    return () => {
      window.clearTimeout(id)
    }
  }, [pending, paused, clearUnconfirmed])

  const busy = control.isPending && (control.variables.action === "pause" || control.variables.action === "resume")
  return (
    <Card className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center", paused && "border-status-warn/40")}>
      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-2xl",
          paused || killed ? "bg-status-warn/12 text-status-warn" : "bg-status-ok/12 text-status-ok",
        )}
        aria-hidden
      >
        {paused || killed ? <CirclePauseIcon className="size-7" /> : <CirclePlayIcon className="size-7" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">
          {killed ? t("tracker.kill.killed") : paused ? t("tracker.kill.paused") : t("tracker.kill.running")}
        </p>
        <p className="text-sm text-muted-foreground">
          {paused
            ? t("tracker.kill.pausedDetail", {
                reason: binding.disabled_reason ?? status?.message ?? "–",
                when: formatDateTime(binding.updated_at),
              })
            : t("tracker.kill.runningDetail")}
        </p>
        {pending && timedOut && (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-status-warn">
            <TriangleAlertIcon className="size-4" />
            {t(`tracker.kill.unconfirmed.${pending === "resume" ? "resume" : "pause"}`)}
          </p>
        )}
      </div>
      {canControl && (
        <Button
          size="lg"
          variant={paused ? "primary" : "destructive"}
          disabled={busy || killed}
          onClick={() => {
            setDialog(paused ? "resume" : "pause")
          }}
        >
          {busy
            ? paused
              ? t("tracker.kill.resuming")
              : t("tracker.kill.pausing")
            : paused
              ? t("tracker.kill.resume")
              : t("tracker.kill.pause")}
        </Button>
      )}
      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(o) => {
          if (!o) setDialog(null)
        }}
        title={dialog === "resume" ? t("tracker.kill.resumeTitle", { name }) : t("tracker.kill.pauseTitle", { name })}
        effect={
          dialog === "resume"
            ? t("tracker.kill.resumeEffect", { name, network: networkName })
            : t("tracker.kill.pauseEffect", { name, network: networkName })
        }
        confirmLabel={dialog === "resume" ? t("tracker.kill.resume") : t("tracker.kill.pause")}
        pendingLabel={dialog === "resume" ? t("tracker.kill.resuming") : t("tracker.kill.pausing")}
        reasonLabel={t("tracker.kill.reason")}
        destructive={dialog === "pause"}
        pending={busy}
        error={control.error && !isSudoCancelled(control.error) && isApiError(control.error) ? apiErrorMessage(control.error) : null}
        onConfirm={(reason) => {
          if (!dialog) return
          control.mutate(
            { action: dialog, reason },
            {
              onSuccess: () => {
                setDialog(null)
              },
            },
          )
        }}
      />
    </Card>
  )
}
