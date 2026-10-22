import { describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { collectOperationAuth, generate, resolveSource } from "./api-gen-lib"

describe("api-gen", () => {
  it("resolves the spec source from argv, API_SPEC, then VITE_API_URL", () => {
    expect(resolveSource(["bun", "api-gen.ts", "openapi/stub.openapi.json"])).toBe(
      "openapi/stub.openapi.json",
    )
    vi.stubEnv("API_SPEC", "")
    vi.stubEnv("VITE_API_URL", "http://localhost:3000/")
    expect(resolveSource(["bun", "api-gen.ts"])).toBe("http://localhost:3000/openapi.json")
    vi.unstubAllEnvs()
  })

  it("reads x-gezcez-permission and x-gezcez-sudo per operation", () => {
    const auth = collectOperationAuth({
      paths: {
        "/v1/dash/users/{userId}/ban": {
          post: {
            "x-gezcez-permission": { key: "moderation.write", scope: "global" },
            "x-gezcez-sudo": true,
          },
        },
        "/v1/me": { get: {} },
      },
    })
    expect(auth).toEqual({
      "POST /v1/dash/users/{userId}/ban": { key: "moderation.write", scope: "global", sudo: true },
    })
  })

  it("output matches the committed generated files (api:check)", async () => {
    const files = await generate("openapi/stub.openapi.json")
    for (const [path, content] of Object.entries(files)) {
      expect(await readFile(path, "utf8")).toBe(content)
    }
  })
})
