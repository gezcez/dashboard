import { createFileRoute, notFound } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eyebrow } from "@/components/ui/eyebrow"
import { randomBase64Url } from "@/auth/pkce"
import { isMock } from "@/env"
import { isLanguage } from "@/i18n"
import { PERSONAS } from "@/mocks/fixtures"
import { mockSession } from "@/mocks/session"

const searchSchema = z.object({
  client_id: z.string().optional(),
  redirect_uri: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  max_age: z.coerce.number().optional(),
  prompt: z.string().optional(),
})

/** Mock builds only: stands in for oauth.gezcez.com/authorize with a persona picker. */
export const Route = createFileRoute("/mock/authorize")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    if (!isMock) throw notFound()
  },
  component: MockAuthorize,
})

function MockAuthorize() {
  const { t, i18n } = useTranslation("auth")
  const search = Route.useSearch()
  const current = mockSession.get()
  const stepUp = search.max_age !== undefined && current !== null
  const lang = isLanguage(i18n.language) ? i18n.language : "en"

  const redirectUri = (() => {
    try {
      const url = new URL(search.redirect_uri ?? "")
      return url.origin === window.location.origin ? url : null
    } catch {
      return null
    }
  })()

  if (!isMock || !redirectUri || !search.state || !search.code_challenge) {
    return (
      <AuthLayout>
        <p>{t("mock.unavailable")}</p>
      </AuthLayout>
    )
  }

  const choose = (persona: string) => {
    const code = randomBase64Url(24)
    mockSession.issueCode({
      code,
      persona,
      challenge: search.code_challenge ?? "",
      redirectUri: redirectUri.toString(),
      authTime: Math.floor(Date.now() / 1000),
      expiresAt: Date.now() + 60_000,
    })
    const target = new URL(redirectUri)
    target.searchParams.set("code", code)
    target.searchParams.set("state", search.state ?? "")
    window.location.assign(target.toString())
  }

  const personas = stepUp ? PERSONAS.filter((p) => p.id === current.persona) : PERSONAS

  return (
    <AuthLayout>
      <Eyebrow>{t("mock.title")}</Eyebrow>
      <p className="mt-2 text-muted-foreground">{t("mock.body")}</p>
      <ul className="mt-6 flex flex-col gap-2">
        {personas.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => choose(p.id)}
              className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-brand hover:bg-accent"
            >
              <Avatar>
                <AvatarFallback>
                  {p.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {t("mock.continueAs", { name: p.name })}
                  {current?.persona === p.id && <Badge variant="brand">{p.id}</Badge>}
                </span>
                <span className="block text-sm text-muted-foreground">{p.description[lang]}</span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </AuthLayout>
  )
}
