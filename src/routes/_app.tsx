import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/auth/react"
import { AppShell } from "@/components/shell/app-shell"
import { meQuery } from "@/lib/me"

/** Everything behind sign-in. Resolves the session and `me` before any page renders. */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    await requireAuth(context.auth, { href: location.href })
    const me = await context.queryClient.query({ ...meQuery(), staleTime: "static" })
    return { me }
  },
  component: AppShell,
})
