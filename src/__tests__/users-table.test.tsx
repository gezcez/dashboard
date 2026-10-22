import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { USERS } from "@/mocks/fixtures"
import {
  findHeading,
  renderApp,
  searchOf,
  tableRows,
  type AppView,
} from "../../tests/setup/app"

/** Display names in table order (the first line of each user chip). */
async function names(): Promise<string[]> {
  const rows = await tableRows()
  return rows.map((r) => r.querySelector("td span.font-medium")?.textContent ?? "")
}

async function statuses(): Promise<string[]> {
  const rows = await tableRows()
  return rows.map((r) => r.querySelectorAll("td")[2]?.textContent ?? "")
}

async function pickFilter(app: AppView, trigger: RegExp, option: string) {
  await app.user.click(screen.getByRole("button", { name: trigger }))
  await app.user.click(await screen.findByRole("menuitem", { name: option }))
}

const sortedNames = (dir: 1 | -1) =>
  [...USERS].map((u) => u.display_name).sort((a, b) => dir * a.localeCompare(b))

describe("users table", { timeout: 30_000 }, () => {
  it("shows the first page of 50 with the total", async () => {
    await renderApp("/admin/users")
    await findHeading("Users")
    expect(await tableRows()).toHaveLength(50)
    expect(screen.getByText(`${String(USERS.length)} results`)).toBeInTheDocument()
    const pager = screen.getByRole("navigation", { name: "Pagination" })
    expect(within(pager).getByRole("button", { name: "Previous page" })).toBeDisabled()
    expect(within(pager).getByRole("button", { name: "Next page" })).toBeEnabled()
  })

  it("restores filters and sort from the URL", async () => {
    await renderApp("/admin/users?status=banned&sort=display_name:asc")
    const banned = USERS.filter((u) => u.status === "banned").map((u) => u.display_name)
    const shown = await names()
    expect(shown).toHaveLength(Math.min(banned.length, 50))
    expect(shown).toEqual([...banned].sort((a, b) => a.localeCompare(b)).slice(0, 50))
    expect(new Set(await statuses())).toEqual(new Set(["Banned"]))
    expect(screen.getByRole("button", { name: /Status: Banned/ })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /User/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    )
  })

  it("cycles a header sort through first direction, flipped, then default", async () => {
    const app = await renderApp("/admin/users")
    await tableRows()
    const header = () => screen.getByRole("button", { name: /^User/ })

    await app.user.click(header())
    await waitFor(() => expect(searchOf(app).sort).toBe("display_name:asc"))
    await waitFor(async () => expect(await names()).toEqual(sortedNames(1).slice(0, 50)))

    await app.user.click(header())
    await waitFor(() => expect(searchOf(app).sort).toBe("display_name:desc"))
    await waitFor(async () => expect(await names()).toEqual(sortedNames(-1).slice(0, 50)))
    expect(screen.getByRole("columnheader", { name: /User/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    )

    await app.user.click(header())
    await waitFor(() => expect(searchOf(app).sort).toBeUndefined())
    expect(screen.getByRole("columnheader", { name: /User/ })).not.toHaveAttribute("aria-sort")
  })

  it("starts date columns descending", async () => {
    const app = await renderApp("/admin/users")
    await tableRows()
    await app.user.click(screen.getByRole("button", { name: /^Last active/ }))
    await waitFor(() => expect(searchOf(app).sort).toBe("last_active_at:desc"))
  })

  it("debounces the search into ?q= and filters on the server", async () => {
    const app = await renderApp("/admin/users")
    await tableRows()
    await app.user.click(screen.getByRole("searchbox", { name: "Search users" }))
    await app.user.paste("zeynep")
    expect(searchOf(app).q).toBeUndefined()
    await waitFor(() => expect(searchOf(app).q).toBe("zeynep"))
    await waitFor(async () => expect(await names()).toEqual(["Zeynep Arslan"]))

    await app.user.click(screen.getByRole("button", { name: "Clear search" }))
    await waitFor(() => expect(searchOf(app).q).toBeUndefined())
    expect(await tableRows()).toHaveLength(50)
  })

  it("filters by status, role and network and resets the cursor on each change", async () => {
    const app = await renderApp("/admin/users")
    await tableRows()
    await app.user.click(screen.getByRole("button", { name: "Next page" }))
    await waitFor(() => expect(searchOf(app).cursor).toBeTruthy())

    await pickFilter(app, /^Status/, "Unverified")
    await waitFor(() => expect(searchOf(app)).toMatchObject({ status: "unverified" }))
    expect(searchOf(app).cursor).toBeUndefined()
    await waitFor(async () => expect(new Set(await statuses())).toEqual(new Set(["Unverified"])))

    await pickFilter(app, /^Status/, "Any")
    await waitFor(() => expect(searchOf(app).status).toBeUndefined())

    await pickFilter(app, /^Role/, "Moderator")
    await waitFor(() => expect(searchOf(app).role).toBe("moderator"))
    const moderators = USERS.filter((u) => u.roles.some((r) => r.role.key === "moderator"))
    await waitFor(async () => expect(await tableRows()).toHaveLength(moderators.length))

    await pickFilter(app, /^Role/, "Any")
    await pickFilter(app, /^Network/, "Sakarya Büyükşehir")
    await waitFor(() => expect(searchOf(app).network_id).toBe(54))
    const inSakarya = USERS.filter((u) => u.roles.some((r) => r.network?.id === 54))
    await waitFor(async () =>
      expect(await tableRows()).toHaveLength(Math.min(inSakarya.length, 50)),
    )
  })

  it("pages forward and back with opaque cursors", async () => {
    const app = await renderApp("/admin/users")
    const first = await names()
    await app.user.click(screen.getByRole("button", { name: "Next page" }))
    await waitFor(async () => expect((await names())[0]).not.toBe(first[0]))
    const cursor = searchOf(app).cursor
    expect(cursor).toBeTruthy()
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled()

    // The last page (184 = 3 * 50 + 34) has no next cursor.
    await app.user.click(screen.getByRole("button", { name: "Next page" }))
    await app.user.click(screen.getByRole("button", { name: "Next page" }))
    await waitFor(async () => expect(await tableRows()).toHaveLength(USERS.length - 150))
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled()

    await app.user.click(screen.getByRole("button", { name: "Previous page" }))
    await app.user.click(screen.getByRole("button", { name: "Previous page" }))
    await app.user.click(screen.getByRole("button", { name: "Previous page" }))
    await waitFor(async () => expect(await names()).toEqual(first))
  })

  it("keeps the previous page on screen while the next one loads", async () => {
    const app = await renderApp("/admin/users")
    await tableRows()
    await app.user.click(screen.getByRole("button", { name: "Next page" }))
    // Placeholder rows stay (dimmed) instead of a skeleton flash.
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(50)
  })

  it("shows a no-match state whose button clears every filter", async () => {
    const app = await renderApp("/admin/users?q=nobody-by-this-name&status=banned")
    expect(await screen.findByText("No users match")).toBeInTheDocument()
    await app.user.click(screen.getByRole("button", { name: "Clear filters" }))
    await waitFor(() => {
      expect(searchOf(app).q).toBeUndefined()
      expect(searchOf(app).status).toBeUndefined()
    })
    expect(await tableRows()).toHaveLength(50)
    expect(screen.getByRole("searchbox", { name: "Search users" })).toHaveValue("")
  })

  it("follows the back button for URL state", async () => {
    const app = await renderApp("/admin/users")
    await tableRows()
    await app.user.click(screen.getByRole("button", { name: "Next page" }))
    await waitFor(() => expect(searchOf(app).cursor).toBeTruthy())
    app.router.history.back()
    await waitFor(() => expect(searchOf(app).cursor).toBeUndefined())
  })

  it("links each row to the user's page", async () => {
    const app = await renderApp("/admin/users?q=elif")
    await waitFor(async () => expect(await names()).toEqual(["Elif Kaya"]))
    await app.user.click(screen.getByRole("link", { name: /Elif Kaya/ }))
    await findHeading(/Elif Kaya/)
    expect(app.router.state.location.pathname).toBe("/admin/users/01JA00000000000000000NADMN")
  })

  it("shows a retryable error when the list fails", async () => {
    const { http, HttpResponse } = await import("msw")
    const { server } = await import("../../tests/setup/msw")
    const app = await renderApp("/admin/users")
    await tableRows()
    let fail = true
    server.use(
      http.get("https://api.test/v1/dash/users", () =>
        fail
          ? HttpResponse.json(
              { ok: false, error: { code: "INTERNAL", message: "boom", request_id: "req_x" } },
              { status: 500 },
            )
          : undefined,
      ),
    )
    await app.user.click(screen.getByRole("button", { name: /^Status/ }))
    await app.user.click(await screen.findByRole("menuitem", { name: "Banned" }))
    expect(await screen.findByText("Something went wrong", {}, { timeout: 8000 })).toBeVisible()
    expect(screen.getByText("Request id: req_x")).toBeInTheDocument()
    fail = false
    await app.user.click(screen.getByRole("button", { name: "Try again" }))
    await waitFor(async () => expect(new Set(await statuses())).toEqual(new Set(["Banned"])))
  })
})
