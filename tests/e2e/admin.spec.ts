import { expect, test, type Page } from "@playwright/test"

async function signInAs(page: Page, persona: RegExp, path = "/") {
  await page.goto(path)
  await page.waitForURL(/\/mock\/authorize/)
  await page.getByRole("button", { name: persona }).click()
}

/** Ages the mock session's auth_time so the next token is outside the 10 minute sudo window. */
async function ageSignIn(page: Page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem("gz.mock.session")
    if (!raw) throw new Error("no mock session")
    const session = JSON.parse(raw) as { authTime: number }
    session.authTime -= 3600
    localStorage.setItem("gz.mock.session", JSON.stringify(session))
  })
}

test("users list filters through the URL and opens a user", async ({ page }) => {
  await signInAs(page, /phasenull/, "/admin/users")
  await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible()
  await page.getByRole("searchbox", { name: "Search users" }).fill("Elif")
  await expect(page).toHaveURL(/q=Elif/)
  await expect(page.getByRole("link", { name: /Elif Kaya/ })).toBeVisible()
  await page.getByRole("link", { name: /Elif Kaya/ }).click()
  await expect(page.getByRole("heading", { level: 1, name: /Elif Kaya/ })).toBeVisible()
  await page.getByRole("tab", { name: /Roles/ }).click()
  await expect(page.getByRole("cell", { name: /Network admin/ })).toBeVisible()
})

test("banning needs a fresh sign-in and asks for it in a popup without an opener", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "popup flow is covered on desktop")
  await signInAs(page, /phasenull/, "/admin/users?q=Mehmet")
  await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible()
  await ageSignIn(page)
  await page.reload()
  await page.locator("tbody a").first().click()
  await page.getByRole("button", { name: "Ban user" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Reason shown to the user").fill("Spam in route reports")
  await dialog.getByRole("button", { name: "Ban user" }).click()

  await expect(page.getByText("Confirm it's you")).toBeVisible()
  // Production identity pages send COOP same-origin, which leaves the step-up page without an
  // opener. Recreate that so the result can only come back over BroadcastChannel.
  await page.context().addInitScript({
    content: `if (location.pathname === "/auth/step-up") Object.defineProperty(window, "opener", { value: null })`,
  })
  const popupPromise = page.waitForEvent("popup")
  await page.getByRole("button", { name: "Confirm it's me" }).click()
  const popup = await popupPromise
  await popup.getByRole("button", { name: /phasenull/ }).click()

  await expect(page.getByText(/is banned\./)).toBeVisible()
  await expect(page.getByRole("button", { name: /Elevated/ })).toBeVisible()
  await expect(page.getByRole("button", { name: "Lift ban" }).first()).toBeVisible()

  await page.getByRole("tab", { name: "Profile" }).click()
  await page.getByRole("link", { name: "Open in audit log" }).click()
  await expect(page).toHaveURL(/target_id=/)
  await expect(page.getByText("user.ban").first()).toBeVisible()
  await page.getByRole("button", { name: "Show or hide details" }).first().click()
  await expect(page.getByRole("cell", { name: "public_reason" })).toBeVisible()
})

test("a moderator lands on users and cannot open roles", async ({ page }) => {
  await signInAs(page, /Zeynep/)
  await expect(page).toHaveURL(/\/admin\/users$/)
  await page.goto("/admin/roles")
  await expect(page.getByText("No access")).toBeVisible()
  await expect(page.getByText("roles.read")).toBeVisible()
})
