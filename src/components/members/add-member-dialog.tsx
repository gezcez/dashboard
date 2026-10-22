import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
import { useDebouncedValue } from "@/components/data-table/use-debounced-value"
import { initialsOf } from "@/components/entity/user-chip"
import { assignRoles } from "@/components/roles/assign"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Label } from "@/components/ui/label"
import { apiQuery, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { useCan } from "@/lib/permissions"
import { useSudo } from "@/lib/use-sudo"
import { cn } from "@/lib/utils"

type UserRef = components["schemas"]["UserRef"]
type RoleRef = components["schemas"]["RoleRef"]

/**
 * Find a user by username (or exact email with users.pii.read) and grant roles in this network.
 * `roles` comes from assignable-roles, so it only holds roles below the executor's level.
 */
export function AddMemberDialog({
  network,
  roles,
  open,
  onOpenChange,
}: {
  network: { id: number; name: string }
  roles: RoleRef[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const canEmail = useCan("users.pii.read", "global") === true
  const [q, setQ] = useState("")
  const [user, setUser] = useState<UserRef | null>(null)
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set())
  const term = useDebouncedValue(q.trim())

  useEffect(() => {
    if (!open) {
      setQ("")
      setUser(null)
      setPicked(new Set())
    }
  }, [open])

  const candidates = useQuery({
    ...apiQuery("/v1/dash/networks/{networkId}/members/candidates", {
      params: { path: { networkId: String(network.id) }, query: { q: term } },
    }),
    enabled: open && term.length >= 2 && !user,
  })

  const add = useMutation({
    mutationFn: () =>
      assignRoles(
        sudo,
        user?.id ?? "",
        network,
        [...picked].map((role_id) => ({ role_id, op: "grant" as const })),
      ),
    onSuccess: () => {
      toast.success(t("members.added", { name: user?.display_name ?? "", network: network.name }))
      onOpenChange(false)
    },
    onSettled: () =>
      Promise.all([
        invalidateApi(queryClient, "/v1/dash/networks/{networkId}/members"),
        invalidateApi(queryClient, "/v1/dash/users"),
      ]),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (add.isPending) return
        if (!next) add.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent closeLabel={t("close", { ns: "common" })}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (user && picked.size > 0) add.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("members.addTitle", { network: network.name })}</DialogTitle>
            <DialogDescription>{t("members.addBody")}</DialogDescription>
          </DialogHeader>

          {user ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
              <span className="flex items-center gap-2 text-sm">
                <Avatar className="size-7 text-[0.65rem]">
                  <AvatarFallback>{initialsOf(user.display_name)}</AvatarFallback>
                </Avatar>
                <span>
                  <span className="block font-medium">{user.display_name}</span>
                  {user.username && (
                    <span className="block text-xs text-muted-foreground">@{user.username}</span>
                  )}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUser(null)
                }}
              >
                {t("members.change")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor={`${id}-q`}>{t("members.find")}</Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${id}-q`}
                  value={q}
                  autoComplete="off"
                  className="pl-9"
                  aria-describedby={`${id}-q-hint`}
                  onChange={(e) => {
                    setQ(e.target.value)
                  }}
                />
              </div>
              <p id={`${id}-q-hint`} className="text-xs text-muted-foreground">
                {canEmail ? t("members.findHintEmail") : t("members.findHint")}
              </p>
              {term.length >= 2 && (
                <ul
                  aria-label={t("members.results")}
                  aria-busy={candidates.isFetching}
                  className="grid max-h-52 gap-1 overflow-auto"
                >
                  {candidates.data?.length === 0 && (
                    <li className="px-3 py-2 text-sm text-muted-foreground">
                      {t("members.noCandidates")}
                    </li>
                  )}
                  {candidates.data?.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                        onClick={() => {
                          setUser(c)
                        }}
                      >
                        <Avatar className="size-6 text-[0.6rem]">
                          <AvatarFallback>{initialsOf(c.display_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.display_name}</span>
                        {c.username && <span className="text-muted-foreground">@{c.username}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <fieldset className="grid gap-2" disabled={!user}>
            <legend className="mb-1 text-sm font-medium">{t("members.roles")}</legend>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("members.noAssignable")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const on = picked.has(r.id)
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-secondary",
                        !user && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => {
                          setPicked((prev) => {
                            const next = new Set(prev)
                            if (next.has(r.id)) next.delete(r.id)
                            else next.add(r.id)
                            return next
                          })
                        }}
                      />
                      {r.name}
                      <span className="ml-1 text-xs opacity-70">{r.level}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>

          {add.error && (
            <p role="alert" className="text-sm text-destructive">
              {isApiError(add.error) ? apiErrorMessage(add.error) : t("members.addFailed")}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={add.isPending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={!user || picked.size === 0 || add.isPending}>
              {add.isPending ? t("confirm.working", { ns: "common" }) : t("members.addSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
