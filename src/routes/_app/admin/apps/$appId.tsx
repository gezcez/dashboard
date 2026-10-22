import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  KeyRoundIcon,
  LogOutIcon,
  RotateCwIcon,
  ShieldAlertIcon,
} from "lucide-react"
import { useEffect, useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import type { components, operations } from "@/api/schema.gen"
import { AppBadges } from "@/components/apps/app-badges"
import { RedirectUriEditor, redirectUrisValid } from "@/components/apps/redirect-uri-editor"
import { SecretOnceDialog } from "@/components/apps/secret-once-dialog"
import { UsageChart } from "@/components/apps/usage-chart"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { ErrorState, NotFoundState, PageSkeleton } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"
import { cn } from "@/lib/utils"

type App = components["schemas"]["AppDetail"]
type Patch = operations["updateApp"]["requestBody"]["content"]["application/json"]

const TABS = ["general", "redirects", "scopes", "lifetimes", "secrets", "usage"] as const
type Tab = (typeof TABS)[number]

const appQuery = (appId: string) =>
  apiQuery("/v1/dash/apps/{appId}", { params: { path: { appId } } })

export const Route = createFileRoute("/_app/admin/apps/$appId")({
  staticData: { pageId: "admin.apps" },
  validateSearch: z.object({ tab: z.enum(TABS).optional().catch(undefined) }),
  beforeLoad: ({ context }) => assertPage("admin.apps", context),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.query(appQuery(params.appId))
    } catch (error) {
      if (isApiError(error, "NOT_FOUND")) throw notFound()
    }
  },
  notFoundComponent: AppNotFound,
  component: AppPage,
})

function AppNotFound() {
  const { t } = useTranslation("dashboard")
  return <NotFoundState title={t("apps.notFoundTitle")} body={t("apps.notFoundBody")} />
}

const errorText = (error: unknown, fallback: string) =>
  error && !isSudoCancelled(error) ? (isApiError(error) ? apiErrorMessage(error) : fallback) : null

/**
 * PATCH an app. Redirect URIs and the first-party flag need a recent sign-in (backend 6.2), so
 * those saves run through sudo; other fields go straight through.
 */
