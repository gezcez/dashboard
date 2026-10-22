import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { ConfirmDialog } from "@/components/confirm/confirm-dialog"
import { AuditInfo, NetworkChip } from "@/components/entity/misc-chips"
import { RoleChip, rolesQuery } from "@/components/entity/role-chip"
import { assignRoles } from "@/components/roles/assign"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiQuery, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { useMe, type Me } from "@/lib/me"
import { can, isRoot, levelOf } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"

type DashUser = components["schemas"]["DashUser"]
type Assignment = components["schemas"]["RoleAssignment"]
type NetworkRef = components["schemas"]["NetworkRef"]

/** Can the viewer change roles of `level` in this scope? Mirrors backend 6.4 (root bypasses). */
function canManage(me: Me | undefined, network: NetworkRef | null, level: number): boolean {
  const allowed = network
    ? can(me, "members.roles.write", { network: network.id })
    : can(me, "roles.assign", "global")
  if (!allowed) return false
  if (isRoot(me)) return true
  return levelOf(me, network ? { network: network.id } : "global") > level
}

/** Networks the viewer may assign roles in (all of them with a global members.roles.write). */
function useManageableNetworks(me: Me | undefined): NetworkRef[] {
  const all = can(me, "members.roles.write", "global") === true
  const list = useQuery({
    ...apiQuery("/v1/dash/networks", { params: { query: { limit: 200 } } }),
    enabled: all,
  }).data?.items
  if (all) return (list ?? []).map((n) => ({ id: n.id, slug: n.slug, name: n.name }))
  return (me?.networks ?? [])
    .filter((n) => n.permissions.includes("members.roles.write"))
    .map((n) => ({ id: n.id, slug: n.slug, name: n.name }))
}

