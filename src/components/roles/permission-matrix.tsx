import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useBlocker } from "@tanstack/react-router"
import { ChevronDownIcon, LockIcon, ShieldAlertIcon, TriangleAlertIcon } from "lucide-react"
import { useMemo, useRef, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { ErrorState } from "@/components/states/states"
import { PermissionChip } from "@/components/entity/permission-chip"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { apiQuery, callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage, errorCodeMessage } from "@/lib/errors"
import { useMe } from "@/lib/me"
import { can, isRoot, levelOf } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"
import { cn } from "@/lib/utils"
import {
  ESCALATION_KEYS,
  cellKey,
  countOps,
  disabledReason,
  grantsFrom,
  groupByArea,
  isChecked,
  isDangerous,
  keepFailed,
  toOperations,
  toggleCell,
  type MatrixOp,
  type OperationResult,
} from "./matrix-diff"

type PermissionInfo = components["schemas"]["PermissionInfo"]
type Role = components["schemas"]["Role"]

export const matrixQuery = () => apiQuery("/v1/dash/roles/permission-matrix")

/**
 * Role × permission editor (plan 6.9). Toggles go to a local staged diff, never straight to the
 * server; Review lists the diff in words and Save sends one sudo batch. Failed operations stay
 * staged with their error. `roleIds` limits the columns (the per-role page).
 */
export function PermissionMatrix({ roleIds }: { roleIds?: number[] }) {
  const { t } = useTranslation("dashboard")
  const query = useQuery(matrixQuery())
  const { data: me } = useMe()
  const queryClient = useQueryClient()
  const sudo = useSudo()

  const [staged, setStaged] = useState<ReadonlyMap<string, MatrixOp>>(new Map())
  const [failed, setFailed] = useState<ReadonlyMap<string, string>>(new Map())
  const [filter, setFilter] = useState("")
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [reviewOpen, setReviewOpen] = useState(false)
  const [focus, setFocus] = useState<[number, number]>([0, 0])
  const tableRef = useRef<HTMLTableElement>(null)

  const canEdit = can(me, "roles.write", "global") === true
  const viewer = useMemo(
    () => ({
      held: new Set<string>(me?.global.permissions ?? []),
      level: levelOf(me, "global"),
      root: isRoot(me),
    }),
    [me],
  )

  const data = query.data
  const grants = useMemo(() => grantsFrom(data?.grants ?? []), [data])
  const roles = useMemo(
    () =>
      [...(data?.roles ?? [])]
        .filter((r) => !roleIds || roleIds.includes(r.id))
        .sort((a, b) => b.level - a.level),
    [data, roleIds],
  )
  const infoByKey = useMemo(
    () => new Map((data?.permissions ?? []).map((p) => [p.key as string, p])),
    [data],
  )
  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const perms = (data?.permissions ?? []).filter(
      (p) => !needle || p.key.includes(needle) || p.description.toLowerCase().includes(needle),
    )
    return groupByArea(perms)
  }, [data, filter])
  /** Visible keys in display order: arrow-key navigation walks this list. */
  const visibleKeys = useMemo(
    () =>
      groups.flatMap(([area, items]) =>
        collapsed.has(area) && !filter ? [] : items.map((p) => p.key),
      ),
    [groups, collapsed, filter],
  )

  const dirty = staged.size > 0
  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm(t("matrix.discardConfirm")),
    enableBeforeUnload: dirty,
  })

  const save = useMutation({
    mutationFn: () =>
      sudo(() =>
        callApi("post", "/v1/dash/roles/permissions:batch", {
          body: { operations: toOperations(staged) },
        }),
      ),
    onSuccess: ({ results }) => {
      const ok = results.filter((r) => r.ok).length
      const bad = results.filter((r) => !r.ok) as OperationResult[]
      setStaged((prev) => keepFailed(prev, results))
      setFailed(
        new Map(
          bad.map((r) => [
            cellKey(r.role_id, r.permission_key),
            errorCodeMessage(r.error_code ?? ""),
          ]),
        ),
      )
      if (bad.length === 0) {
        toast.success(t("matrix.saved", { count: ok }))
        setReviewOpen(false)
      } else {
        toast.warning(t("matrix.partial", { ok, failed: bad.length }))
      }
    },
    onSettled: () =>
      Promise.all([
        invalidateApi(queryClient, "/v1/dash/roles"),
        invalidateApi(queryClient, "/v1/dash/permissions"),
      ]),
  })

  const toggle = (role: Role, key: string) => {
    if (!canEdit || disabledReason(role, key, viewer)) return
    setStaged((prev) => toggleCell(grants, prev, role.id, key))
    setFailed((prev) => {
      if (!prev.has(cellKey(role.id, key))) return prev
      const next = new Map(prev)
      next.delete(cellKey(role.id, key))
      return next
    })
  }

  const moveFocus = (row: number, col: number) => {
    const r = Math.max(0, Math.min(visibleKeys.length - 1, row))
    const c = Math.max(0, Math.min(roles.length - 1, col))
    setFocus([r, c])
    tableRef.current?.querySelector<HTMLElement>(`[data-cell="${String(r)}:${String(c)}"]`)?.focus()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const [r, c] = focus
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: [r, 0],
      End: [r, roles.length - 1],
    }
    const to = moves[e.key]
    if (!to || !(e.target as HTMLElement).dataset.cell) return
    e.preventDefault()
    moveFocus(to[0], to[1])
  }

  if (query.error) {
    return (
      <ErrorState
        message={isApiError(query.error) ? apiErrorMessage(query.error) : undefined}
        requestId={isApiError(query.error) ? query.error.requestId : null}
        onRetry={() => void query.refetch()}
      />
    )
  }
  if (!data) return <Skeleton className="h-96 rounded-2xl" />

  const counts = countOps(staged)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
          }}
          placeholder={t("matrix.filter")}
          aria-label={t("matrix.filter")}
          className="h-9 w-full max-w-xs rounded-full"
        />
        <p className="text-xs text-muted-foreground">
          {canEdit ? t("matrix.hint") : t("matrix.readOnly")}
        </p>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-2xl border bg-card">
        <table
          ref={tableRef}
          onKeyDown={onKeyDown}
          className="w-full border-separate border-spacing-0 text-sm"
          aria-label={t("matrix.title")}
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 min-w-56 border-b bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                {t("matrix.permission")}
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className="sticky top-0 z-20 min-w-24 border-b bg-card px-2 py-2 text-center text-xs font-medium"
                >
                  <span className="flex items-center justify-center gap-1">
                    {role.immutable && (
                      <LockIcon
                        className="size-3 text-muted-foreground"
                        aria-label={t("roles.builtIn")}
                      />
                    )}
                    {role.name}
                  </span>
                  <span className="tabular block font-normal text-muted-foreground">
                    {t("roles.level", { level: role.level })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([area, items]) => {
              const isCollapsed = collapsed.has(area) && !filter
              return [
                <tr key={`area:${area}`}>
                  <th
                    scope="colgroup"
                    colSpan={roles.length + 1}
                    className="sticky left-0 z-10 border-b bg-secondary/60 px-3 py-1.5 text-left"
                  >
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      className="inline-flex items-center gap-1.5 rounded-md font-mono text-xs font-semibold focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() => {
                        setCollapsed((prev) => {
                          const next = new Set(prev)
                          if (next.has(area)) next.delete(area)
                          else next.add(area)
                          return next
                        })
                      }}
                    >
                      <ChevronDownIcon
                        className={cn("size-3.5 transition-transform", isCollapsed && "-rotate-90")}
                      />
                      {area}.*
                      <span className="font-sans font-normal text-muted-foreground">
                        ({items.length})
                      </span>
                    </button>
                  </th>
                </tr>,
                ...(isCollapsed
                  ? []
                  : items.map((perm) => {
                      const r = visibleKeys.indexOf(perm.key)
                      return (
                        <tr key={perm.key} className="group">
                          <th
                            scope="row"
                            className="sticky left-0 z-10 border-b bg-card px-3 py-1.5 text-left font-normal group-hover:bg-secondary"
                          >
                            <span className="flex items-center gap-1.5">
                              <PermissionChip permission={perm.key} info={perm} />
                              {perm.sudo && (
                                <ShieldAlertIcon
                                  className="size-3.5 text-status-warn"
                                  aria-label={t("permissions.sudo")}
                                />
                              )}
                            </span>
                          </th>
                          {roles.map((role, c) => (
                            <MatrixCell
                              key={role.id}
                              role={role}
                              perm={perm}
                              row={r}
                              col={c}
                              checked={isChecked(grants, staged, role.id, perm.key)}
                              staged={staged.get(cellKey(role.id, perm.key))}
                              failed={failed.get(cellKey(role.id, perm.key))}
                              disabled={
                                !canEdit ? "read_only" : disabledReason(role, perm.key, viewer)
                              }
                              focused={focus[0] === r && focus[1] === c}
                              onFocus={() => {
                                setFocus([r, c])
                              }}
                              onToggle={() => {
                                toggle(role, perm.key)
                              }}
                            />
                          ))}
                        </tr>
                      )
                    })),
              ]
            })}
          </tbody>
        </table>
      </div>

      {dirty && (
        <div
          role="region"
          aria-label={t("matrix.pending")}
          className="sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-accent px-4 py-3"
        >
          <p className="text-sm font-medium">
            {t("matrix.summary", {
              grants: t("matrix.grants", { count: counts.grants }),
              revokes: t("matrix.revokes", { count: counts.revokes }),
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStaged(new Map())
                setFailed(new Map())
              }}
            >
              {t("matrix.discard")}
            </Button>
            <Button
              onClick={() => {
                setReviewOpen(true)
              }}
            >
              {t("matrix.review")}
            </Button>
          </div>
        </div>
      )}

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!save.isPending) setReviewOpen(open)
        }}
        staged={staged}
        failed={failed}
        roles={data.roles}
        infoByKey={infoByKey}
        pending={save.isPending}
        error={
          save.error && !isSudoCancelled(save.error)
            ? isApiError(save.error)
              ? apiErrorMessage(save.error)
              : t("matrix.failed")
            : null
        }
        onSave={() => {
          save.mutate()
        }}
      />
    </div>
  )
}

