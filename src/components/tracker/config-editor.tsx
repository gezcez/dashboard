import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { Binding } from "@/components/transit/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { useCan } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"
import {
  diffConfig,
  fieldError,
  schemaFields,
  showValue,
  type SchemaField,
} from "./config-diff"

const INTERVALS = { poll_interval_s: [5, 600], idle_poll_interval_s: [5, 3600] } as const

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: SchemaField
  value: unknown
  onChange: (v: unknown) => void
  disabled: boolean
}) {
  const id = `cfg-${field.key}`
  if (field.type === "boolean")
    return (
      <input
        id={id}
        type="checkbox"
        className="size-4 accent-brand"
        checked={value === true}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.checked)
        }}
      />
    )
  if (field.type === "string[]")
    return (
      <Textarea
        id={id}
        rows={2}
        className="font-mono text-xs"
        disabled={disabled}
        value={Array.isArray(value) ? value.join("\n") : ""}
        onChange={(e) => {
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }}
      />
    )
  if (field.type === "number" || field.type === "integer")
    return (
      <Input
        id={id}
        type="number"
        disabled={disabled}
        min={field.minimum}
        max={field.maximum}
        step={field.type === "integer" ? 1 : "any"}
        value={typeof value === "number" ? value : ""}
        onChange={(e) => {
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }}
      />
    )
  return (
    <Input
      id={id}
      disabled={disabled}
      className="font-mono text-xs"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => {
        onChange(e.target.value)
      }}
    />
  )
}

/**
 * Binding config editor (plan 6.5): a form generated from the adapter's JSON Schema, staged as a
 * diff preview, saved with a reason under sudo. Without providers.read (no schema) the config is
 * edited as raw JSON.
 */
