import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { isApiError } from "@/api/envelope"
import type { components } from "@/api/schema.gen"
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
import { Textarea } from "@/components/ui/textarea"
import { callApi, invalidateApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { useMe } from "@/lib/me"
import { isRoot, levelOf } from "@/lib/permissions"
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"

type Role = components["schemas"]["Role"]

function roleSchema(maxLevel: number) {
  return z.object({
    key: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9_]{1,31}$/),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(300),
    level: z.coerce.number().int().min(1).max(maxLevel),
  })
}
type RoleForm = z.infer<ReturnType<typeof roleSchema>>
type RoleFormInput = z.input<ReturnType<typeof roleSchema>>

/**
 * Create a role, or edit name, description and level of an existing one. Both are sudo
 * (x-gezcez-sudo). The level must stay below the editor's own (root excepted); the key is fixed
 * after creation because grants and audit entries refer to it.
 */
export function RoleFormDialog({
  role,
  open,
  onOpenChange,
}: {
  role?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("dashboard")
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const sudo = useSudo()
  const { data: me } = useMe()
  const maxLevel = isRoot(me) ? 100 : Math.max(1, levelOf(me, "global") - 1)
  const schema = roleSchema(maxLevel)
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<RoleFormInput, unknown, RoleForm>({
    resolver: zodResolver(schema),
    defaultValues: role
      ? { key: role.key, name: role.name, description: role.description, level: role.level }
      : { key: "", name: "", description: "", level: Math.min(20, maxLevel) },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
      setServerError(null)
    }
  }, [open, form])

  const save = useMutation({
    mutationFn: (values: RoleForm) =>
      sudo(() =>
        role
          ? callApi("patch", "/v1/dash/roles/{roleId}", {
              params: { path: { roleId: role.id } },
              body: { name: values.name, description: values.description, level: values.level },
            })
          : callApi("post", "/v1/dash/roles", { body: values }),
      ),
    onMutate: () => {
      setServerError(null)
    },
    onSuccess: (saved) => {
      toast.success(t(role ? "roles.form.saved" : "roles.form.created", { name: saved.name }))
      onOpenChange(false)
      if (!role) void navigate({ to: "/admin/roles/$roleId", params: { roleId: saved.id } })
    },
    onError: (error) => {
      if (isSudoCancelled(error)) return
      if (isApiError(error, "CONFLICT")) {
        form.setError("key", { message: t("roles.form.keyTaken") })
        return
      }
      setServerError(isApiError(error) ? apiErrorMessage(error) : t("roles.form.failed"))
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/roles"),
  })

  const { errors } = form.formState
  /** aria wiring plus the hint line: the server's message, the rule broken, or the hint. */
  const field = (name: keyof RoleForm, hint = "") => {
    const error = errors[name]
    const text = !error
      ? hint
      : error.type === "manual" && error.message
        ? error.message
        : t(`roles.form.invalid.${name}`)
    return {
      props: {
        id: `role-${name}`,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": `role-${name}-hint`,
      },
      hint: (
        <p
          id={`role-${name}-hint`}
          className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
        >
          {text}
        </p>
      ),
    }
  }
  const keyField = field("key", t("roles.form.keyHint"))
  const nameField = field("name")
  const descField = field("description")
  const levelField = field("level", t("roles.form.levelHint", { max: maxLevel }))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!save.isPending) onOpenChange(next)
      }}
    >
      <DialogContent closeLabel={t("close", { ns: "common" })}>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(e) => void form.handleSubmit((values) => save.mutate(values))(e)}
        >
          <DialogHeader>
            <DialogTitle>
              {role ? t("roles.form.editTitle", { name: role.name }) : t("roles.form.createTitle")}
            </DialogTitle>
            <DialogDescription>{t("roles.form.body")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={keyField.props.id}>{t("roles.form.key")}</Label>
            <Input
              className="font-mono"
              disabled={Boolean(role)}
              autoComplete="off"
              {...keyField.props}
              {...form.register("key")}
            />
            {keyField.hint}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={nameField.props.id}>{t("roles.form.name")}</Label>
            <Input {...nameField.props} {...form.register("name")} />
            {nameField.hint}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={descField.props.id}>{t("roles.form.description")}</Label>
            <Textarea {...descField.props} {...form.register("description")} />
            {descField.hint}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={levelField.props.id}>{t("roles.form.level")}</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxLevel}
              className="tabular w-28"
              {...levelField.props}
              {...form.register("level")}
            />
            {levelField.hint}
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={save.isPending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending
                ? t("confirm.working", { ns: "common" })
                : role
                  ? t("roles.form.save")
                  : t("roles.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
