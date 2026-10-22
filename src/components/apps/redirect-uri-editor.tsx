import { PlusIcon, TrashIcon, TriangleAlertIcon } from "lucide-react"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { checkRedirectUris, type AppPlatform } from "@/lib/redirect-uris"
import { cn } from "@/lib/utils"

/** True when the list can be saved: at least one URI and no blocking problem. */
export function redirectUrisValid(uris: string[], platform: AppPlatform): boolean {
  const filled = uris.filter((u) => u.trim())
  return filled.length > 0 && checkRedirectUris(filled, platform).every((c) => !c.problem)
}

/**
 * Exact-match redirect URI list (plan 6.11). Problems block saving; a trailing-slash twin is only
 * a warning because both forms are valid, just rarely intended together.
 */
export function RedirectUriEditor({
  value,
  onChange,
  platform,
  disabled = false,
}: {
  value: string[]
  onChange: (next: string[]) => void
  platform: AppPlatform
  disabled?: boolean
}) {
  const { t } = useTranslation("dashboard")
  const id = useId()
  const checks = checkRedirectUris(value, platform)

  return (
    <div className="grid gap-2">
      <ul className="grid gap-2" aria-label={t("apps.redirects.list")}>
        {value.map((uri, i) => {
          const check = checks[i]
          const problem = uri.trim() ? check?.problem : null
          const hintId = `${id}-${String(i)}-hint`
          return (
            <li key={i} className="grid gap-1">
              <div className="flex items-center gap-2">
                <Input
                  value={uri}
                  disabled={disabled}
                  aria-label={t("apps.redirects.uri", { n: i + 1 })}
                  aria-invalid={problem ? true : undefined}
                  aria-describedby={problem || check?.trailingSlashTwin ? hintId : undefined}
                  placeholder={
                    platform === "native"
                      ? "gezcez://oauth/callback"
                      : platform === "dev"
                        ? "http://localhost:5173/auth/callback"
                        : "https://example.com/auth/callback"
                  }
                  className={cn("font-mono text-xs", problem && "border-destructive")}
                  onChange={(e) => {
                    onChange(value.map((u, j) => (j === i ? e.target.value : u)))
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label={t("apps.redirects.remove", { n: i + 1 })}
                  onClick={() => {
                    onChange(value.filter((_, j) => j !== i))
                  }}
                >
                  <TrashIcon />
                </Button>
              </div>
              {problem ? (
                <p id={hintId} className="text-xs text-destructive">
                  {t(`apps.redirects.problems.${problem}`)}
                </p>
              ) : check?.trailingSlashTwin && uri.trim() ? (
                <p id={hintId} className="flex items-center gap-1 text-xs text-status-warn">
                  <TriangleAlertIcon className="size-3.5" />
                  {t("apps.redirects.trailingSlash")}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => {
            onChange([...value, ""])
          }}
        >
          <PlusIcon />
          {t("apps.redirects.add")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t(`apps.redirects.rules.${platform}`)}</p>
    </div>
  )
}