export function ConfigEditor({ binding, networkId }: { binding: Binding; networkId: number }) {
  const { t } = useTranslation("ops")
  const sudo = useSudo()
  const queryClient = useQueryClient()
  const canWrite = useCan("tracker.config.write", { network: networkId }) === true
  const canProviders = useCan("providers.read", "global") === true
  const provider = useQuery({
    ...apiQuery("/v1/dash/providers/{key}", { params: { path: { key: binding.provider_key } } }),
    enabled: canProviders,
  })
  const fields = useMemo(() => schemaFields(provider.data?.config_schema), [provider.data])
  const original = useMemo(
    () => ({
      poll_interval_s: binding.poll_interval_s,
      idle_poll_interval_s: binding.idle_poll_interval_s,
      ...binding.config,
    }),
    [binding],
  )
  const [draft, setDraft] = useState<Record<string, unknown>>(original)
  const [raw, setRaw] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [stage, setStage] = useState<"edit" | "review">("edit")

  const changes = diffConfig(original, draft)
  const errors = fields.flatMap((f) => {
    const e = fieldError(f, draft[f.key])
    return e ? [{ key: f.key, error: e }] : []
  })
  const intervalError = (Object.keys(INTERVALS) as (keyof typeof INTERVALS)[]).find((k) => {
    const v = draft[k]
    const [min, max] = INTERVALS[k]
    return typeof v !== "number" || v < min || v > max
  })

  const save = useMutation({
    mutationFn: () => {
      const { poll_interval_s, idle_poll_interval_s, ...config } = draft
      return sudo(() =>
        callApi("patch", "/v1/dash/networks/{networkId}/bindings/{bindingId}/config", {
          params: { path: { networkId: String(networkId), bindingId: String(binding.id) } },
          body: {
            poll_interval_s: poll_interval_s as number,
            idle_poll_interval_s: idle_poll_interval_s as number,
            config,
            reason: reason.trim(),
          },
        }),
      )
    },
    onSuccess: () => {
      toast.success(t("tracker.config.saved"))
      setStage("edit")
      setReason("")
    },
    onError: (e) => {
      if (!isSudoCancelled(e)) toast.error(isApiError(e) ? apiErrorMessage(e) : t("tracker.config.failed"))
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/networks/{networkId}/bindings"),
  })

  const set = (key: string, value: unknown) => {
    setDraft((d) => {
      const next = { ...d }
      if (value === undefined) delete next[key]
      else next[key] = value
      return next
    })
  }

  if (stage === "review")
    return (
      <form
        className="grid max-w-2xl gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (reason.trim().length >= 3) save.mutate()
        }}
      >
        <h3 className="font-semibold">{t("tracker.config.reviewTitle", { count: changes.length })}</h3>
        <ul className="grid gap-1 rounded-xl border p-3 font-mono text-xs">
          {changes.map((c) => (
            <li key={c.key} className="grid gap-0.5">
              <span className="font-semibold">{c.key}</span>
              <span className="text-status-error line-through">- {showValue(c.before)}</span>
              <span className="text-status-ok">+ {showValue(c.after)}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2">
          <Label htmlFor="cfg-reason">{t("tracker.config.reason")}</Label>
          <Textarea
            id="cfg-reason"
            rows={2}
            value={reason}
            required
            onChange={(e) => {
              setReason(e.target.value)
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => { setStage("edit") }}>
            {t("tracker.config.back")}
          </Button>
          <Button type="submit" disabled={save.isPending || reason.trim().length < 3}>
            {save.isPending ? t("tracker.config.saving") : t("tracker.config.save")}
          </Button>
        </div>
      </form>
    )

  const disabled = !canWrite
  return (
    <form
      className="grid max-w-2xl gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (changes.length && !errors.length && !intervalError) setStage("review")
      }}
    >
      {!canWrite && <p className="text-sm text-muted-foreground">{t("tracker.config.readOnly")}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(INTERVALS) as (keyof typeof INTERVALS)[]).map((k) => (
          <div key={k} className="grid gap-1.5">
            <Label htmlFor={`cfg-${k}`}>{t(`tracker.config.${k}`)}</Label>
            <Input
              id={`cfg-${k}`}
              type="number"
              min={INTERVALS[k][0]}
              max={INTERVALS[k][1]}
              disabled={disabled}
              value={typeof draft[k] === "number" ? draft[k] : ""}
              aria-invalid={intervalError === k}
              onChange={(e) => {
                set(k, e.target.value === "" ? undefined : Number(e.target.value))
              }}
            />
          </div>
        ))}
      </div>
      {fields.length > 0 ? (
        <div className="grid gap-4">
          {fields.map((f) => {
            const err = errors.find((e) => e.key === f.key)?.error
            return (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={`cfg-${f.key}`} className="font-mono text-xs">
                  {f.key}
                  {f.required && " *"}
                </Label>
                <FieldInput field={f} value={draft[f.key]} onChange={(v) => { set(f.key, v) }} disabled={disabled} />
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                {err && <p className="text-xs text-destructive">{t(`tracker.config.errors.${err}`)}</p>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="cfg-raw">{t("tracker.config.raw")}</Label>
          <Textarea
            id="cfg-raw"
            rows={10}
            className="font-mono text-xs"
            disabled={disabled}
            value={raw ?? JSON.stringify(binding.config, null, 2)}
            onChange={(e) => {
              setRaw(e.target.value)
              try {
                const parsed = JSON.parse(e.target.value) as Record<string, unknown>
                setDraft({
                  poll_interval_s: draft.poll_interval_s,
                  idle_poll_interval_s: draft.idle_poll_interval_s,
                  ...parsed,
                })
              } catch {
                // keep the last valid draft while the JSON is mid-edit
              }
            }}
          />
        </div>
      )}
      {canWrite && (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!changes.length || errors.length > 0 || Boolean(intervalError)}>
            {t("tracker.config.review", { count: changes.length })}
          </Button>
          {changes.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(original)
                setRaw(null)
              }}
            >
              {t("tracker.config.discard")}
            </Button>
          )}
        </div>
      )}
    </form>
  )
}
