import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
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
import { isSudoCancelled } from "@/lib/sudo"
import { useSudo } from "@/lib/use-sudo"
import { cn } from "@/lib/utils"
import { RedirectUriEditor, redirectUrisValid } from "./redirect-uri-editor"

type AppType = components["schemas"]["AppType"]
type AppPlatform = components["schemas"]["AppPlatform"]
type Created = { app: components["schemas"]["AppDetail"]; secret: string | null }

const TYPES = ["public", "confidential"] as const satisfies AppType[]
const PLATFORMS = ["web", "native", "dev"] as const satisfies AppPlatform[]

/** New OAuth client (sudo). Type and platform are fixed after creation. */
export function CreateAppDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (created: Created) => void
}) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const queryClient = useQueryClient()
  const sudo = useSudo()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [homepage, setHomepage] = useState("")
  const [type, setType] = useState<AppType>("public")
  const [platform, setPlatform] = useState<AppPlatform>("web")
  const [uris, setUris] = useState<string[]>([""])

  useEffect(() => {
    if (!open) {
      setName("")
      setDescription("")
      setHomepage("")
      setType("public")
      setPlatform("web")
      setUris([""])
    }
  }, [open])

  const create = useMutation({
    mutationFn: () =>
      sudo(() =>
        callApi("post", "/v1/dash/apps", {
          body: {
            name: name.trim(),
            description: description.trim(),
            homepage_url: homepage.trim() || null,
            type,
            platform,
            redirect_uris: uris.map((u) => u.trim()).filter(Boolean),
          },
        }),
      ),
    onSuccess: (created) => {
      onOpenChange(false)
      onCreated(created)
    },
    onSettled: () => invalidateApi(queryClient, "/v1/dash/apps"),
  })
  const valid = name.trim().length >= 2 && redirectUrisValid(uris, platform)
  const error =
    create.error && !isSudoCancelled(create.error)
      ? isApiError(create.error)
        ? apiErrorMessage(create.error)
        : t("apps.create.failed")
      : null

  const pill = (on: boolean) =>
    cn(
      "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
      on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary",
    )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (create.isPending) return
        if (!next) create.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent
        closeLabel={t("close", { ns: "common" })}
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) create.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("apps.create.title")}</DialogTitle>
            <DialogDescription>{t("apps.create.body")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-name`}>{t("apps.fields.name")}</Label>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-desc`}>{t("apps.fields.description")}</Label>
            <Textarea
              id={`${id}-desc`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-home`}>{t("apps.fields.homepage")}</Label>
            <Input
              id={`${id}-home`}
              type="url"
              value={homepage}
              placeholder="https://"
              onChange={(e) => {
                setHomepage(e.target.value)
              }}
            />
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">{t("apps.fields.type")}</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((v) => (
                <label key={v} className={pill(type === v)}>
                  <input
                    type="radio"
                    name={`${id}-type`}
                    className="sr-only"
                    checked={type === v}
                    onChange={() => {
                      setType(v)
                    }}
                  />
                  {t(`apps.types.${v}`)}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t(`apps.typeHints.${type}`)}</p>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">{t("apps.fields.platform")}</legend>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((v) => (
                <label key={v} className={pill(platform === v)}>
                  <input
                    type="radio"
                    name={`${id}-platform`}
                    className="sr-only"
                    checked={platform === v}
                    onChange={() => {
                      setPlatform(v)
                    }}
                  />
                  {t(`apps.platforms.${v}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">{t("apps.redirects.title")}</legend>
            <RedirectUriEditor value={uris} onChange={setUris} platform={platform} />
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={create.isPending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending ? t("confirm.working", { ns: "common" }) : t("apps.create.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
