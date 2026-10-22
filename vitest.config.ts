import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  define: { __BUILD_SHA__: JSON.stringify("test") },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    env: {
      VITE_ENV: "development",
      VITE_API_MODE: "live",
      VITE_API_URL: "https://api.test",
      VITE_OAUTH_URL: "https://oauth.test",
      VITE_WS_URL: "wss://api.test/v1/ws",
      VITE_CLIENT_ID: "dashboard-dev",
    },
    coverage: { include: ["src/lib/**", "src/auth/**", "src/api/**"] },
  },
})
