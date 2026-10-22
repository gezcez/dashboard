import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import { tableSearchSchema } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { EMAIL_STATUSES, EmailStatusBadge } from "@/components/email/email-status-badge"
import { TemplatesTab } from "@/components/email/templates-tab"
import { UserChip } from "@/components/entity/user-chip"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"

type Delivery = components["schemas"]["EmailDelivery"]
type Suppression = components["schemas"]["EmailSuppression"]

const TABS = ["templates", "deliveries", "suppressions"] as const
const searchSchema = tableSearchSchema.extend({
  tab: z.enum(TABS).optional().catch(undefined),
  template: z.string().optional(),
  status: z.enum(EMAIL_STATUSES).optional().catch(undefined),
})
type Search = z.infer<typeof searchSchema>

export const Route = createFileRoute("/_app/admin/email")({
  staticData: { pageId: "admin.email" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("admin.email", context),
  component: EmailPage,
})

/** Email (plan 6.13): template previews and test sends, the delivery log, suppressions. */
function EmailPage() {
  const { t } = useTranslation("dashboard")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const tab = search.tab ?? "templates"
  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })

  return (
    <>
      <PageHeader eyebrow={t("email.eyebrow")} title={t("email.title")} intro={t("email.intro")} />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          // Each tab has its own filters; switching starts clean.
          void navigate({
            search: { tab: v === "templates" ? undefined : (v as Search["tab"]) },
            replace: true,
          })
        }}
      >
        <TabsList>
          {TABS.map((v) => (
            <TabsTrigger key={v} value={v}>
              {t(`email.tabs.${v}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          {tab === "templates" && (
            <TemplatesTab
              selected={search.template}
              onSelect={(template) => {
                setSearch({ template })
              }}
            />
          )}
          {tab === "deliveries" && <Deliveries search={search} setSearch={setSearch} />}
          {tab === "suppressions" && <Suppressions search={search} setSearch={setSearch} />}
        </TabsContent>
      </Tabs>
    </>
  )
}

function Deliveries({
  search,
  setSearch,
}: {
  search: Search
  setSearch: (patch: Partial<Search>) => void
}) {
  const { t } = useTranslation("dashboard")
  const navigate = Route.useNavigate()
  const { tab: _tab, ...params } = search
  const query = useQuery({
    ...apiQuery("/v1/dash/email/deliveries", { params: { query: { limit: 50, ...params } } }),
    placeholderData: keepPreviousData,
  })
  const templates = useQuery({
    ...apiQuery("/v1/dash/email/templates"),
    staleTime: 5 * 60_000,
  }).data
  const columns = useMemo<ColumnDef<Delivery>[]>(
    () => [
      {
        id: "created_at",
        header: t("email.columns.sent"),
        meta: { sortKey: "created_at", firstDir: "desc" },
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.created_at)} className="text-muted-foreground">
            {formatRelative(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "template",
        header: t("email.columns.template"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <code className="font-mono text-xs">{row.original.template}</code>
            <Badge variant="outline" className="uppercase">
              {row.original.locale}
            </Badge>
          </span>
        ),
      },
      {
        id: "to",
        header: t("email.columns.to"),
        cell: ({ row }) =>
          row.original.user ? (
            <UserChip user={row.original.user} link />
          ) : (
            <span className="font-mono text-xs">{row.original.to_masked}</span>
          ),
      },
      {
        id: "subject",
        header: t("email.columns.subject"),
        meta: { hideOnMobile: true, className: "w-full max-w-0" },
        cell: ({ row }) => <span className="block truncate">{row.original.subject}</span>,
      },
      {
        id: "status",
        header: t("email.columns.status"),
        cell: ({ row }) => <EmailStatusBadge status={row.original.status} />,
      },
    ],
    [t],
  )
  const filtered = Boolean(search.q || search.status || search.template)
  return (
    <>
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("email.deliveries.search")}
        />
        <SelectFilter
          label={t("email.columns.status")}
          value={search.status}
          options={EMAIL_STATUSES.map((s) => ({ value: s, label: t(`email.status.${s}`) }))}
          onChange={(status) => {
            setSearch({ status })
          }}
        />
        <SelectFilter
          label={t("email.columns.template")}
          value={search.template}
          options={(templates ?? []).map((tpl) => ({ value: tpl.key, label: tpl.key }))}
          onChange={(template) => {
            setSearch({ template })
          }}
        />
      </FilterBar>
      <DataTable
        caption={t("email.tabs.deliveries")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(d) => d.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={search.sort}
        onSortChange={(sort) => {
          setSearch({ sort })
        }}
        empty={
          <EmptyState
            title={filtered ? t("email.deliveries.noMatch") : t("email.deliveries.empty")}
          />
        }
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) =>
              void navigate({ search: (prev) => ({ ...prev, cursor }), resetScroll: true })
            }
          />
        }
      />
    </>
  )
}

function Suppressions({
  search,
  setSearch,
}: {
  search: Search
  setSearch: (patch: Partial<Search>) => void
}) {
  const { t } = useTranslation("dashboard")
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const canRemove = useCan("settings.write", "global") === true
  const [removing, setRemoving] = useState<Suppression | null>(null)
  const query = useQuery({
    ...apiQuery("/v1/dash/email/suppressions", {
      params: { query: { limit: 50, q: search.q, cursor: search.cursor } },
    }),
    placeholderData: keepPreviousData,
  })
  const remove = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      callApi("delete", "/v1/dash/email/suppressions/{id}", {
        params: { path: { id } },
        body: { reason },
      }),
    onSuccess: () => {
      toast.success(t("email.suppressions.removed"))
      setRemoving(null)
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/email/suppressions"),
  })
  const columns = useMemo<ColumnDef<Suppression>[]>(
    () => [
      {
        id: "email",
        header: t("email.suppressions.address"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.email_masked}</span>,
      },
      {
        id: "reason",
        header: t("email.suppressions.reason"),
        cell: ({ row }) => (
          <Badge variant={row.original.reason === "manual" ? "default" : "warn"}>
            {t(`email.suppressions.reasons.${row.original.reason}`)}
          </Badge>
        ),
      },
      {
        id: "detail",
        header: t("email.suppressions.detail"),
        meta: { hideOnMobile: true, className: "w-full max-w-0" },
        cell: ({ row }) => (
          <span className="block truncate text-muted-foreground">{row.original.detail ?? "–"}</span>
        ),
      },
      {
        id: "created_at",
        header: t("email.suppressions.since"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => formatDateTime(row.original.created_at, { dateStyle: "medium" }),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("email.suppressions.actions")}</span>,
        meta: { className: "text-right" },
        cell: ({ row }) =>
          canRemove ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRemoving(row.original)
              }}
            >
              {t("email.suppressions.remove")}
            </Button>
          ) : null,
      },
    ],
    [t, canRemove],
  )
  return (
    <>
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("email.suppressions.search")}
        />
      </FilterBar>
      <DataTable
        caption={t("email.tabs.suppressions")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(s) => s.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={<EmptyState title={t("email.suppressions.empty")} />}
        footer={
          <CursorPager
            page={query.data}
            onCursor={(cursor) =>
              void navigate({ search: (prev) => ({ ...prev, cursor }), resetScroll: true })
            }
          />
        }
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            remove.reset()
            setRemoving(null)
          }
        }}
        title={t("email.suppressions.removeTitle", { email: removing?.email_masked ?? "" })}
        effect={t("email.suppressions.removeEffect")}
        reasonLabel={t("user.sessions.reason")}
        confirmLabel={t("email.suppressions.remove")}
        destructive={false}
        pending={remove.isPending}
        error={
          remove.error
            ? isApiError(remove.error)
              ? apiErrorMessage(remove.error)
              : t("email.suppressions.failed")
            : null
        }
        onConfirm={(reason) => {
          if (removing) remove.mutate({ id: removing.id, reason })
        }}
      />
    </>
  )
}
