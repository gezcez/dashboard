import { describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { collectOperationAuth, generate, mergeFragment, resolveSource } from "./api-gen-lib"

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

  it("merges stub fragments: new operations and schemas, unioned enums, no duplicates", () => {
    const doc = {
      paths: { "/v1/a": { get: { operationId: "a" } } },
      components: { schemas: { ErrorCode: { enum: ["A"] }, Thing: {} } },
    }
    mergeFragment(
      doc,
      {
        paths: { "/v1/a": { post: { operationId: "a2" } }, "/v1/b": { get: {} } },
        components: { schemas: { ErrorCode: { enum: ["A", "B"] }, Other: {} } },
      },
      "frag.json",
    )
    expect(Object.keys(doc.paths["/v1/a"])).toEqual(["get", "post"])
    expect(doc.components.schemas.ErrorCode.enum).toEqual(["A", "B"])
    expect(Object.keys(doc.components.schemas)).toContain("Other")
    expect(() => {
      mergeFragment(doc, { paths: { "/v1/b": { get: {} } } }, "frag.json")
    }).toThrow(/GET \/v1\/b already exists/)
    expect(() => {
      mergeFragment(doc, { components: { schemas: { Thing: {} } } }, "frag.json")
    }).toThrow(/schema Thing already exists/)
  })

  it("output matches the committed generated files (api:check)", async () => {
    const files = await generate("openapi/stub.openapi.json")
    for (const [path, content] of Object.entries(files)) {
      expect(await readFile(path, "utf8")).toBe(content)
    }
  })
})
