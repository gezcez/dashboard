import "@fontsource-variable/inter"
import "./styles/app.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { detectLanguage, initI18n } from "./i18n"
import { createQueryClient } from "./lib/query-client"
import { usePrefs } from "./lib/prefs-store"
import { createAppRouter } from "./router"

initI18n(usePrefs.getState().language ?? detectLanguage())

const queryClient = createQueryClient()
const router = createAppRouter({ queryClient })

const root = document.getElementById("root")
if (!root) throw new Error("#root missing from index.html")

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