function useAppPatch(app: App) {
  const queryClient = useQueryClient()
  const sudo = useSudo()
  return useMutation({
    mutationFn: (body: Patch) => {
      const call = () =>
        callApi("patch", "/v1/dash/apps/{appId}", {
          params: { path: { appId: app.client_id } },
          body,
        })
      return body.redirect_uris !== undefined || body.first_party !== undefined
        ? sudo(call)
        : call()
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(appQuery(app.client_id).queryKey, saved)
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/apps"),
  })
}

function AppPage() {
  const { t } = useTranslation("dashboard")
  const { appId } = Route.useParams()
  const { tab = "general" } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery(appQuery(appId))
  const app = query.data

  const back = (
    <Link
      to="/admin/apps"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      {t("apps.back")}
    </Link>
  )
  if (query.error)
    return (
      <>
        {back}
        <ErrorState
          message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
          requestId={isApiError(query.error) ? query.error.requestId : null}
          onRetry={() => void query.refetch()}
        />
      </>
    )
  if (!app) return <PageSkeleton />

  const tabs = TABS.filter((id) => id !== "secrets" || app.type === "confidential")
  return (
    <>
      {back}
      <PageHeader
        eyebrow={t("apps.eyebrow")}
        title={app.name}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-sm">{app.client_id}</code>
            <AppBadges app={app} />
          </span>
        }
      />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          void navigate({
            search: { tab: value === "general" ? undefined : (value as Tab) },
            replace: true,
          })
        }
      >
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((id) => (
            <TabsTrigger key={id} value={id}>
              {t(`apps.tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <GeneralTab app={app} />
        </TabsContent>
        <TabsContent value="redirects" className="mt-4">
          <RedirectsTab app={app} />
        </TabsContent>
        <TabsContent value="scopes" className="mt-4">
          <ScopesTab app={app} />
        </TabsContent>
        <TabsContent value="lifetimes" className="mt-4">
          <LifetimesTab app={app} />
        </TabsContent>
        {app.type === "confidential" && (
          <TabsContent value="secrets" className="mt-4">
            <SecretsTab app={app} />
          </TabsContent>
        )}
        <TabsContent value="usage" className="mt-4">
          <UsageTab app={app} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function SaveBar({
  dirty,
  valid = true,
  pending,
  error,
  onSave,
  onReset,
  sudo = false,
}: {
  dirty: boolean
  valid?: boolean
  pending: boolean
  error: string | null
  onSave: () => void
  onReset: () => void
  sudo?: boolean
}) {
  const { t } = useTranslation("dashboard")
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
      {error && (
        <p role="alert" className="mr-auto text-sm text-destructive">
          {error}
        </p>
      )}
      {sudo && !error && (
        <p className="mr-auto flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldAlertIcon className="size-3.5" />
          {t("apps.needsSudo")}
        </p>
      )}
      <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={onReset}>
        {t("apps.reset")}
      </Button>
      <Button type="submit" disabled={!dirty || !valid || pending} onClick={onSave}>
        {pending ? t("confirm.working", { ns: "common" }) : t("save", { ns: "common" })}
      </Button>
    </div>
  )
}

function GeneralTab({ app }: { app: App }) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const canWrite = useCan("apps.write", "global") === true
  const initial = {
    name: app.name,
    description: app.description,
    logo_url: app.logo_url ?? "",
    homepage_url: app.homepage_url ?? "",
  }
  const [form, setForm] = useState(initial)
  const [firstPartyOpen, setFirstPartyOpen] = useState(false)
  const patch = useAppPatch(app)
  const firstParty = useAppPatch(app)
  // Follow the server after a save or refetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(initial), [app.updated_at])
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const field = (key: keyof typeof form, label: string, input: ReactNode) => (
    <div className="grid gap-2">
      <Label htmlFor={`${id}-${key}`}>{label}</Label>
      {input}
    </div>
  )
  const bind = (key: keyof typeof form) => ({
    id: `${id}-${key}`,
    value: form[key],
    disabled: !canWrite,
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    },
  })

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("apps.general.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            {field("name", t("apps.fields.name"), <Input {...bind("name")} />)}
            {field(
              "description",
              t("apps.fields.description"),
              <Textarea {...bind("description")} />,
            )}
            {field(
              "logo_url",
              t("apps.fields.logo"),
              <Input type="url" placeholder="https://" {...bind("logo_url")} />,
            )}
            {field(
              "homepage_url",
              t("apps.fields.homepage"),
              <Input type="url" placeholder="https://" {...bind("homepage_url")} />,
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t("apps.fields.type")}</dt>
              <dd>
                {t(`apps.types.${app.type}`)}{" "}
                <span className="text-xs text-muted-foreground">{t("apps.general.fixed")}</span>
              </dd>
              <dt className="text-muted-foreground">{t("apps.fields.platform")}</dt>
              <dd>{t(`apps.platforms.${app.platform}`)}</dd>
              <dt className="text-muted-foreground">{t("apps.columns.created")}</dt>
              <dd>{formatDateTime(app.created_at)}</dd>
            </dl>
            {canWrite && (
              <SaveBar
                dirty={dirty}
                valid={form.name.trim().length >= 2}
                pending={patch.isPending}
                error={errorText(patch.error, t("apps.saveFailed"))}
                onReset={() => {
                  setForm(initial)
                }}
                onSave={() => {
                  patch.mutate(
                    {
                      name: form.name.trim(),
                      description: form.description.trim(),
                      logo_url: form.logo_url.trim() || null,
                      homepage_url: form.homepage_url.trim() || null,
                    },
                    { onSuccess: () => toast.success(t("apps.saved")) },
                  )
                }}
              />
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("apps.firstParty")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p className="text-muted-foreground">{t("apps.general.firstPartyBody")}</p>
          <p className="flex items-center gap-2">
            <Badge variant={app.first_party ? "warn" : "outline"}>
              {app.first_party ? t("apps.general.skipsConsent") : t("apps.general.asksConsent")}
            </Badge>
          </p>
          {canWrite && (
            <div>
              <Button
                variant={app.first_party ? "outline" : "destructive"}
                size="sm"
                onClick={() => {
                  setFirstPartyOpen(true)
                }}
              >
                {app.first_party
                  ? t("apps.general.makeThirdParty")
                  : t("apps.general.makeFirstParty")}
              </Button>
            </div>
          )}
          {app.system && <p className="text-xs text-muted-foreground">{t("apps.systemHint")}</p>}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={firstPartyOpen}
        onOpenChange={(open) => {
          if (!open) firstParty.reset()
          setFirstPartyOpen(open)
        }}
        title={
          app.first_party
            ? t("apps.general.thirdPartyTitle", { name: app.name })
            : t("apps.general.firstPartyTitle", { name: app.name })
        }
        effect={
          app.first_party
            ? t("apps.general.thirdPartyEffect")
            : t("apps.general.firstPartyEffect", { name: app.name })
        }
        typeToConfirm={app.client_id}
        confirmLabel={
          app.first_party ? t("apps.general.makeThirdParty") : t("apps.general.makeFirstParty")
        }
        pending={firstParty.isPending}
        error={errorText(firstParty.error, t("apps.saveFailed"))}
        onConfirm={() => {
          firstParty.mutate(
            { first_party: !app.first_party },
            {
              onSuccess: () => {
                toast.success(t("apps.saved"))
                setFirstPartyOpen(false)
              },
            },
          )
        }}
      />
    </div>
  )
}

function RedirectsTab({ app }: { app: App }) {
  const { t } = useTranslation("dashboard")
  const canWrite = useCan("apps.write", "global") === true
  const [uris, setUris] = useState(app.redirect_uris)
  const patch = useAppPatch(app)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setUris(app.redirect_uris), [app.updated_at])
  const cleaned = uris.map((u) => u.trim()).filter(Boolean)
  const dirty = JSON.stringify(cleaned) !== JSON.stringify(app.redirect_uris)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("apps.redirects.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <RedirectUriEditor
            value={uris}
            onChange={setUris}
            platform={app.platform}
            disabled={!canWrite}
          />
          {canWrite && (
            <SaveBar
              sudo
              dirty={dirty}
              valid={redirectUrisValid(uris, app.platform)}
              pending={patch.isPending}
              error={errorText(patch.error, t("apps.saveFailed"))}
              onReset={() => {
                setUris(app.redirect_uris)
              }}
              onSave={() => {
                patch.mutate(
                  { redirect_uris: cleaned },
                  { onSuccess: () => toast.success(t("apps.saved")) },
                )
              }}
            />
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function ScopesTab({ app }: { app: App }) {
  const { t, i18n } = useTranslation("dashboard")
  const canWrite = useCan("apps.write", "global") === true
  const scopes = useQuery({ ...apiQuery("/v1/oauth/scopes"), staleTime: 5 * 60_000 }).data
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set(app.scopes))
  const patch = useAppPatch(app)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPicked(new Set(app.scopes)), [app.updated_at])
  const lang = i18n.language === "tr" ? "tr" : "en"
  const next = [...picked].sort()
  const dirty = JSON.stringify(next) !== JSON.stringify([...app.scopes].sort())
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("apps.scopes.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {(scopes ?? []).map((s) => (
              <li key={s.key}>
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                    picked.has(s.key) && "border-primary/50 bg-accent",
                    !canWrite && "cursor-default",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    disabled={!canWrite}
                    checked={picked.has(s.key)}
                    onChange={() => {
                      setPicked((prev) => {
                        const n = new Set(prev)
                        if (n.has(s.key)) n.delete(s.key)
                        else n.add(s.key)
                        return n
                      })
                    }}
                  />
                  <span>
                    <span className="font-medium">{s.name[lang]}</span>{" "}
                    <code className="font-mono text-xs text-muted-foreground">{s.key}</code>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {s.description[lang]}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {canWrite && (
            <SaveBar
              dirty={dirty}
              pending={patch.isPending}
              error={errorText(patch.error, t("apps.saveFailed"))}
              onReset={() => {
                setPicked(new Set(app.scopes))
              }}
              onSave={() => {
                patch.mutate({ scopes: next }, { onSuccess: () => toast.success(t("apps.saved")) })
              }}
            />
          )}
        </form>
      </CardContent>
    </Card>
  )
}

const lifetimeSchema = z
  .object({
    access_min: z.number().int().min(5).max(60),
    refresh_days: z.number().int().min(1).max(365),
    max_days: z.number().int().min(1).max(730),
  })
  .refine((v) => v.refresh_days <= v.max_days, { path: ["refresh_days"] })

function LifetimesTab({ app }: { app: App }) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const canWrite = useCan("apps.write", "global") === true
  const initial = {
    access_min: Math.round(app.access_ttl_s / 60),
    refresh_days: Math.round(app.refresh_ttl_s / 86_400),
    max_days: Math.round(app.refresh_max_s / 86_400),
  }
  const [form, setForm] = useState(initial)
  const patch = useAppPatch(app)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(initial), [app.updated_at])
  const parsed = lifetimeSchema.safeParse(form)
  const bad = new Set(parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0])))
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const row = (key: keyof typeof form, label: string, unit: string, hint: string) => (
    <div className="grid gap-2">
      <Label htmlFor={`${id}-${key}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`${id}-${key}`}
          type="number"
          inputMode="numeric"
          className="tabular w-28"
          disabled={!canWrite}
          value={Number.isNaN(form[key]) ? "" : form[key]}
          aria-invalid={bad.has(key) ? true : undefined}
          aria-describedby={`${id}-${key}-hint`}
          onChange={(e) => {
            setForm((f) => ({ ...f, [key]: e.target.valueAsNumber }))
          }}
        />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <p
        id={`${id}-${key}-hint`}
        className={cn("text-xs", bad.has(key) ? "text-destructive" : "text-muted-foreground")}
      >
        {hint}
      </p>
    </div>
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("apps.lifetimes.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {row(
              "access_min",
              t("apps.lifetimes.access"),
              t("apps.lifetimes.minutes"),
              t("apps.lifetimes.accessHint"),
            )}
            {row(
              "refresh_days",
              t("apps.lifetimes.refresh"),
              t("apps.lifetimes.days"),
              t("apps.lifetimes.refreshHint"),
            )}
            {row(
              "max_days",
              t("apps.lifetimes.max"),
              t("apps.lifetimes.days"),
              t("apps.lifetimes.maxHint"),
            )}
          </div>
          {canWrite && (
            <SaveBar
              dirty={dirty}
              valid={parsed.success}
              pending={patch.isPending}
              error={errorText(patch.error, t("apps.saveFailed"))}
              onReset={() => {
                setForm(initial)
              }}
              onSave={() => {
                patch.mutate(
                  {
                    access_ttl_s: form.access_min * 60,
                    refresh_ttl_s: form.refresh_days * 86_400,
                    refresh_max_s: form.max_days * 86_400,
                  },
                  { onSuccess: () => toast.success(t("apps.saved")) },
                )
              }}
            />
          )}
        </form>
      </CardContent>
    </Card>
  )
}

const GRACES = ["none", "24h", "7d"] as const

function SecretsTab({ app }: { app: App }) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const canRotate = useCan("apps.secrets.rotate", "global") === true
  const [rotateOpen, setRotateOpen] = useState(false)
  const [grace, setGrace] = useState<(typeof GRACES)[number]>("24h")
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [shown, setShown] = useState<string | null>(null)
  const refresh = () => invalidateApi(queryClient, "/v1/dash/apps")

  const rotate = useMutation({
    mutationFn: () =>
      sudo(() =>
        callApi("post", "/v1/dash/apps/{appId}/secret", {
          params: { path: { appId: app.client_id } },
          body: { grace },
        }),
      ),
    onSuccess: ({ secret }) => {
      setRotateOpen(false)
      setShown(secret)
    },
    onSettled: refresh,
  })
  const revokePrevious = useMutation({
    mutationFn: () =>
      sudo(() =>
        callApi("delete", "/v1/dash/apps/{appId}/secret/previous", {
          params: { path: { appId: app.client_id } },
        }),
      ),
    onSuccess: () => {
      toast.success(t("apps.secret.previousRevoked"))
      setRevokeOpen(false)
    },
    onSettled: refresh,
  })
  const hasPrevious = app.secrets.some((s) => s.state === "previous")

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("apps.secret.title")}</CardTitle>
        {canRotate && (
          <div className="flex flex-wrap gap-2">
            {hasPrevious && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRevokeOpen(true)
                }}
              >
                {t("apps.secret.revokePrevious")}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setRotateOpen(true)
              }}
            >
              <RotateCwIcon />
              {t("apps.secret.rotate")}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted-foreground">{t("apps.secret.body")}</p>
        <div className="rounded-2xl border">
          <Table>
            <caption className="sr-only">{t("apps.secret.title")}</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("apps.secret.prefix")}</TableHead>
                <TableHead>{t("apps.secret.state")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("apps.columns.created")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("apps.secret.lastUsed")}</TableHead>
                <TableHead>{t("apps.secret.expires")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {app.secrets.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <KeyRoundIcon className="size-3.5 text-muted-foreground" />
                      {s.prefix}…
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.state === "current" ? "ok" : "warn"}>
                      {t(`apps.secret.states.${s.state}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDateTime(s.created_at, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatRelative(s.last_used_at)}
                  </TableCell>
                  <TableCell>
                    {s.expires_at ? formatDateTime(s.expires_at) : t("apps.secret.noExpiry")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <ConfirmDialog
        open={rotateOpen}
        onOpenChange={(open) => {
          if (!open) rotate.reset()
          setRotateOpen(open)
        }}
        title={t("apps.secret.rotateTitle", { name: app.name })}
        effect={t(`apps.secret.rotateEffect.${grace}`)}
        confirmLabel={t("apps.secret.rotate")}
        pending={rotate.isPending}
        error={errorText(rotate.error, t("apps.saveFailed"))}
        onConfirm={() => {
          rotate.mutate()
        }}
      >
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">{t("apps.secret.grace")}</legend>
          <div className="flex flex-wrap gap-2">
            {GRACES.map((g) => (
              <label
                key={g}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                  grace === g
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-grace`}
                  className="sr-only"
                  checked={grace === g}
                  onChange={() => {
                    setGrace(g)
                  }}
                />
                {t(`apps.secret.graces.${g}`)}
              </label>
            ))}
          </div>
        </fieldset>
      </ConfirmDialog>
      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={(open) => {
          if (!open) revokePrevious.reset()
          setRevokeOpen(open)
        }}
        title={t("apps.secret.revokePreviousTitle")}
        effect={t("apps.secret.revokePreviousEffect", { name: app.name })}
        typeToConfirm={app.client_id}
        confirmLabel={t("apps.secret.revokePrevious")}
        pending={revokePrevious.isPending}
        error={errorText(revokePrevious.error, t("apps.saveFailed"))}
        onConfirm={() => {
          revokePrevious.mutate()
        }}
      />
      <SecretOnceDialog
        secret={shown}
        clientId={app.client_id}
        onDone={() => {
          setShown(null)
        }}
      />
    </Card>
  )
}

