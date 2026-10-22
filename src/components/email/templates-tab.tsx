import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { SendIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { useDebouncedValue } from "@/components/data-table/use-debounced-value"
import { ErrorState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { useCan, type PermissionKey } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type Template = components["schemas"]["EmailTemplate"]

const SEND_ANY: PermissionKey = "email.test.send.any"
type Locale = components["schemas"]["Locale"]

/**
 * Templates live in backend code; this lists them and renders server-side previews into a
 * sandboxed iframe (`sandbox=""`, `srcdoc`): no scripts, no same-origin, no navigation.
 */
export function TemplatesTab({
  selected,
  onSelect,
}: {
  selected: string | undefined
  onSelect: (key: string) => void
}) {
  const { t } = useTranslation("dashboard")
  const query = useQuery({ ...apiQuery("/v1/dash/email/templates"), staleTime: 5 * 60_000 })
  if (query.error)
    return (
      <ErrorState
        message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  if (!query.data) return <Skeleton className="h-96 rounded-2xl" />
  const current = query.data.find((tpl) => tpl.key === selected) ?? query.data[0]
  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <nav aria-label={t("email.templates.list")}>
        <ul className="grid gap-1">
          {query.data.map((tpl) => (
            <li key={tpl.key}>
              <button
                type="button"
                aria-current={tpl.key === current?.key ? "true" : undefined}
                onClick={() => {
                  onSelect(tpl.key)
                }}
                className={cn(
                  "grid w-full gap-0.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
                  tpl.key === current?.key && "bg-accent hover:bg-accent",
                )}
              >
                <code className="font-mono text-xs font-semibold">{tpl.key}</code>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {tpl.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {current && <TemplateDetail key={current.key} template={current} />}
    </div>
  )
}

function TemplateDetail({ template }: { template: Template }) {
  const { t, i18n } = useTranslation("dashboard")
  const id = useId()
  const [locale, setLocale] = useState<Locale>(
    template.locales.includes(i18n.language as Locale) ? (i18n.language as Locale) : "tr",
  )
  const [vars, setVars] = useState<Record<string, string>>(() =>
    Object.fromEntries(template.variables.map((v) => [v.name, v.example])),
  )
  const debounced = useDebouncedValue(vars, 400)
  const preview = useQuery({
    queryKey: ["email-preview", template.key, locale, debounced],
    queryFn: () =>
      callApi("post", "/v1/dash/email/templates/{key}/preview", {
        params: { path: { key: template.key } },
        body: { locale, variables: debounced },
      }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base">{template.key}</CardTitle>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="sr-only">{t("email.templates.locale")}</legend>
            {template.locales.map((l) => (
              <label
                key={l}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                  locale === l
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-locale`}
                  className="sr-only"
                  checked={locale === l}
                  onChange={() => {
                    setLocale(l)
                  }}
                />
                {t(`language.${l}`, { ns: "common" })}
              </label>
            ))}
          </fieldset>
          {template.variables.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {template.variables.map((v) => (
                <div key={v.name} className="grid gap-1">
                  <Label htmlFor={`${id}-${v.name}`} className="font-mono text-xs">
                    {v.name}
                  </Label>
                  <Input
                    id={`${id}-${v.name}`}
                    value={vars[v.name] ?? ""}
                    aria-describedby={`${id}-${v.name}-hint`}
                    onChange={(e) => {
                      setVars((prev) => ({ ...prev, [v.name]: e.target.value }))
                    }}
                  />
                  <p id={`${id}-${v.name}-hint`} className="text-xs text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("email.templates.preview")}</CardTitle>
          {preview.data && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("email.columns.subject")}: </span>
              {preview.data.subject}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {preview.error ? (
            <p role="alert" className="text-sm text-destructive">
              {isApiError(preview.error)
                ? apiErrorMessage(preview.error)
                : t("email.templates.previewFailed")}
            </p>
          ) : !preview.data ? (
            <Skeleton className="h-80" />
          ) : (
            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html">{t("email.templates.html")}</TabsTrigger>
                <TabsTrigger value="text">{t("email.templates.text")}</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-3">
                <iframe
                  title={t("email.templates.previewFrame", { key: template.key })}
                  sandbox=""
                  srcDoc={preview.data.html}
                  className={cn(
                    "h-[28rem] w-full rounded-xl border bg-white",
                    preview.isPlaceholderData && "opacity-70",
                  )}
                />
              </TabsContent>
              <TabsContent value="text" className="mt-3">
                <pre className="max-h-[28rem] overflow-auto rounded-xl border bg-secondary p-4 font-mono text-xs whitespace-pre-wrap">
                  {preview.data.text}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <TestSend template={template} locale={locale} />
    </div>
  )
}

/** To your own verified address by default; another address needs email.test.send.any. */
function TestSend({ template, locale }: { template: Template; locale: Locale }) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const queryClient = useQueryClient()
  const canSend = useCan("email.test.send", "global") === true
  const canAny = useCan(SEND_ANY, "global") === true
  const [other, setOther] = useState(false)
  const [to, setTo] = useState("")
  useEffect(() => {
    if (!canAny) setOther(false)
  }, [canAny])
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())

  const send = useMutation({
    mutationFn: () =>
      callApi("post", "/v1/dash/email/test", {
        body: { template: template.key, locale, ...(other ? { to: to.trim() } : {}) },
      }),
    onSuccess: ({ to_masked }) => {
      toast.success(t("email.test.sent", { to: to_masked }))
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/email/deliveries"),
  })
  if (!canSend) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("email.test.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!other || emailOk) send.mutate()
          }}
        >
          <fieldset className="grid gap-2 text-sm">
            <legend className="sr-only">{t("email.test.recipient")}</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`${id}-to`}
                className="size-4 accent-primary"
                checked={!other}
                onChange={() => {
                  setOther(false)
                }}
              />
              {t("email.test.toMe")}
            </label>
            <label className={cn("flex items-center gap-2", !canAny && "opacity-60")}>
              <input
                type="radio"
                name={`${id}-to`}
                className="size-4 accent-primary"
                disabled={!canAny}
                checked={other}
                onChange={() => {
                  setOther(true)
                }}
              />
              {t("email.test.toOther")}
              {!canAny && (
                <Badge variant="outline" className="font-mono">
                  {SEND_ANY}
                </Badge>
              )}
            </label>
          </fieldset>
          {other && (
            <div className="grid gap-1">
              <Label htmlFor={`${id}-addr`}>{t("email.test.address")}</Label>
              <Input
                id={`${id}-addr`}
                type="email"
                value={to}
                aria-invalid={to && !emailOk ? true : undefined}
                aria-describedby={`${id}-addr-hint`}
                onChange={(e) => {
                  setTo(e.target.value)
                }}
              />
              <p id={`${id}-addr-hint`} className="text-xs text-muted-foreground">
                {t("email.test.audited")}
              </p>
            </div>
          )}
          {send.error && (
            <p role="alert" className="text-sm text-destructive">
              {isApiError(send.error) ? apiErrorMessage(send.error) : t("email.test.failed")}
            </p>
          )}
          <div>
            <Button type="submit" disabled={send.isPending || (other && !emailOk)}>
              <SendIcon />
              {send.isPending ? t("confirm.working", { ns: "common" }) : t("email.test.send")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