export function RolesTab({ user }: { user: DashUser }) {
  const { t } = useTranslation("dashboard")
  const { data: me } = useMe()
  const self = me?.user.id === user.id
  const networks = useManageableNetworks(me)
  const canAddGlobal = can(me, "roles.assign", "global") === true
  const canAdd = !self && (canAddGlobal || networks.length > 0)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Assignment | null>(null)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {self ? t("user.roles.selfHint") : t("user.roles.hint")}
        </p>
        {canAdd && (
          <Button
            size="sm"
            onClick={() => {
              setAdding(true)
            }}
          >
            <PlusIcon />
            {t("user.roles.add")}
          </Button>
        )}
      </div>
      {user.roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("user.roles.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <caption className="sr-only">{t("user.tabs.roles")}</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("user.roles.role")}</TableHead>
                <TableHead>{t("user.roles.scope")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("user.roles.granted")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("user.roles.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.roles.map((a) => (
                <TableRow key={`${String(a.role.id)}:${String(a.network?.id ?? "g")}`}>
                  <TableCell>
                    <RoleChip role={a.role} />{" "}
                    <span className="text-xs text-muted-foreground">
                      {t("roles.level", { level: a.role.level })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {a.network ? (
                      <NetworkChip network={a.network} />
                    ) : (
                      <Badge variant="brand">{t("user.roles.global")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <AuditInfo by={a.granted_by} at={a.granted_at} />
                  </TableCell>
                  <TableCell className="text-right">
                    {!self && canManage(me, a.network, a.role.level) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRemoving(a)
                        }}
                      >
                        {t("user.roles.remove")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {canAdd && (
        <AddRoleDialog
          user={user}
          me={me}
          networks={networks}
          canGlobal={canAddGlobal}
          open={adding}
          onOpenChange={setAdding}
        />
      )}
      <RemoveRoleDialog
        user={user}
        assignment={removing}
        onClose={() => {
          setRemoving(null)
        }}
      />
    </div>
  )
}

const selectClass =
  "h-9 w-full rounded-xl border bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

function AddRoleDialog({
  user,
  me,
  networks,
  canGlobal,
  open,
  onOpenChange,
}: {
  user: DashUser
  me: Me | undefined
  networks: NetworkRef[]
  canGlobal: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const [scope, setScope] = useState<string>(canGlobal ? "global" : String(networks[0]?.id ?? ""))
  const [roleId, setRoleId] = useState<string>("")
  const network = scope === "global" ? null : (networks.find((n) => String(n.id) === scope) ?? null)

  const allRoles = useQuery(rolesQuery()).data ?? []
  const assignable = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/members/assignable-roles", {
      params: { path: { networkId: String(network?.id ?? 0) } },
    }),
    enabled: open && network !== null,
  }).data
  const options = (
    network
      ? (assignable ?? [])
      : allRoles.filter((r) => r.key !== "root" && canManage(me, null, r.level))
  )
    .filter((r) => !user.roles.some((a) => a.role.id === r.id && a.network?.id === network?.id))
    .sort((a, b) => b.level - a.level)

  const grant = useMutation({
    mutationFn: () =>
      assignRoles(sudo, user.id, network, [{ role_id: Number(roleId), op: "grant" }]),
    onSuccess: () => {
      const role = options.find((r) => String(r.id) === roleId)
      toast.success(
        t("user.roles.grantedToast", {
          role: role?.name ?? "",
          scope: network?.name ?? t("user.roles.global"),
        }),
      )
      setRoleId("")
      onOpenChange(false)
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/users"),
  })
  const error =
    grant.error && !isSudoCancelled(grant.error)
      ? isApiError(grant.error)
        ? apiErrorMessage(grant.error)
        : t("user.roles.failed")
      : null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (grant.isPending) return
        if (!next) grant.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent closeLabel={t("close", { ns: "common" })}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (roleId) grant.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("user.roles.addTitle", { name: user.display_name })}</DialogTitle>
            <DialogDescription>{t("user.roles.addBody")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-scope`}>{t("user.roles.scope")}</Label>
            <select
              id={`${id}-scope`}
              className={selectClass}
              value={scope}
              onChange={(e) => {
                setScope(e.target.value)
                setRoleId("")
              }}
            >
              {canGlobal && <option value="global">{t("user.roles.global")}</option>}
              {networks.map((n) => (
                <option key={n.id} value={String(n.id)}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-role`}>{t("user.roles.role")}</Label>
            <select
              id={`${id}-role`}
              className={selectClass}
              value={roleId}
              aria-describedby={`${id}-role-hint`}
              onChange={(e) => {
                setRoleId(e.target.value)
              }}
            >
              <option value="">{t("user.roles.pick")}</option>
              {options.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name} · {t("roles.level", { level: r.level })}
                </option>
              ))}
            </select>
            <p id={`${id}-role-hint`} className="text-xs text-muted-foreground">
              {scope === "global" ? t("user.roles.globalHint") : t("user.roles.levelHint")}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={grant.isPending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={!roleId || grant.isPending}>
              {grant.isPending ? t("confirm.working", { ns: "common" }) : t("user.roles.grant")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** L2: names the role and scope. Global revokes are sudo. */
function RemoveRoleDialog({
  user,
  assignment,
  onClose,
}: {
  user: DashUser
  assignment: Assignment | null
  onClose: () => void
}) {
  const { t } = useTranslation("dashboard")
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const revoke = useMutation({
    mutationFn: (a: Assignment) =>
      assignRoles(sudo, user.id, a.network, [{ role_id: a.role.id, op: "revoke" }]),
    onSuccess: () => {
      toast.success(t("user.roles.removed"))
      onClose()
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/users"),
  })
  const error =
    revoke.error && !isSudoCancelled(revoke.error)
      ? isApiError(revoke.error)
        ? apiErrorMessage(revoke.error)
        : t("user.roles.failed")
      : null
  const scope = assignment?.network?.name ?? t("user.roles.global")
  return (
    <ConfirmDialog
      open={assignment !== null}
      onOpenChange={(open) => {
        if (!open) {
          revoke.reset()
          onClose()
        }
      }}
      title={t("user.roles.removeTitle", { role: assignment?.role.name ?? "" })}
      effect={t("user.roles.removeEffect", {
        name: user.display_name,
        role: assignment?.role.name ?? "",
        scope,
      })}
      confirmLabel={t("user.roles.remove")}
      pending={revoke.isPending}
      error={error}
      onConfirm={() => {
        if (assignment) revoke.mutate(assignment)
      }}
    />
  )
}
