import { describe, expect, it } from "vitest"
import { memoryStorage } from "./storage"
import {
  safeInternalPath,
  saveTransaction,
  takeTransaction,
  toInternalPath,
  TXN_PREFIX,
} from "./transaction"

describe("safeInternalPath (contract 9.8 vector 5)", () => {
  it.each([
    ["/", "/"],
    ["/a?b=c#d", "/a?b=c#d"],
    ["/n/kocaeli/live?vehicle=4.12", "/n/kocaeli/live?vehicle=4.12"],
  ])("keeps %s", (input, expected) => {
    expect(safeInternalPath(input)).toBe(expected)
  })

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil",
    "javascript:alert(1)",
    "%2F%2Fevil.com",
    "/%5Cevil.com",
    "/%2F%2Fevil.com",
    "",
    "/\tevil",
  ])("turns %j into /", (input) => {
    expect(safeInternalPath(input)).toBe("/")
  })

  it("turns a same-origin href into a path and rejects other origins", () => {
    expect(toInternalPath("https://dash.test/admin?x=1", "https://dash.test")).toBe("/admin?x=1")
    expect(toInternalPath("https://evil.test/admin", "https://dash.test")).toBe("/")
  })
})

describe("transactions", () => {
  const base = {
    verifier: "v".repeat(43),
    redirectUri: "https://dash.test/auth/callback",
    returnTo: "/x",
    kind: "login" as const,
  }

  it("are single use", async () => {
    const storage = memoryStorage()
    await saveTransaction(storage, { ...base, state: "s1", createdAt: 1000 })
    expect(await takeTransaction(storage, "s1", 2000)).toMatchObject({
      state: "s1",
      returnTo: "/x",
    })
    expect(await takeTransaction(storage, "s1", 2000)).toBeNull()
  })

  it("expire after 10 minutes and are swept", async () => {
    const storage = memoryStorage()
    await saveTransaction(storage, { ...base, state: "old", createdAt: 0 })
    await saveTransaction(storage, { ...base, state: "other", createdAt: 0 })
    expect(await takeTransaction(storage, "old", 10 * 60 * 1000 + 1)).toBeNull()
    expect(await storage.keys(TXN_PREFIX)).toEqual([])
  })

  it("re-validate a stored returnTo", async () => {
    const storage = memoryStorage()
    await saveTransaction(storage, { ...base, state: "s", returnTo: "//evil.com", createdAt: 0 })
    expect((await takeTransaction(storage, "s", 1))?.returnTo).toBe("/")
  })
})
