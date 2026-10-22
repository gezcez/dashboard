import { describe, expect, it } from "vitest"
import {
  cellKey,
  countOps,
  disabledReason,
  grantsFrom,
  groupByArea,
  isChecked,
  isDangerous,
  keepFailed,
  toOperations,
  toggleCell,
} from "./matrix-diff"

const grants = grantsFrom([
  { role_id: 5, permissions: ["catalog.read", "analytics.read"] },
  { role_id: 6, permissions: ["catalog.read"] },
])

describe("matrix diff", () => {
  it("stages a grant on an empty cell and a revoke on a held one", () => {
    let staged = toggleCell(grants, new Map(), 6, "analytics.read")
    staged = toggleCell(grants, staged, 5, "catalog.read")
    expect(staged.get(cellKey(6, "analytics.read"))).toBe("grant")
    expect(staged.get(cellKey(5, "catalog.read"))).toBe("revoke")
    expect(isChecked(grants, staged, 6, "analytics.read")).toBe(true)
    expect(isChecked(grants, staged, 5, "catalog.read")).toBe(false)
    expect(countOps(staged)).toEqual({ grants: 1, revokes: 1 })
  })

  it("drops a cell from the diff when toggled back", () => {
    const once = toggleCell(grants, new Map(), 6, "analytics.read")
    const twice = toggleCell(grants, once, 6, "analytics.read")
    expect(twice.size).toBe(0)
    expect(isChecked(grants, twice, 6, "analytics.read")).toBe(false)
  })

  it("orders operations by role then key", () => {
    let staged = toggleCell(grants, new Map(), 6, "users.read")
    staged = toggleCell(grants, staged, 5, "users.read")
    staged = toggleCell(grants, staged, 5, "analytics.read")
    expect(toOperations(staged)).toEqual([
      { role_id: 5, permission_key: "analytics.read", op: "revoke" },
      { role_id: 5, permission_key: "users.read", op: "grant" },
      { role_id: 6, permission_key: "users.read", op: "grant" },
    ])
  })

  it("keeps failed operations staged after a save", () => {
    let staged = toggleCell(grants, new Map(), 6, "users.read")
    staged = toggleCell(grants, staged, 5, "users.read")
    const left = keepFailed(staged, [
      { role_id: 6, permission_key: "users.read", op: "grant", ok: true, error_code: null },
      {
        role_id: 5,
        permission_key: "users.read",
        op: "grant",
        ok: false,
        error_code: "PERMISSION_MISSING",
      },
    ])
    expect([...left.keys()]).toEqual([cellKey(5, "users.read")])
  })

  it("flags sudo and global keys as dangerous", () => {
    expect(isDangerous({ sudo: true, scope: "network" })).toBe(true)
    expect(isDangerous({ sudo: false, scope: "global" })).toBe(true)
    expect(isDangerous({ sudo: false, scope: "network" })).toBe(false)
    expect(isDangerous(undefined)).toBe(true)
  })

  it("disables immutable roles, higher roles and keys the viewer lacks", () => {
    const viewer = { held: new Set(["catalog.read"]), level: 60, root: false }
    expect(disabledReason({ immutable: true, level: 10 }, "catalog.read", viewer)).toBe("immutable")
    expect(disabledReason({ immutable: false, level: 60 }, "catalog.read", viewer)).toBe("level")
    expect(disabledReason({ immutable: false, level: 10 }, "users.read", viewer)).toBe("not_held")
    expect(disabledReason({ immutable: false, level: 10 }, "catalog.read", viewer)).toBeNull()
    // Root skips level and held checks but still can't edit built-in roles.
    const root = { held: new Set<string>(), level: 100, root: true }
    expect(disabledReason({ immutable: false, level: 100 }, "users.read", root)).toBeNull()
    expect(disabledReason({ immutable: true, level: 10 }, "users.read", root)).toBe("immutable")
  })

  it("groups keys by area prefix", () => {
    const groups = groupByArea([
      { key: "users.read" },
      { key: "tracker.read" },
      { key: "users.pii.read" },
    ])
    expect(groups.map(([a, items]) => [a, items.length])).toEqual([
      ["tracker", 1],
      ["users", 2],
    ])
  })
})
