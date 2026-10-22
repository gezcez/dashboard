import { expect, test, type Page } from "@playwright/test"

/**
 * Smoke tests against a mock-mode build: sign in through the mock authorize page as a persona and
 * check the shell, permissions and sign-out. The boot refresh answers 400 (no session yet), and
 * a 403 page logs its ForbiddenError; both are expected and filtered out.
 */
const EXPECTED = [/status of 400/, /ForbiddenError/]

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error" && !EXPECTED.some((re) => re.test(msg.text())))
      errors.push(msg.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

async function signInAs(page: Page, persona: RegExp, path = "/") {
  await page.goto(path)
  await page.waitForURL(/\/mock\/authorize/)
  await page.getByRole("button", { name: persona }).click()
}

test("login page renders", async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto("/login")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  expect(errors).toEqual([])
})

test("root lands on the system overview and returns to the deep link", async ({ page }) => {
  const errors = trackErrors(page)
  await signInAs(page, /phasenull/, "/admin")
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole("heading", { level: 1, name: "System overview" })).toBeVisible()
  await expect(page.getByText("event_loop_lag_p95")).toBeVisible()
  expect(errors).toEqual([])
})

test("a network analyst lands on their network and gets a 403 on platform pages", async ({
  page,
}) => {
  const errors = trackErrors(page)
  await signInAs(page, /Murat/)
  await expect(page).toHaveURL(/\/n\/kocaeli$/)
  await expect(page.getByRole("heading", { level: 1, name: "Kocaeli UlaşımPark" })).toBeVisible()
  await page.goto("/admin")
  await expect(page.getByText("No access")).toBeVisible()
  await expect(page.getByText("system.health.read")).toBeVisible()
  await page.goto("/n/nowhere")
  await expect(page.getByText("Network not found")).toBeVisible()
  expect(errors).toEqual([])
})

test("dark mode toggles and persists", async ({ page }) => {
  await signInAs(page, /Elif/)
  await expect(page).toHaveURL(/\/n\/kocaeli$/)
  const html = page.locator("html")
  const wasDark = /\bdark\b/.test((await html.getAttribute("class")) ?? "")
  await page.getByRole("button", { name: "Toggle dark mode" }).click()
  await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/)
  await page.reload()
  await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/)
})

test("sign out ends the session", async ({ page, isMobile }) => {
  await signInAs(page, /Elif/)
  await expect(page).toHaveURL(/\/n\/kocaeli$/)
  if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click()
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/auth\/logged-out$/)
  await page.goto("/admin")
  await expect(page).toHaveURL(/\/mock\/authorize/)
})