function UsageTab({ app }: { app: App }) {
  const { t } = useTranslation("dashboard")
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const canWrite = useCan("apps.write", "global") === true
  const [open, setOpen] = useState(false)
  const revokeAll = useMutation({
    mutationFn: (reason: string) =>
      sudo(() =>
        callApi("post", "/v1/dash/apps/{appId}/revoke-all", {
          params: { path: { appId: app.client_id } },
          body: { reason },
        }),
      ),
    onSuccess: ({ revoked }) => {
      toast.success(t("apps.usage.revoked", { count: revoked }))
      setOpen(false)
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/apps"),
  })
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiTile label={t("apps.columns.tokens")} value={formatNumber(app.tokens_24h)} />
        <KpiTile label={t("apps.columns.families")} value={formatNumber(app.active_families)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("apps.usage.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageChart usage={app.usage} />
        </CardContent>
      </Card>
      {canWrite && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{t("apps.usage.revokeTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p className="text-muted-foreground">{t("apps.usage.revokeBody")}</p>
            <div>
              <Button
                variant="destructive"
                size="sm"
                disabled={app.active_families === 0}
                onClick={() => {
                  setOpen(true)
                }}
              >
                <LogOutIcon />
                {t("apps.usage.revokeAll")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) revokeAll.reset()
          setOpen(next)
        }}
        title={t("apps.usage.revokeConfirmTitle", { name: app.name })}
        effect={t("apps.usage.revokeEffect", {
          count: app.active_families,
          name: app.name,
        })}
        reasonLabel={t("user.sessions.reason")}
        typeToConfirm={app.client_id}
        confirmLabel={t("apps.usage.revokeAll")}
        pending={revokeAll.isPending}
        error={errorText(revokeAll.error, t("apps.saveFailed"))}
        onConfirm={(reason) => {
          revokeAll.mutate(reason)
        }}
      />
    </div>
  )
}
