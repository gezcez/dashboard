import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { UserPlusIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import { tableSearchSchema, type Page } from "@/api/pagination"
import type { components } from "@/api/schema.gen"
import { CursorPager } from "@/components/data-table/cursor-pager"
import { DataTable } from "@/components/data-table/data-table"
import { FilterBar, SearchFilter, SelectFilter } from "@/components/data-table/filters"
import { AuditInfo } from "@/components/entity/misc-chips"
import { RoleChip } from "@/components/entity/role-chip"
import { UserChip } from "@/components/entity/user-chip"
import { PageHeader } from "@/components/layout/page-header"
import { AddMemberDialog } from "@/components/members/add-member-dialog"
import { assignRoles } from "@/components/roles/assign"
import { EmptyState } from "@/components/states/states"
import { Button } from "@/components/ui/button"
import { apiQuery, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatRelative } from "@/lib/format"
import { useMe } from "@/lib/me"
import { assertPage } from "@/lib/pages"
import { can, isRoot, levelOf } from "@/lib/permissions"
import { useSudo } from "@/lib/use-sudo"

type Member = components["schemas"]["Member"]
type RoleRef = components["schemas"]["RoleRef"]

const searchSchema = tableSearchSchema.extend({ role: z.string().optional() })
type Search = z.infer<typeof searchSchema>

const membersQuery = (networkId: number, search: Search) =>
  apiQuery("/v1/dash/networks/{networkId}/members", {
    params: { path: { networkId: String(networkId) }, query: { limit: 50, ...search } },
  })

export const Route = createFileRoute("/_app/n/$network/members")({
  staticData: { pageId: "network.members" },
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => assertPage("network.members", context),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(membersQuery(context.network.id, deps)).catch(() => undefined),
  component: MembersPage,
})

/**
 * Users holding roles in this network (plan 6.10). Network admins manage their network here and
 * never see the global user list. Removing a role is optimistic with an undo toast.
 */
function MembersPage() {
  const { t } = useTranslation("dashboard")
  const { network } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const { data: me } = useMe()
  const options = membersQuery(network.id, search)
  const query = useQuery({ ...options, placeholderData: keepPreviousData })
  const [adding, setAdding] = useState(false)

  const scope = { network: network.id }
  const canWrite = can(me, "members.roles.write", scope) === true
  const myLevel = isRoot(me) ? Infinity : levelOf(me, scope)
  const canRemove = (member: Member, role: RoleRef) =>
    canWrite && member.user.id !== me?.user.id && role.level < myLevel

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ search: (prev) => ({ ...prev, cursor: undefined, ...patch }), replace: true })
  const filtered = Boolean(search.q || search.role)

  const roleOps = useMutation({
    mutationFn: (v: { userId: string; role: RoleRef; op: "grant" | "revoke" }) =>
      assignRoles(sudo, v.userId, network, [{ role_id: v.role.id, op: v.op }]),
    onMutate: async (v) => {
      if (v.op !== "revoke") return undefined
      await queryClient.cancelQueries({ queryKey: options.queryKey })
      const previous = queryClient.getQueryData<Page<Member>>(options.queryKey)
      queryClient.setQueryData<Page<Member>>(options.queryKey, (page) =>
        page
          ? {
              ...page,
              items: page.items.map((m) =>
                m.user.id === v.userId
                  ? { ...m, roles: m.roles.filter((r) => r.role.id !== v.role.id) }
                  : m,
              ),
            }
          : page,
      )
      return { previous }
    },
    onError: (error, v, context) => {
      if (context?.previous) queryClient.setQueryData(options.queryKey, context.previous)
      toast.error(
        isApiError(error)
          ? apiErrorMessage(error)
          : t(v.op === "revoke" ? "members.removeFailed" : "members.undoFailed"),
      )
    },
    onSettled: () =>
      Promise.all([
        invalidateApi(queryClient, "/v1/dash/networks/{networkId}/members"),
        invalidateApi(queryClient, "/v1/dash/users"),
      ]),
  })

  const removeRole = (member: Member, role: RoleRef) => {
    roleOps.mutate(
      { userId: member.user.id, role, op: "revoke" },
      {
        onSuccess: () => {
          toast.success(t("members.removed", { role: role.name, name: member.user.display_name }), {
            action: {
              label: t("members.undo"),
              onClick: () => {
                roleOps.mutate({ userId: member.user.id, role, op: "grant" })
              },
            },
          })
        },
      },
    )
  }

  const assignable = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/members/assignable-roles", {
      params: { path: { networkId: String(network.id) } },
    }),
    enabled: canWrite,
  }).data

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        id: "user",
        header: t("members.columns.member"),
        meta: { sortKey: "display_name" },
        cell: ({ row }) => <UserChip user={row.original.user} link />,
      },
      {
        id: "email",
        header: t("members.columns.email"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.email_masked}
          </span>
        ),
      },
      {
        id: "roles",
        header: t("members.columns.roles"),
        meta: { sortKey: "level", firstDir: "desc", className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((r) => (
              <RoleChip
                key={r.role.id}
                role={r.role}
                onRemove={
                  canRemove(row.original, r.role)
                    ? () => {
                        removeRole(row.original, r.role)
                      }
                    : undefined
                }
                removeLabel={t("members.removeRole", {
                  role: r.role.name,
                  name: row.original.user.display_name,
                })}
              />
            ))}
          </div>
        ),
      },
      {
        id: "granted",
        header: t("members.columns.granted"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => {
          // The most recent grant: who added this person (or their latest role) and when.
          const latest = [...row.original.roles].sort((a, b) =>
            b.granted_at.localeCompare(a.granted_at),
          )[0]
          return latest ? <AuditInfo by={latest.granted_by} at={latest.granted_at} compact /> : null
        },
      },
      {
        id: "last_active_at",
        header: t("members.columns.lastActive"),
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.last_active_at)}>
            {formatRelative(row.original.last_active_at)}
          </span>
        ),
      },
    ],
    // canRemove and removeRole read me and the mutation, which are stable across renders here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, me, canWrite],
  )

  return (
    <>
      <PageHeader
        eyebrow={network.name}
        title={t("members.title")}
        intro={t("members.intro")}
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setAdding(true)
              }}
            >
              <UserPlusIcon />
              {t("members.add")}
            </Button>
          )
        }
      />
      <FilterBar>
        <SearchFilter
          value={search.q}
          onChange={(q) => {
            setSearch({ q })
          }}
          placeholder={t("members.search")}
        />
        <SelectFilter
          label={t("users.role")}
          value={search.role}
          options={(assignable ?? []).map((r) => ({ value: r.key, label: r.name }))}
          onChange={(role) => {
            setSearch({ role })
          }}
        />
      </FilterBar>
      <DataTable
        caption={t("members.title")}
        columns={columns}
        rows={query.data?.items}
        getRowId={(m) => m.user.id}
        isPending={query.isPending}
        isFetching={query.isPlaceholderData}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={search.sort}
        onSortChange={(sort) => {
          setSearch({ sort })
        }}
        empty={
          <EmptyState title={filtered ? t("members.noMatch") : t("members.empty")}>
            {!filtered && canWrite ? t("members.emptyBody") : null}
          </EmptyState>
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
      {canWrite && (
        <AddMemberDialog
          network={network}
          roles={assignable ?? []}
          open={adding}
          onOpenChange={setAdding}
        />
      )}
    </>
  )
}
