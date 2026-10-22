import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ShieldAlertIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { PermissionChip } from "@/components/entity/permission-chip"
import { RoleChip } from "@/components/entity/role-chip"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatRelative } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"

type Entry = components["schemas"]["PermissionRegistryEntry"]

const registryQuery = () => apiQuery("/v1/dash/permissions/registry")

const FILTERS = ["orphaned", "sudo", "global", "network"] as const
const searchSchema = z.object({
  q: z.string().optional(),
  show: z.enum(FILTERS).optional().catch(undefined),
})

export const Route = createFileRoute("/_app/admin/permissions")({
  staticData: { pageId: "admin.permissions" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("admin.permissions", context),
  loader: ({ context }) => context.queryClient.query(registryQuery()).catch(() => undefined),
  component: PermissionsPage,
})

function matchesFilter(e: Entry, show: (typeof FILTERS)[number] | undefined) {
  if (show === "orphaned") return e.orphaned_at !== null
  if (show === "sudo") return e.sudo
  if (show === "global" || show === "network") return e.scope === show
  return true
}

/** Read-only view of the backend's registry (code is the source of truth); orphans can go. */
function PermissionsPage() {
  const { t } = useTranslation("dashboard")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery(registryQuery())
  const canDelete = useCan("permissions.write", "global") === true
  const [deleting, setDeleting] = useState<Entry | null>(null)

  const entries = useMemo(() => {
    const needle = search.q?.trim().toLowerCase()
    return (
      (query.data ?? [])
        .filter((e) => matchesFilter(e, search.show))
        .filter(
          (e) =>
            !needle ||
            e.key.includes(needle) ||
            e.description.toLowerCase().includes(needle) ||
            e.routes.some((r) => r.path.toLowerCase().includes(needle)),
        )
        // Orphans first: they are the only thing to act on here.
        .sort(
          (a, b) =>
            Number(b.orphaned_at !== null) - Number(a.orphaned_at !== null) ||
            a.key.localeCompare(b.key),
        )
    )
  }, [query.data, search.q, search.show])
  const orphanCount = (query.data ?? []).filter((e) => e.orphaned_at).length

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  return (
    <>
      <PageHeader
        eyebrow={t("permissions.eyebrow")}
        title={t("permissions.title")}
        intro={t("permissions.intro")}
      />
      {orphanCount > 0 && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-2xl border border-status-warn/40 bg-status-warn/10 px-4 py-3 text-sm"
        >
          <TriangleAlertIcon className="size-4 shrink-0 text-status-warn" />
          {t("permissions.orphanBanner", { count: orphanCount })}
        </p>
      )}
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("permissions.search")}
        />
        <SelectFilter
          label={t("permissions.show")}
          value={search.show}
          options={FILTERS.map((f) => ({ value: f, label: t(`permissions.filters.${f}`) }))}
          onChange={(show) => {
            setSearch({ show })
          }}
        />
      </FilterBar>
      {query.error ? (
        <ErrorState
          message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
          requestId={isApiError(query.error) ? query.error.requestId : null}
          onRetry={() => void query.refetch()}
        />
      ) : query.data && entries.length === 0 ? (
        <EmptyState title={t("permissions.noMatch")} />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table aria-busy={query.isPending}>
            <caption className="sr-only">{t("permissions.title")}</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("permissions.columns.key")}</TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t("permissions.columns.routes")}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("permissions.columns.roles")}
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("permissions.columns.seen")}
                </TableHead>
                <TableHead>
                  <span className="sr-only">{t("permissions.columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!query.data
                ? Array.from({ length: 10 }, (_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell colSpan={5}>
                        <Skeleton className="h-5" />
                      </TableCell>
                    </TableRow>
                  ))
                : entries.map((e) => (
                    <TableRow key={e.key} className="align-top">
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PermissionChip permission={e.key} info={e} className="font-semibold" />
                          <Badge variant="outline">{t(`permissions.scope.${e.scope}`)}</Badge>
                          {e.sudo && (
                            <Badge variant="warn">
                              <ShieldAlertIcon />
                              {t("permissions.sudo")}
                            </Badge>
                          )}
                          {e.orphaned_at && (
                            <Badge variant="error">{t("permissions.orphaned")}</Badge>
                          )}
                        </div>
                        <p className="mt-1 max-w-md text-xs text-muted-foreground">
                          {e.description}
                        </p>
                      </TableCell>
                      <TableCell className="hidden whitespace-normal lg:table-cell">
                        {e.routes.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {t("permissions.noRoutes")}
                          </span>
                        ) : (
                          <ul className="grid gap-0.5 font-mono text-xs">
                            {e.routes.map((r) => (
                              <li key={`${r.method} ${r.path}`}>
                                <span className="inline-block w-14 font-semibold">{r.method}</span>
                                {r.path}
                                {r.sudo && (
                                  <ShieldAlertIcon
                                    className="ml-1 inline size-3 text-status-warn"
                                    aria-label={t("permissions.sudo")}
                                  />
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell className="hidden whitespace-normal md:table-cell">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {e.roles.map((r) => (
                            <RoleChip key={r.id} role={r} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        <span title={formatDateTime(e.first_registered_at)}>
                          {t("permissions.firstSeen", {
                            date: formatDateTime(e.first_registered_at, { dateStyle: "medium" }),
                          })}
                        </span>
                        <br />
                        <span title={formatDateTime(e.last_seen_at)}>
                          {e.orphaned_at
                            ? t("permissions.orphanedAt", { when: formatRelative(e.orphaned_at) })
                            : t("permissions.lastSeen", { when: formatRelative(e.last_seen_at) })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {e.orphaned_at && canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeleting(e)
                            }}
                          >
                            <Trash2Icon />
                            {t("permissions.delete")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}
      <DeleteOrphanDialog
        entry={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      />
    </>
  )
}

/** L3: type the key, sudo, then the key and its grants are gone. */
function DeleteOrphanDialog({
  entry,
  onOpenChange,
}: {
  entry: Entry | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("dashboard")
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const remove = useMutation({
    mutationFn: (key: string) =>
      sudo(() => callApi("delete", "/v1/dash/permissions/{key}", { params: { path: { key } } })),
    onSuccess: (_data, key) => {
      toast.success(t("permissions.deleted", { key }))
      onOpenChange(false)
    },
    onSettled: () =>
      Promise.all([
        invalidateApi(queryClient, "/v1/dash/permissions"),
        invalidateApi(queryClient, "/v1/dash/roles"),
      ]),
  })
  const error =
    remove.error && !isSudoCancelled(remove.error)
      ? isApiError(remove.error)
        ? apiErrorMessage(remove.error)
        : t("permissions.deleteFailed")
      : null
  return (
    <ConfirmDialog
      open={entry !== null}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
      title={t("permissions.deleteTitle", { key: entry?.key ?? "" })}
      effect={t("permissions.deleteEffect", { count: entry?.roles.length ?? 0 })}
      typeToConfirm={entry?.key}
      confirmLabel={t("permissions.delete")}
      pending={remove.isPending}
      error={error}
      onConfirm={() => {
        if (entry) remove.mutate(entry.key)
      }}
    />
  )
}
