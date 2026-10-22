import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeftIcon, LockIcon, PencilIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import { NetworkChip } from "@/components/entity/misc-chips"
import { PageHeader } from "@/components/layout/page-header"
import { PermissionMatrix } from "@/components/roles/permission-matrix"
import { RoleFormDialog } from "@/components/roles/role-form-dialog"
import { ErrorState, NotFoundState, PageSkeleton } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiQuery } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"

const roleQuery = (roleId: number) =>
  apiQuery("/v1/dash/roles/{roleId}", { params: { path: { roleId } } })

export const Route = createFileRoute("/_app/admin/roles/$roleId")({
  staticData: { pageId: "admin.roles" },
  params: {
    parse: ({ roleId }) => ({ roleId: Number(roleId) }),
    stringify: ({ roleId }) => ({ roleId: String(roleId) }),
  },
  beforeLoad: ({ context }) => assertPage("admin.roles", context),
  loader: async ({ context, params }) => {
    if (!Number.isInteger(params.roleId)) throw notFound()
    try {
      await context.queryClient.query(roleQuery(params.roleId))
    } catch (error) {
      if (isApiError(error, "NOT_FOUND")) throw notFound()
    }
  },
  notFoundComponent: RoleNotFound,
  component: RolePage,
})

function RoleNotFound() {
  const { t } = useTranslation("dashboard")
  return <NotFoundState title={t("role.notFoundTitle")} body={t("role.notFoundBody")} />
}

function RolePage() {
  const { t } = useTranslation("dashboard")
  const { roleId } = Route.useParams()
  const query = useQuery(roleQuery(roleId))
  const canWrite = useCan("roles.write", "global") === true
  const [editing, setEditing] = useState(false)
  const role = query.data

  const back = (
    <Link
      to="/admin/roles"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      {t("role.back")}
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
  if (!role) return <PageSkeleton />

  return (
    <>
      {back}
      <PageHeader
        eyebrow={t("role.eyebrow")}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {role.name}
            {role.immutable && (
              <Badge variant="outline" className="gap-1 text-xs">
                <LockIcon />
                {t("roles.builtIn")}
              </Badge>
            )}
          </span>
        }
        intro={role.description}
        actions={
          canWrite &&
          !role.immutable && (
            <Button
              variant="outline"
              onClick={() => {
                setEditing(true)
              }}
            >
              <PencilIcon />
              {t("role.edit")}
            </Button>
          )
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("role.details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("roles.form.key")}</dt>
              <dd className="font-mono">{role.key}</dd>
              <dt className="text-muted-foreground">{t("roles.columns.level")}</dt>
              <dd className="tabular">{role.level}</dd>
              <dt className="text-muted-foreground">{t("roles.columns.permissions")}</dt>
              <dd className="tabular">{formatNumber(role.permission_count)}</dd>
              <dt className="text-muted-foreground">{t("role.created")}</dt>
              <dd>{formatDateTime(role.created_at, { dateStyle: "medium" })}</dd>
              <dt className="text-muted-foreground">{t("role.updated")}</dt>
              <dd>{formatDateTime(role.updated_at)}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("role.membersByNetwork", { count: role.member_count })}</CardTitle>
          </CardHeader>
          <CardContent>
            {role.members_by_network.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("role.noMembers")}</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {role.members_by_network.map((m) => (
                  <li
                    key={m.network?.id ?? "global"}
                    className="flex items-center justify-between gap-3"
                  >
                    {m.network ? (
                      <NetworkChip network={m.network} />
                    ) : (
                      <span className="font-medium">{t("role.global")}</span>
                    )}
                    <Link
                      to="/admin/users"
                      search={{ role: role.key, network_id: m.network?.id }}
                      className="tabular text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {t("role.memberCount", { count: m.count, formatted: formatNumber(m.count) })}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <h2 className="mb-3 text-lg font-semibold">{t("role.permissions")}</h2>
      <PermissionMatrix roleIds={[role.id]} />
      {canWrite && !role.immutable && (
        <RoleFormDialog role={role} open={editing} onOpenChange={setEditing} />
      )}
    </>
  )
}
