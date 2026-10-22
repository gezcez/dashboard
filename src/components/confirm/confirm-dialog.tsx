import { useEffect, useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const MIN_REASON = 3

/** True when the typed text matches the entity name (trimmed, case-sensitive like GitHub). */
export function typedMatches(typed: string, expected: string): boolean {
  return typed.trim() === expected.trim()
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** The exact effect, in words ("Signs Ayşe out on every device."). */
  effect: ReactNode
  confirmLabel: string
  pendingLabel?: string
  /** Shown as a required reason field (stored in the audit log). */
  reasonLabel?: string
  /** L3: the user types this name to enable the button. */
  typeToConfirm?: string
  destructive?: boolean
  pending?: boolean
  error?: string | null
  children?: ReactNode
  onConfirm: (reason: string) => void
}

/**
 * L2 and L3 confirmations from plan 7.1: the effect in words, a required reason when the action
 * is audited, a verb on the button, and for L3 type-to-confirm. Sudo runs inside `onConfirm`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  effect,
  confirmLabel,
  pendingLabel,
  reasonLabel,
  typeToConfirm,
  destructive = true,
  pending = false,
  error,
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const id = useId()
  const [reason, setReason] = useState("")
  const [typed, setTyped] = useState("")

  useEffect(() => {
    if (!open) {
      setReason("")
      setTyped("")
    }
  }, [open])

  const reasonOk = !reasonLabel || reason.trim().length >= MIN_REASON
  const typedOk = !typeToConfirm || typedMatches(typed, typeToConfirm)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next)
      }}
    >
      <DialogContent closeLabel={t("close")} className="max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (reasonOk && typedOk && !pending) onConfirm(reason.trim())
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{effect}</DialogDescription>
          </DialogHeader>
          {children}
          {reasonLabel && (
            <div className="grid gap-2">
              <Label htmlFor={`${id}-reason`}>{reasonLabel}</Label>
              <Textarea
                id={`${id}-reason`}
                rows={2}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                }}
              />
              <p className="text-xs text-muted-foreground">{t("confirm.reasonHint")}</p>
            </div>
          )}
          {typeToConfirm && (
            <div className="grid gap-2">
              <Label htmlFor={`${id}-type`}>
                {t("confirm.typeToConfirm")}{" "}
                <code className="rounded bg-secondary px-1 font-mono">{typeToConfirm}</code>
              </Label>
              <Input
                id={`${id}-type`}
                autoComplete="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value)
                }}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive-solid" : "primary"}
              disabled={pending || !reasonOk || !typedOk}
            >
              {pending ? (pendingLabel ?? t("confirm.working")) : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
