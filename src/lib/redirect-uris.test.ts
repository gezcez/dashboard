import { describe, expect, it } from "vitest"
import { checkRedirectUri, checkRedirectUris } from "./redirect-uris"

describe("checkRedirectUri", () => {
  it.each([
    ["https://dash.gezcez.com/auth/callback", "web", null],
    ["http://dash.gezcez.com/cb", "web", "https_required"],
    ["http://localhost:5173/cb", "dev", null],
    ["http://127.0.0.1:8080/cb", "dev", null],
    ["http://localhost/cb", "dev", "https_required"],
    ["http://localhost:5173/cb", "web", "https_required"],
    ["gezcez://oauth/callback", "native", null],
    ["gezcez://oauth/callback", "web", "custom_scheme_native_only"],
    ["https://*.gezcez.com/cb", "web", "wildcard"],
    ["https://dash.gezcez.com/cb#x", "web", "fragment"],
    ["not a url", "web", "invalid"],
  ] as const)("%s on %s", (uri, platform, problem) => {
    expect(checkRedirectUri(uri, platform)).toBe(problem)
  })

  it("flags duplicates and trailing-slash twins", () => {
    const checks = checkRedirectUris(
      ["https://a.example/cb", "https://a.example/cb/", "https://a.example/cb"],
      "web",
    )
    expect(checks.map((c) => c.problem)).toEqual([null, null, "duplicate"])
    expect(checks[0]?.trailingSlashTwin).toBe(true)
  })
})
