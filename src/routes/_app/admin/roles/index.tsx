import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { LockIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import { rolesQuery } from "@/components/entity/role-chip"
import { PageHeader } from "@/components/layout/page-header"
import { matrixQuery, PermissionMatrix } from "@/components/roles/permission-matrix"
import { RoleFormDialog } from "@/components/roles/role-form-dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { apiErrorMessage } from "@/lib/errors"
import { formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"
import { useCan } from "@/lib/permissions"

const VIEWS = ["list", "matrix"] as const

export const Route = createFileRoute("/_app/admin/roles/")({
  staticData: { pageId: "admin.roles" },
  validateSearch: z.object({ view: z.enum(VIEWS).optional().catch(undefined) }),
  beforeLoad: ({ context }) => assertPage("admin.roles", context),
  loaderDeps: ({ search }) => ({ view: search.view }),
  loader: ({ context, deps }) =>
    (deps.view === "matrix"
      ? context.queryClient.query(matrixQuery())
      : context.queryClient.query(rolesQuery())
    ).catch(() => undefined),
  component: RolesPage,
})

function RolesPage() {
  const { t } = useTranslation("dashboard")
  const { view = "list" } = Route.useSearch()
  const navigate = Route.useNavigate()
  const canWrite = useCan("roles.write", "global") === true
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        eyebrow={t("roles.eyebrow")}
        title={t("roles.title")}
        intro={t("roles.intro")}
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setCreating(true)
              }}
            >
              <PlusIcon />
              {t("roles.create")}
            </Button>
          )
        }
      />
      <Tabs
        value={view}
        onValueChange={(v) =>
          void navigate({ search: { view: v === "list" ? undefined : (v as "matrix") } })
        }
        className="mb-4"
      >
        <TabsList>
          {VIEWS.map((v) => (
            <TabsTrigger key={v} value={v}>
              {t(`roles.views.${v}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {view === "matrix" ? <PermissionMatrix /> : <RolesList />}
      <RoleFormDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}

function RolesList() {
  const { t } = useTranslation("dashboard")
  const query = useQuery(rolesQuery())
  // Highest level first: that is also the order in which roles can manage each other.
  const roles = query.data ? [...query.data].sort((a, b) => b.level - a.level) : undefined

  if (query.error)
    return (
      <ErrorState
        message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
        requestId={isApiError(query.error) ? query.error.requestId : null}
        onRetry={() => void query.refetch()}
      />
    )
  if (roles?.length === 0) return <EmptyState title={t("roles.empty")} />
  return (
    <div className="rounded-2xl border bg-card">
      <Table aria-busy={query.isPending}>
        <caption className="sr-only">{t("roles.title")}</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("roles.columns.role")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("roles.columns.description")}</TableHead>
            <TableHead className="text-right">{t("roles.columns.level")}</TableHead>
            <TableHead className="text-right">{t("roles.columns.members")}</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              {t("roles.columns.permissions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!roles
            ? Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5" />
                  </TableCell>
                </TableRow>
              ))
            : roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/roles/$roleId"
                        params={{ roleId: r.id }}
                        className="font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                      {r.immutable && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1" tabIndex={0}>
                              <LockIcon className="size-3" />
                              {t("roles.builtIn")}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{t("roles.builtInHint")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{r.key}</span>
                  </TableCell>
                  <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">
                    {r.description}
                  </TableCell>
                  <TableCell className="tabular text-right">{r.level}</TableCell>
                  <TableCell className="tabular text-right">
                    {formatNumber(r.member_count)}
                  </TableCell>
                  <TableCell className="tabular hidden text-right sm:table-cell">
                    {formatNumber(r.permission_count)}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
