import { isRedirect } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "../../tests/setup/msw"
import { API, makeClient, tokenBody } from "./__tests__/helpers"
import { AuthProvider, RequirePermission, requireAuth } from "./react"

describe("requireAuth", () => {
  it("resolves when a session can be restored from the cookie", async () => {
    server.use(http.post(`${API}/v1/oauth/token`, () => HttpResponse.json(tokenBody())))
    const { client } = makeClient()
    await expect(requireAuth(client, { href: "https://dash.test/admin" })).resolves.toBeUndefined()
  })

  it("redirects to /login with the return path when signed out", async () => {
    server.use(
      http.post(`${API}/v1/oauth/token`, () =>
        HttpResponse.json({ error: "invalid_grant" }, { status: 400 }),
      ),
    )
    const { client } = makeClient()
    const thrown = await requireAuth(client, { href: "https://dash.test/admin?x=1" }).catch(
      (e: unknown) => e,
    )
    expect(isRedirect(thrown)).toBe(true)
    const href = (thrown as { options: { href: string } }).options.href
    expect(href).toBe("/login?redirect=https%3A%2F%2Fdash.test%2Fadmin%3Fx%3D1")
  })

  it("lets network errors through so the page can offer a retry", async () => {
    server.use(http.post(`${API}/v1/oauth/token`, () => HttpResponse.error()))
    const { client } = makeClient()
    await expect(requireAuth(client, { href: "/" })).rejects.toMatchObject({ kind: "network" })
  })
})

describe("RequirePermission", () => {
  it("renders children only when the injected resolver allows it", () => {
    const { client } = makeClient()
    const usePermission = (perm: string) => perm === "tracker.read"
    render(
      <AuthProvider client={client} usePermission={usePermission}>
        <RequirePermission perm="tracker.read" scope={{ network: 4 }}>
          <span>allowed</span>
        </RequirePermission>
        <RequirePermission
          perm="tracker.control"
          scope={{ network: 4 }}
          fallback={<span>no access</span>}
        >
          <span>hidden</span>
        </RequirePermission>
      </AuthProvider>,
    )
    expect(screen.getByText("allowed")).toBeInTheDocument()
    expect(screen.getByText("no access")).toBeInTheDocument()
    expect(screen.queryByText("hidden")).toBeNull()
  })
})
