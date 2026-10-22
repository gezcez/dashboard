import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"

export function UnbanDialog({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; display_name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("dashboard")
  const queryClient = useQueryClient()
  const [reason, setReason] = useState("")
  const valid = reason.trim().length >= 3
  const unban = useMutation({
    mutationFn: () =>
      callApi("post", "/v1/dash/users/{userId}/unban", {
        params: { path: { userId: user.id } },
        body: { reason: reason.trim() },
      }),
    onSuccess: () => {
      setReason("")
      toast.success(t("user.unban.done", { name: user.display_name }))
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(isApiError(error) ? apiErrorMessage(error) : t("user.unban.failed"))
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/users"),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!unban.isPending) onOpenChange(next)
      }}
    >
      <DialogContent closeLabel={t("close", { ns: "common" })} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("user.unban.title", { name: user.display_name })}</DialogTitle>
          <DialogDescription>{t("user.unban.body")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="unban-reason">{t("user.unban.reason")}</Label>
          <Textarea
            id="unban-reason"
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
            }}
          />
          <p className="text-xs text-muted-foreground">{t("user.unban.reasonHint")}</p>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={unban.isPending}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            {t("cancel", { ns: "common" })}
          </Button>
          <Button
            variant="primary"
            disabled={unban.isPending || !valid}
            onClick={() => {
              unban.mutate()
            }}
          >
            {unban.isPending ? t("user.unban.pending") : t("user.unban.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
