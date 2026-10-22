import "@fontsource-variable/inter"
import "./styles/app.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { auth } from "./auth"
import { AuthProvider } from "./auth/react"
import { isMock } from "./env"
import { detectLanguage, initI18n } from "./i18n"
import { useCan } from "./lib/permissions"
import type { PermissionKey } from "./lib/permissions"
import { usePrefs } from "./lib/prefs-store"
import { createQueryClient } from "./lib/query-client"
import { createAppRouter } from "./router"

initI18n(usePrefs.getState().language ?? detectLanguage())

const queryClient = createQueryClient()
const router = createAppRouter({ queryClient, auth })

// Sign-out (here or in another tab) drops every cached response.
auth.onLogout(() => queryClient.clear())

const usePermission = (perm: string, scope: Parameters<typeof useCan>[1]) =>
  useCan(perm as PermissionKey, scope)

async function boot() {
  if (isMock) {
    const { startMockApi } = await import("./mocks/browser")
    await startMockApi()
  }
  const root = document.getElementById("root")
  if (!root) throw new Error("#root missing from index.html")
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider client={auth} usePermission={usePermission}>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void boot()
