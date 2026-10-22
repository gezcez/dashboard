import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { LockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState } from "@/components/states/states"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { apiQuery } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatNumber } from "@/lib/format"
import { assertPage } from "@/lib/pages"

const rolesQuery = () => apiQuery("/v1/dash/roles")

export const Route = createFileRoute("/_app/admin/roles")({
  staticData: { pageId: "admin.roles" },
  beforeLoad: ({ context }) => assertPage("admin.roles", context),
  loader: ({ context }) => context.queryClient.query(rolesQuery()).catch(() => undefined),
  component: RolesPage,
})

function RolesPage() {
  const { t } = useTranslation("dashboard")
  const query = useQuery(rolesQuery())
  // Highest level first: that is also the order in which roles can manage each other.
  const roles = query.data ? [...query.data].sort((a, b) => b.level - a.level) : undefined

  return (
    <>
      <PageHeader eyebrow={t("roles.eyebrow")} title={t("roles.title")} intro={t("roles.intro")} />
      {query.error ? (
        <ErrorState
          message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
          requestId={isApiError(query.error) ? query.error.requestId : null}
          onRetry={() => void query.refetch()}
        />
      ) : roles?.length === 0 ? (
        <EmptyState title={t("roles.empty")} />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table aria-busy={query.isPending}>
            <caption className="sr-only">{t("roles.title")}</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("roles.columns.role")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("roles.columns.description")}
                </TableHead>
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
                          <span className="font-medium">{r.name}</span>
                          {r.immutable && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="gap-1">
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
      )}
    </>
  )
}
