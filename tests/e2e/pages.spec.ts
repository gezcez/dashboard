import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

/**
 * Every page signed in as root, in light and dark: the heading renders, nothing logs an error and
 * axe finds no serious or critical WCAG 2.1 A/AA violations. Detail pages are reached by clicking
 * the first row of their list, so the test does not depend on fixture ids.
 */
const EXPECTED = [/status of 400/, /ForbiddenError/]

interface PageCase {
  name: string
  path: string
  heading: RegExp
  /** Opens a detail page from the list before checking. */
  open?: (page: Page) => Promise<void>
}

const PAGES: PageCase[] = [
  { name: "system overview", path: "/admin", heading: /^System overview$/ },
  { name: "users", path: "/admin/users", heading: /^Users$/ },
  {
    name: "user detail",
    path: "/admin/users?q=Elif",
    heading: /Elif Kaya/,
    open: (page) => page.getByRole("link", { name: /Elif Kaya/ }).click(),
  },
  { name: "roles", path: "/admin/roles", heading: /^Roles$/ },
  { name: "permission matrix", path: "/admin/roles?view=matrix", heading: /^Roles$/ },
  {
    name: "role detail",
    path: "/admin/roles",
    heading: /.+/,
    open: (page) => page.locator("tbody a").first().click(),
  },
  { name: "permission registry", path: "/admin/permissions", heading: /^Permission registry$/ },
  { name: "oauth apps", path: "/admin/apps", heading: /^OAuth apps$/ },
  {
    name: "oauth app detail",
    path: "/admin/apps",
    heading: /.+/,
    open: (page) => page.locator("tbody a").first().click(),
  },
  { name: "moderation", path: "/admin/moderation", heading: /^Moderation$/ },
  { name: "audit log", path: "/admin/audit", heading: /^Audit log$/ },
  { name: "email", path: "/admin/email", heading: /^Email$/ },
  { name: "network overview", path: "/n/kocaeli", heading: /Kocaeli/ },
  { name: "network members", path: "/n/kocaeli/members", heading: /^Members$/ },
  { name: "network audit", path: "/n/kocaeli/audit", heading: /^Audit log$/ },
]

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme })

    for (const c of PAGES) {
      test(`${c.name} renders and passes axe`, async ({ page, isMobile }) => {
        test.skip(isMobile && colorScheme === "dark", "dark mode is checked on desktop")
        const errors: string[] = []
        page.on("console", (msg) => {
          if (msg.type() === "error" && !EXPECTED.some((re) => re.test(msg.text())))
            errors.push(msg.text())
        })
        page.on("pageerror", (error) => errors.push(error.message))

        await page.goto(c.path)
        await page.waitForURL(/\/mock\/authorize/)
        await page.getByRole("button", { name: /phasenull/ }).click()
        await page.waitForURL((url) => !url.pathname.startsWith("/mock"))
        if (c.open) await c.open(page)
        const h1 = page.getByRole("heading", { level: 1 })
        await expect(h1).toHaveText(c.heading)
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
        await expect(page.locator("html")).toHaveClass(
          colorScheme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/,
        )

        // The email preview is a script-less sandboxed iframe of server-rendered mail; axe cannot
        // enter it (it waits for the frame to answer), and its markup is not dashboard UI.
        const result = await new AxeBuilder({ page })
          .exclude("iframe[sandbox]")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
        const serious = result.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
        expect(serious).toEqual([])
        expect(errors).toEqual([])
      })
    }
  })
}
