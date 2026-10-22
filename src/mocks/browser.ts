import { setupWorker } from "msw/browser"
import { env } from "@/env"
import { createHandlers } from "./handlers"

/** Starts the MSW service worker for `VITE_API_MODE=mock` (dev:mock, previews, e2e). */
export async function startMockApi(): Promise<void> {
  const worker = setupWorker(
    ...createHandlers(env.VITE_API_URL, { latency: true, wsUrl: env.VITE_WS_URL }),
  )
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: "/mockServiceWorker.js" },
  })
}
