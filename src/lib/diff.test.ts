import { describe, expect, it } from "vitest"
import { diffObjects, formatValue } from "./diff"

describe("diffObjects", () => {
  it("classifies keys and lists changes first", () => {
    const rows = diffObjects(
      { a: 1, b: "x", same: [1, 2], gone: true },
      { a: 2, b: "x", same: [1, 2], fresh: { n: 1 } },
    )
    expect(rows.map((r) => [r.key, r.kind])).toEqual([
      ["a", "changed"],
      ["fresh", "added"],
      ["gone", "removed"],
      ["b", "same"],
      ["same", "same"],
    ])
  })

  it("handles null sides", () => {
    expect(diffObjects(null, { role: "analyst" })).toEqual([
      { key: "role", kind: "added", before: undefined, after: "analyst" },
    ])
    expect(diffObjects({ role: "viewer" }, null)[0]?.kind).toBe("removed")
    expect(diffObjects(null, null)).toEqual([])
  })

  it("formats values for display", () => {
    expect(formatValue("x")).toBe("x")
    expect(formatValue(["a"])).toBe('["a"]')
    expect(formatValue(false)).toBe("false")
    expect(formatValue(undefined)).toBe("")
  })
})