type CellDisabled = ReturnType<typeof disabledReason> | "read_only"

function MatrixCell({
  role,
  perm,
  row,
  col,
  checked,
  staged,
  failed,
  disabled,
  focused,
  onFocus,
  onToggle,
}: {
  role: Role
  perm: PermissionInfo
  row: number
  col: number
  checked: boolean
  staged: MatrixOp | undefined
  failed: string | undefined
  disabled: CellDisabled
  focused: boolean
  onFocus: () => void
  onToggle: () => void
}) {
  const { t } = useTranslation("dashboard")
  const why = disabled ? t(`matrix.disabled.${disabled}`) : null
  const label = `${perm.key} · ${role.name}`
  return (
    <td
      className={cn(
        "border-b px-2 py-1 text-center group-hover:bg-secondary",
        staged === "grant" && "bg-status-ok/12 group-hover:bg-status-ok/20",
        staged === "revoke" && "bg-status-error/10 group-hover:bg-status-error/20",
        failed && "outline-2 -outline-offset-2 outline-destructive",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled ? true : undefined}
        aria-label={label}
        title={failed ?? why ?? undefined}
        data-cell={`${String(row)}:${String(col)}`}
        tabIndex={focused ? 0 : -1}
        onFocus={onFocus}
        onClick={onToggle}
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </button>
    </td>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  staged,
  failed,
  roles,
  infoByKey,
  pending,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  staged: ReadonlyMap<string, MatrixOp>
  failed: ReadonlyMap<string, string>
  roles: Role[]
  infoByKey: Map<string, PermissionInfo>
  pending: boolean
  error: string | null
  onSave: () => void
}) {
  const { t } = useTranslation("dashboard")
  const ops = toOperations(staged)
  const roleName = (id: number) => roles.find((r) => r.id === id)?.name ?? `#${String(id)}`
  const escalates = ops.some((o) => o.op === "grant" && ESCALATION_KEYS.includes(o.permission_key))
  const dangerous = ops.filter((o) => isDangerous(infoByKey.get(o.permission_key))).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close", { ns: "common" })} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("matrix.reviewTitle", { count: ops.length })}</DialogTitle>
          <DialogDescription>
            {dangerous > 0
              ? t("matrix.reviewDangerous", { count: dangerous })
              : t("matrix.reviewBody")}
          </DialogDescription>
        </DialogHeader>
        <ul className="grid max-h-80 gap-1 overflow-auto text-sm" aria-label={t("matrix.changes")}>
          {ops.map((o) => {
            const k = cellKey(o.role_id, o.permission_key)
            const danger = isDangerous(infoByKey.get(o.permission_key))
            const failure = failed.get(k)
            return (
              <li
                key={k}
                className={cn(
                  "rounded-xl px-3 py-2",
                  danger ? "bg-status-error/10" : "bg-secondary",
                )}
              >
                <span className={cn(danger && "font-medium text-status-error-fg")}>
                  {danger && <TriangleAlertIcon className="mr-1.5 inline size-3.5 align-[-2px]" />}
                  {t(o.op === "grant" ? "matrix.grantLine" : "matrix.revokeLine", {
                    key: o.permission_key,
                    role: roleName(o.role_id),
                  })}
                </span>
                {failure && (
                  <span className="mt-0.5 block text-xs text-destructive">{failure}</span>
                )}
              </li>
            )
          })}
        </ul>
        {escalates && (
          <p
            role="note"
            className="rounded-xl border border-status-warn/40 bg-status-warn/10 px-3 py-2 text-sm"
          >
            {t("matrix.escalationWarning")}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            {t("cancel", { ns: "common" })}
          </Button>
          <Button disabled={pending || ops.length === 0} onClick={onSave}>
            {pending
              ? t("confirm.working", { ns: "common" })
              : t("matrix.save", { count: ops.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
