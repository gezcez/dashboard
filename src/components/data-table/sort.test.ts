import { describe, expect, it } from "vitest"
import { formatSort, nextSort, parseSort } from "./sort"

describe("sort strings", () => {
  it("parses field and direction, defaulting to asc", () => {
    expect(parseSort("created_at:desc")).toEqual({ field: "created_at", dir: "desc" })
    expect(parseSort("display_name")).toEqual({ field: "display_name", dir: "asc" })
    expect(parseSort("a:desc,b:asc")).toEqual({ field: "a", dir: "desc" })
    expect(parseSort(undefined)).toBeNull()
    expect(parseSort("")).toBeNull()
  })

  it("round-trips", () => {
    expect(formatSort(parseSort("x:desc"))).toBe("x:desc")
    expect(formatSort(null)).toBeUndefined()
  })

  it("cycles first direction, flipped, then default", () => {
    expect(nextSort(undefined, "name")).toBe("name:asc")
    expect(nextSort("name:asc", "name")).toBe("name:desc")
    expect(nextSort("name:desc", "name")).toBeUndefined()
    expect(nextSort("name:desc", "created_at", "desc")).toBe("created_at:desc")
    expect(nextSort("created_at:desc", "created_at", "desc")).toBe("created_at:asc")
    expect(nextSort("created_at:asc", "created_at", "desc")).toBeUndefined()
  })
})
