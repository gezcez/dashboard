import { redirect } from "@tanstack/react-router"
import { createContext, use, useSyncExternalStore, type ReactNode } from "react"
import { isAuthError } from "./errors"
import type { AuthClient, AuthStatus } from "./session"

/**
 * Permission lookups are injected by the app (from its own GET /v1/me query) so src/auth never
 * imports the API layer. `undefined` means "not known yet".
 */
export type PermissionScope = "global" | { network: string | number }
export type UsePermission = (perm: string, scope: PermissionScope) => boolean | undefined

interface AuthContextValue {
  client: AuthClient
  usePermission: UsePermission
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  client,
  usePermission,
  children,
}: {
  client: AuthClient
  usePermission: UsePermission
  children: ReactNode
}) {
  return <AuthContext value={{ client, usePermission }}>{children}</AuthContext>
}

function useAuthContext(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

export function useAuth(): AuthClient {
  return useAuthContext().client
}

export function useAuthStatus(): AuthStatus {
  const client = useAuth()
  return useSyncExternalStore(
    (cb) => client.subscribe(cb),
    () => client.status(),
  )
}

/** Same as useAuthStatus plus the decoded claims (UI hints only). */
export function useSession() {
  const client = useAuth()
  const status = useAuthStatus()
  return { status, claims: status === "signed_in" ? client.claims() : null }
}

export function usePermission(perm: string, scope: PermissionScope): boolean | undefined {
  return useAuthContext().usePermission(perm, scope)
}

export function RequirePermission({
  perm,
  scope,
  fallback = null,
  children,
}: {
  perm: string
  scope: PermissionScope
  fallback?: ReactNode
  children: ReactNode
}) {
  const allowed = usePermission(perm, scope)
  return allowed ? children : fallback
}

export function RequireAuth({
  fallback = null,
  children,
}: {
  fallback?: ReactNode
  children: ReactNode
}) {
  return useAuthStatus() === "signed_in" ? children : fallback
}

/**
 * TanStack Router `beforeLoad` helper. Resolves when a valid access token exists (restoring it
 * from the gz_rt cookie if needed). When signed out it redirects to /login, which starts the
 * authorize redirect with the current location as return path. Network errors propagate so the
 * route's error component can offer a retry instead of bouncing to sign-in.
 */
export async function requireAuth(
  auth: AuthClient,
  location: { href: string },
  loginPath = "/login",
): Promise<void> {
  try {
    await auth.getAccessToken()
  } catch (error) {
    if (isAuthError(error, "signed_out")) {
      throw redirect({
        href: `${loginPath}?${new URLSearchParams({ redirect: location.href }).toString()}`,
      })
    }
    throw error
  }
}
