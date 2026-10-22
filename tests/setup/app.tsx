import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { auth } from "@/auth"
import { AuthProvider } from "@/auth/react"
import { createHandlers } from "@/mocks/handlers"
import { mockSession } from "@/mocks/session"
import { useCan, type PermissionKey } from "@/lib/permissions"
import { usePrefs } from "@/lib/prefs-store"
import { createQueryClient } from "@/lib/query-client"
import { useSudoStore } from "@/lib/sudo"
import { createAppRouter } from "@/router"
import { server } from "./msw"

export const API = "https://api.test"

/** Mock personas (src/mocks/fixtures.ts). */
export type PersonaId = "founder" | "network-admin" | "analyst" | "moderator"

export const nowSec = () => Math.floor(Date.now() / 1000)

/** jsdom lacks these; Radix and the theme hook need them. */
export function installDomShims(): void {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
  globalThis.ResizeObserver ??= class {
    observe() {
      return undefined
    }
    unobserve() {
      return undefined
    }
    disconnect() {
      return undefined
    }
  }
  Element.prototype.scrollIntoView ??= () => undefined
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => undefined
  window.scrollTo = () => undefined
}

/**
 * Puts the app's auth singleton back to "signed out, nothing cached" and the mock API back to its
 * fixtures. The singleton keeps its access token in memory, so a test that signs in as one persona
 * must not leak it into the next.
 */
export async function resetApp(): Promise<void> {
  server.use(...createHandlers(API))
  await auth.logout({ endIdentitySession: false })
  localStorage.clear()
  sessionStorage.clear()
  usePrefs.setState({ lastNetwork: null, sidebarCollapsed: false, theme: "system" })
  useSudoStore.setState({ shownFor: null, endedFor: null, pending: null })
}

/** The mock refresh "cookie": the next refresh signs in as this persona. */
export function signInAs(persona: PersonaId, authTime = nowSec()): void {
  mockSession.set({ persona, authTime, sid: `sid_test_${persona}` })
}

const usePermission = (perm: string, scope: Parameters<typeof useCan>[1]) =>
  useCan(perm as PermissionKey, scope)

export interface RenderAppOptions {
  persona?: PersonaId | null
  authTime?: number
  queryClient?: QueryClient
}

/** Renders the whole app (router, shell, pages) at `path` against the mock API. */
export async function renderApp(path: string, options: RenderAppOptions = {}) {
  installDomShims()
  await resetApp()
  if (options.persona !== null) signInAs(options.persona ?? "founder", options.authTime)
  const queryClient = options.queryClient ?? createQueryClient()
  const router = createAppRouter({ queryClient, auth })
  router.update({ ...router.options, history: createMemoryHistory({ initialEntries: [path] }) })
  const user = userEvent.setup({ delay: null })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={auth} usePermission={usePermission}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  // The app loads data asynchronously on its own; act() warnings for those updates are noise.
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  await router.load()
  return { ...view, router, queryClient, user }
}

export type AppView = Awaited<ReturnType<typeof renderApp>>

/** Current path plus search, as the router sees it. */
export const locationOf = (app: AppView) => app.router.state.location

export const searchOf = (app: AppView) =>
  app.router.state.location.search as Record<string, unknown>

/** Waits for a page heading (h1) with this name. */
export function findHeading(name: string | RegExp) {
  return screen.findByRole("heading", { level: 1, name }, { timeout: 4000 })
}

/** Data rows of the first table (skips the header row). */
export async function tableRows(): Promise<HTMLElement[]> {
  let rows: HTMLElement[] = []
  await waitFor(
    () => {
      const table = screen.getByRole("table")
      expect(table).toHaveAttribute("aria-busy", "false")
      rows = Array.from(table.querySelectorAll<HTMLElement>("tbody tr"))
      expect(rows.length).toBeGreaterThan(0)
    },
    { timeout: 4000 },
  )
  return rows
}
