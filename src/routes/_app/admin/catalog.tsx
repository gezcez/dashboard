import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { PowerIcon, PowerOffIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState } from "@/components/states/states"
import { providersQuery } from "@/components/transit/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"

type Provider = components["schemas"]["DashProviderDto"]

const TABS = ["networks", "cities", "providers"] as const

export const Route = createFileRoute("/_app/admin/catalog")({
  staticData: { pageId: "admin.catalog" },
  validateSearch: z.object({ tab: z.enum(TABS).optional().catch(undefined) }),
  beforeLoad: ({ context }) => assertPage("admin.catalog", context),
  component: GlobalCatalog,
})

function GlobalCatalog() {
  const { t, i18n } = useTranslation("ops")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const tab = search.tab ?? "networks"
  const canProviders = useCan("providers.read", "global") === true
  const cities = useQuery({ ...apiQuery("/v1/dash/cities"), staleTime: 60_000 })
  const networks = useQuery(
    apiQuery("/v1/dash/networks", { params: { query: { limit: 200 } } }),
  )
  const providers = useQuery({ ...providersQuery(), enabled: canProviders })
  const lang = i18n.language === "tr" ? "tr" : "en"

  return (
    <>
      <PageHeader eyebrow={t("adminCatalog.eyebrow")} title={t("adminCatalog.title")} intro={t("adminCatalog.intro")} />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          void navigate({ search: { tab: v === "networks" ? undefined : (v as (typeof TABS)[number]) }, replace: true })
        }}
      >
        <TabsList className="mb-4">
          {TABS.filter((k) => k !== "providers" || canProviders).map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`adminCatalog.tabs.${k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="networks">
          {networks.error ? (
            <ErrorState onRetry={() => void networks.refetch()} />
          ) : !networks.data ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : (
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminCatalog.networks.name")}</TableHead>
                    <TableHead>{t("adminCatalog.networks.city")}</TableHead>
                    <TableHead>{t("adminCatalog.networks.operator")}</TableHead>
                    <TableHead>{t("adminCatalog.networks.visibility")}</TableHead>
                    <TableHead className="text-right">{t("adminCatalog.networks.bindings")}</TableHead>
                    <TableHead>{t("adminCatalog.networks.timezone")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networks.data.items.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <Link to="/n/$network/catalog" params={{ network: n.slug }} className="font-medium hover:underline">
                          {n.name}
                        </Link>
                      </TableCell>
                      <TableCell>{n.city.name}</TableCell>
                      <TableCell>{n.operator ?? "–"}</TableCell>
                      <TableCell>
                        <Badge variant={n.visibility === "public" ? "ok" : "default"}>
                          {t(`adminCatalog.visibility.${n.visibility}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular text-right">{formatNumber(n.binding_count)}</TableCell>
                      <TableCell className="font-mono text-xs">{n.timezone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="cities">
          {cities.error ? (
            <ErrorState onRetry={() => void cities.refetch()} />
          ) : !cities.data ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : (
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminCatalog.cities.name")}</TableHead>
                    <TableHead>{t("adminCatalog.cities.country")}</TableHead>
                    <TableHead>{t("adminCatalog.cities.status")}</TableHead>
                    <TableHead>{t("adminCatalog.cities.timezone")}</TableHead>
                    <TableHead>{t("adminCatalog.cities.centre")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name[lang]}</TableCell>
                      <TableCell>{c.country_code}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "public" ? "ok" : c.status === "draft" ? "brand" : "default"}>
                          {t(`adminCatalog.cityStatus.${c.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.timezone}</TableCell>
                      <TableCell className="tabular text-xs text-muted-foreground">
                        {c.center_lat === null || c.center_lon === null
                          ? "–"
                          : `${c.center_lat.toFixed(3)}, ${c.center_lon.toFixed(3)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
        {canProviders && (
          <TabsContent value="providers">
            {providers.error ? (
              <ErrorState onRetry={() => void providers.refetch()} />
            ) : !providers.data ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : providers.data.length === 0 ? (
              <EmptyState title={t("adminCatalog.providers.empty")} />
            ) : (
              <div className="grid gap-3">
                {providers.data.map((p) => (
                  <ProviderCard key={p.key} provider={p} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}

/** A provider with its global kill switch (L3: reason, type the key, sudo). */
function ProviderCard({ provider }: { provider: Provider }) {
  const { t } = useTranslation("ops")
  const sudo = useSudo()
  const queryClient = useQueryClient()
  const canKill = useCan("providers.kill", "global") === true
  const [open, setOpen] = useState(false)
  const enabling = !provider.enabled
  const kill = useMutation({
    mutationFn: (reason: string) =>
      sudo(() =>
        callApi("post", "/v1/dash/providers/{key}/kill", {
          params: { path: { key: provider.key } },
          body: { enabled: enabling, reason },
        }),
      ),
    onSuccess: () => {
      setOpen(false)
      toast.success(enabling ? t("adminCatalog.providers.enabled") : t("adminCatalog.providers.killed"))
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/providers"),
  })
  const caps = provider.capabilities
    ? Object.entries(provider.capabilities)
        .filter(([, v]) => v === true || (typeof v === "string" && v !== "none"))
        .map(([k]) => k)
    : []
  return (
    <Card className="flex flex-wrap items-start gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{provider.name}</span>
          <code className="text-xs text-muted-foreground">{provider.key}</code>
          <Badge variant={provider.enabled ? "ok" : "error"}>
            {provider.enabled ? t("adminCatalog.providers.on") : t("adminCatalog.providers.off")}
          </Badge>
          {!provider.env_enabled && <Badge variant="warn">{t("adminCatalog.providers.envOff")}</Badge>}
          {provider.replayed && <Badge variant="outline">{t("adminCatalog.providers.replayed")}</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("adminCatalog.providers.bindings", { count: provider.binding_count })}
          {provider.disabled_reason ? ` · ${provider.disabled_reason}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {caps.map((c) => (
            <Badge key={c} variant="outline" className="font-mono text-[10px]">
              {c}
            </Badge>
          ))}
        </div>
      </div>
      {canKill && (
        <Button
          variant={enabling ? "primary" : "destructive"}
          onClick={() => {
            setOpen(true)
          }}
        >
          {enabling ? <PowerIcon /> : <PowerOffIcon />}
          {enabling ? t("adminCatalog.providers.enable") : t("adminCatalog.providers.kill")}
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={
          enabling
            ? t("adminCatalog.providers.enableTitle", { name: provider.name })
            : t("adminCatalog.providers.killTitle", { name: provider.name })
        }
        effect={
          enabling
            ? t("adminCatalog.providers.enableEffect", { count: provider.binding_count })
            : t("adminCatalog.providers.killEffect", { count: provider.binding_count })
        }
        confirmLabel={enabling ? t("adminCatalog.providers.enable") : t("adminCatalog.providers.kill")}
        reasonLabel={t("tracker.kill.reason")}
        typeToConfirm={provider.key}
        destructive={!enabling}
        pending={kill.isPending}
        error={
          kill.error && !isSudoCancelled(kill.error) && isApiError(kill.error)
            ? apiErrorMessage(kill.error)
            : null
        }
        onConfirm={(reason) => {
          kill.mutate(reason)
        }}
      />
    </Card>
  )
}
