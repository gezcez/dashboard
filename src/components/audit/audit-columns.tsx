import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"
import { UserChip } from "@/components/entity/user-chip"
import { Badge } from "@/components/ui/badge"
import { diffObjects, formatValue } from "@/lib/diff"
import { formatDateTime, formatRelative } from "@/lib/format"
import { useMe } from "@/lib/me"
import { cn } from "@/lib/utils"

type Entry = components["schemas"]["AuditEntry"]

const SEVERITY = { info: "default", warn: "warn", critical: "error" } as const

/** Columns shared by the platform audit log, network audit and a user's activity tab. */
export function useAuditColumns({ network = true }: { network?: boolean } = {}) {
  const { t } = useTranslation("dashboard")
  const { data: me } = useMe()
  const networkName = (id: number | null) =>
    id === null ? null : (me?.networks.find((n) => n.id === id)?.name ?? `#${String(id)}`)

  return useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        id: "at",
        header: t("audit.columns.when"),
        meta: { sortKey: "at", firstDir: "desc" },
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.at)} className="text-muted-foreground">
            {formatRelative(row.original.at)}
          </span>
        ),
      },
      {
        id: "action",
        header: t("audit.columns.action"),
        cell: ({ row }) => (
          <Badge variant={SEVERITY[row.original.severity]} className="font-mono">
            {row.original.action}
          </Badge>
        ),
      },
      {
        id: "actor",
        header: t("audit.columns.actor"),
        meta: { hideOnMobile: true },
        cell: ({ row }) =>
          row.original.actor ? (
            <UserChip user={row.original.actor} link />
          ) : (
            <span className="text-muted-foreground">{t("audit.system")}</span>
          ),
      },
      {
        id: "target",
        header: t("audit.columns.target"),
        meta: { className: "w-full max-w-0 sm:max-w-none" },
        cell: ({ row }) => {
          const e = row.original
          if (!e.target_label) return <span className="text-muted-foreground">–</span>
          return (
            <span className="flex min-w-0 items-center gap-2">
              {e.target_type && (
                <span className="text-xs text-muted-foreground">{e.target_type}</span>
              )}
              {e.target_type === "user" && e.target_id ? (
                <Link
                  to="/admin/users/$userId"
                  params={{ userId: e.target_id }}
                  className="truncate hover:underline"
                >
                  {e.target_label}
                </Link>
              ) : (
                <span className="truncate">{e.target_label}</span>
              )}
            </span>
          )
        },
      },
      ...(network
        ? [
            {
              id: "network",
              header: t("audit.columns.network"),
              meta: { hideOnMobile: true },
              cell: ({ row }) => networkName(row.original.network_id) ?? "–",
            } satisfies ColumnDef<Entry>,
          ]
        : []),
    ],
    // networkName reads `me`, which only changes on refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, me, network],
  )
}

const KIND_CLASS = {
  added: "text-status-ok",
  removed: "text-destructive line-through",
  changed: "",
  same: "text-muted-foreground",
} as const

export function AuditDetail({ entry }: { entry: Entry }) {
  const { t } = useTranslation("dashboard")
  const rows = diffObjects(entry.before, entry.after)
  return (
    <div className="grid gap-4 py-2 lg:grid-cols-[1fr_2fr]">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">{t("audit.detail.at")}</dt>
        <dd>{formatDateTime(entry.at, { dateStyle: "medium", timeStyle: "medium" })}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.id")}</dt>
        <dd className="font-mono">{entry.id}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.requestId")}</dt>
        <dd className="font-mono">{entry.request_id ?? "–"}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.ip")}</dt>
        <dd className="font-mono">{entry.ip_prefix ?? "–"}</dd>
        <dt className="text-muted-foreground">{t("audit.detail.target")}</dt>
        <dd className="font-mono break-all">
          {entry.target_type ?? "–"}
          {entry.target_id ? ` · ${entry.target_id}` : ""}
        </dd>
      </dl>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("audit.detail.noChanges")}</p>
      ) : (
        <table className="w-full text-xs">
          <caption className="sr-only">{t("audit.detail.changes")}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-4 font-medium">{t("audit.detail.field")}</th>
              <th className="py-1 pr-4 font-medium">{t("audit.detail.before")}</th>
              <th className="py-1 font-medium">{t("audit.detail.after")}</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => (
              <tr key={r.key} className="border-t align-top">
                <td className="py-1 pr-4">{r.key}</td>
                <td
                  className={cn(
                    "py-1 pr-4 break-all",
                    r.kind === "changed" ? "text-destructive line-through" : KIND_CLASS[r.kind],
                  )}
                >
                  {formatValue(r.before)}
                </td>
                <td
                  className={cn(
                    "py-1 break-all",
                    r.kind === "changed"
                      ? "text-status-ok"
                      : r.kind === "removed"
                        ? ""
                        : KIND_CLASS[r.kind],
                  )}
                >
                  {formatValue(r.after)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
