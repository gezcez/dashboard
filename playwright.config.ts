import { defineConfig, devices } from "@playwright/test"

// Smoke tests run against `vite preview` of a mock-mode build (no backend needed).
// PW_CHROMIUM_PATH lets a machine without Playwright's download use a local Chromium.
const executablePath = process.env.PW_CHROMIUM_PATH
const launchOptions = executablePath ? { executablePath } : {}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions } },
  ],
  webServer: {
    command: "bun run build:mock && bun run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
