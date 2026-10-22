import { describe, expect, it } from "vitest"
import { isCrossTabMessage, localStorageLocks } from "./cross-tab"

describe("localStorage lock fallback (no Web Locks)", () => {
  it("serialises two holders of the same lock", async () => {
    const a = localStorageLocks()
    const b = localStorageLocks()
    const log: string[] = []
    const job = (name: string) => async () => {
      log.push(`${name} start`)
      await new Promise((r) => setTimeout(r, 40))
      log.push(`${name} end`)
    }
    await Promise.all([
      a.request("gz.auth.refresh.dashboard", job("a")),
      b.request("gz.auth.refresh.dashboard", job("b")),
    ])
    expect(log).toHaveLength(4)
    // No interleaving: each start is directly followed by its own end.
    expect(log[0]!.split(" ")[0]).toBe(log[1]!.split(" ")[0])
    expect(log[2]!.split(" ")[0]).toBe(log[3]!.split(" ")[0])
    expect(window.localStorage.getItem("gz.auth.lock.gz.auth.refresh.dashboard")).toBeNull()
  })
})

describe("isCrossTabMessage", () => {
  it("accepts only known message shapes", () => {
    expect(isCrossTabMessage({ type: "logout" })).toBe(true)
    expect(isCrossTabMessage({ type: "step_up", ok: true, state: "s" })).toBe(true)
    // A step-up result must name the transaction it answers.
    expect(isCrossTabMessage({ type: "step_up", ok: true })).toBe(false)
    expect(isCrossTabMessage({ type: "token", token: "x" })).toBe(false)
    expect(isCrossTabMessage(null)).toBe(false)
  })
})
