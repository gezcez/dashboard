import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { isSudoCancelled, runWithSudo } from "@/lib/sudo"
import { cn } from "@/lib/utils"

const DURATIONS = ["1d", "7d", "30d", "permanent"] as const

const banSchema = z.object({
  duration: z.enum(DURATIONS),
  public_reason: z.string().trim().min(3).max(500),
  private_reason: z.string().trim().max(2000),
})
type BanForm = z.infer<typeof banSchema>

/**
 * Ban is a sudo action (x-gezcez-sudo) and pessimistic: the dialog stays open with a pending
 * button until the server confirms; it then closes and the user page refetches.
 */
export function BanDialog({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; display_name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("dashboard")
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<BanForm>({
    resolver: zodResolver(banSchema),
    defaultValues: { duration: "7d", public_reason: "", private_reason: "" },
  })

  const ban = useMutation({
    mutationFn: (values: BanForm) =>
      runWithSudo(
        () =>
          callApi("post", "/v1/dash/users/{userId}/ban", {
            params: { path: { userId: user.id } },
            body: {
              duration: values.duration,
              public_reason: values.public_reason,
              ...(values.private_reason ? { private_reason: values.private_reason } : {}),
            },
          }),
        { authTime: () => auth.claims()?.authTime ?? null },
      ),
    onMutate: () => {
      setServerError(null)
    },
    onSuccess: () => {
      toast.success(t("user.ban.done", { name: user.display_name }))
      onOpenChange(false)
      form.reset()
    },
    onError: (error) => {
      if (isSudoCancelled(error)) return
      if (isApiError(error, "VALIDATION_FAILED")) {
        const fields = (error.details.fields ?? {}) as Record<string, string>
        for (const [name, message] of Object.entries(fields)) {
          if (name in banSchema.shape) form.setError(name as keyof BanForm, { message })
        }
      }
      setServerError(isApiError(error) ? apiErrorMessage(error) : t("user.ban.failed"))
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/users"),
  })

  const { errors } = form.formState
  const duration = form.watch("duration")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!ban.isPending) onOpenChange(next)
      }}
    >
      <DialogContent closeLabel={t("close", { ns: "common" })}>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(e) => void form.handleSubmit((values) => ban.mutate(values))(e)}
        >
          <DialogHeader>
            <DialogTitle>{t("user.ban.title", { name: user.display_name })}</DialogTitle>
            <DialogDescription>{t("user.ban.body")}</DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t("user.ban.duration")}</legend>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <label
                  key={d}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                    duration === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    value={d}
                    className="sr-only"
                    {...form.register("duration")}
                  />
                  {t(`user.ban.durations.${d}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="ban-public">{t("user.ban.publicReason")}</Label>
            <Textarea
              id="ban-public"
              aria-invalid={errors.public_reason ? true : undefined}
              aria-describedby="ban-public-hint"
              {...form.register("public_reason")}
            />
            <p
              id="ban-public-hint"
              className={cn(
                "text-xs",
                errors.public_reason ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {errors.public_reason
                ? t("user.ban.publicReasonError")
                : t("user.ban.publicReasonHint")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ban-private">{t("user.ban.privateReason")}</Label>
            <Textarea id="ban-private" rows={2} {...form.register("private_reason")} />
            <p className="text-xs text-muted-foreground">{t("user.ban.privateReasonHint")}</p>
          </div>

          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={ban.isPending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" variant="destructive-solid" disabled={ban.isPending}>
              {ban.isPending ? t("user.ban.pending") : t("user.ban.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
