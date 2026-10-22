import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { tableSearchSchema } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { AuditInfo } from "@/components/entity/misc-chips"
import { MODERATION_ACTIONS, ModerationBadge } from "@/components/entity/moderation-badge"
import { UserChip } from "@/components/entity/user-chip"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/states/states"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiQuery } from "@/lib/api"
import { formatDateTime, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"

type Action = components["schemas"]["ModerationAction"]

const VIEWS = ["active", "timeline"] as const
const searchSchema = tableSearchSchema.extend({
  view: z.enum(VIEWS).optional().catch(undefined),
  action: z.enum(MODERATION_ACTIONS).optional().catch(undefined),
})
type Search = z.infer<typeof searchSchema>

const moderationQuery = ({ view, ...search }: Search) =>
  apiQuery("/v1/dash/moderation", {
    params: {
      query:
        view === "timeline"
          ? { limit: 50, ...search }
          : { limit: 50, ...search, action: "ban", active: true },
    },
  })

export const Route = createFileRoute("/_app/admin/moderation")({
  staticData: { pageId: "admin.moderation" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("admin.moderation", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(moderationQuery(deps)).catch(() => undefined),
  component: ModerationPage,
})

/** Active bans with expiry, and the full ban/unban/warn timeline (plan 6.12). */
function ModerationPage() {
  const { t } = useTranslation("dashboard")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const view = search.view ?? "active"
  const query = useQuery({ ...moderationQuery(search), placeholderData: keepPreviousData })
  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })

  const columns = useMemo<ColumnDef<Action>[]>(
    () => [
      {
        id: "user",
        header: t("moderation.columns.user"),
        cell: ({ row }) => <UserChip user={row.original.user} link />,
      },
      ...(view === "timeline"
        ? [
            {
              id: "action",
              header: t("moderation.columns.action"),
              cell: ({ row }) => <ModerationBadge action={row.original.action} />,
            } satisfies ColumnDef<Action>,
          ]
        : []),
      {
        id: "reason",
        header: t("moderation.columns.reason"),
        meta: { className: "w-full max-w-0 whitespace-normal" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="line-clamp-2">{row.original.public_reason ?? "–"}</p>
            {row.original.private_reason && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.private_reason}
              </p>
            )}
          </div>
        ),
      },
      ...(view === "active"
        ? [
            {
              id: "until",
              header: t("moderation.columns.until"),
              cell: ({ row }) =>
                row.original.until ? (
                  <span title={formatDateTime(row.original.until)}>
                    {formatRelative(row.original.until)}
                  </span>
                ) : (
                  <span className="font-medium">{t("moderation.permanent")}</span>
                ),
            } satisfies ColumnDef<Action>,
          ]
        : []),
      {
        id: "by",
        header: t("moderation.columns.by"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => <AuditInfo by={row.original.by} at={row.original.at} compact />,
      },
    ],
    [t, view],
  )

  return (
    <>
      <PageHeader
        eyebrow={t("moderation.eyebrow")}
        title={t("moderation.title")}
        intro={t("moderation.intro")}
      />
      <Tabs
        value={view}
        onValueChange={(v) => {
          setSearch({ view: v === "active" ? undefined : (v as "timeline"), action: undefined })
        }}
        className="mb-4"
      >
        <TabsList>
          {VIEWS.map((v) => (
            <TabsTrigger key={v} value={v}>
              {t(`moderation.views.${v}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("moderation.search")}
        />
        {view === "timeline" && (
          <SelectFilter
            label={t("moderation.columns.action")}
            value={search.action}
            options={MODERATION_ACTIONS.map((a) => ({
              value: a,
              label: t(`moderation.actions.${a}`),
            }))}
            onChange={(action) => {
              setSearch({ action })
            }}
          />
        )}
      </FilterBar>
      <DataTable
        caption={t(`moderation.views.${view}`)}
        columns={columns}
        rows={query.data?.items}
        getRowId={(m) => m.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={
          <EmptyState
            title={view === "active" ? t("moderation.noActive") : t("moderation.noActions")}
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
