import { CheckIcon, CopyIcon, KeyRoundIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"
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

/**
 * Shows a client secret exactly once (plan 6.11). It can't be dismissed by Escape or a click
 * outside; the only way out is ticking "I have stored it". Nothing keeps the value after close.
 */
export function SecretOnceDialog({
  secret,
  clientId,
  onDone,
}: {
  secret: string | null
  clientId: string
  onDone: () => void
}) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const [stored, setStored] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setStored(false)
    setCopied(false)
  }, [secret])

  return (
    <Dialog open={secret !== null}>
      <DialogContent
        hideClose
        closeLabel={t("close", { ns: "common" })}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
        }}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-primary" />
            {t("apps.secret.onceTitle")}
          </DialogTitle>
          <DialogDescription>{t("apps.secret.onceBody", { clientId })}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-xl border bg-secondary px-3 py-2">
          <code className="min-w-0 flex-1 font-mono text-sm break-all" data-testid="secret-value">
            {secret}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copied ? t("copied", { ns: "common" }) : t("copy", { ns: "common" })}
            onClick={() => {
              if (secret) void navigator.clipboard.writeText(secret).then(() => setCopied(true))
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
        <label htmlFor={`${id}-stored`} className="flex items-center gap-2 text-sm">
          <input
            id={`${id}-stored`}
            type="checkbox"
            className="size-4 accent-primary"
            checked={stored}
            onChange={(e) => {
              setStored(e.target.checked)
            }}
          />
          {t("apps.secret.stored")}
        </label>
        <DialogFooter>
          <Button disabled={!stored} onClick={onDone}>
            {t("apps.secret.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
