import { describe, expect, it } from "vitest"
import { findPersona, meFor, NETWORKS, type Persona } from "@/mocks/fixtures"
import { assertPage, canSeePage, visiblePages, type NetworkContext } from "./pages"
import { can, ForbiddenError, hasAnyGlobalPermission } from "./permissions"

const persona = (id: string): Persona => {
  const p = findPersona(id)
  if (!p) throw new Error(`no persona ${id}`)
  return p
}
const me = (id: string) => meFor(persona(id), 0)
const network = (slug: string): NetworkContext => {
  const n = NETWORKS.find((x) => x.slug === slug)
  if (!n) throw new Error(`no network ${slug}`)
  return { id: n.id, slug: n.slug, name: n.name }
}

describe("can()", () => {
  it("is undefined while me is unknown", () => {
    expect(can(undefined, "system.health.read", "global")).toBeUndefined()
  })

  it("passes a network check on a global grant", () => {
    expect(can(me("founder"), "network.overview.read", { network: 999 })).toBe(true)
  })

  it("never passes a global check on a network grant", () => {
    const admin = me("network-admin")
    expect(can(admin, "network.overview.read", { network: network("kocaeli").id })).toBe(true)
    expect(can(admin, "network.overview.read", "global")).toBe(false)
  })

  it("scopes network grants to their own network, by id or slug", () => {
    const admin = me("network-admin")
    expect(can(admin, "members.read", { network: "kocaeli" })).toBe(true)
    expect(can(admin, "members.read", { network: network("sakarya").id })).toBe(false)
  })

  it("knows who has a global role", () => {
    expect(hasAnyGlobalPermission(me("moderator"))).toBe(true)
    expect(hasAnyGlobalPermission(me("analyst"))).toBe(false)
  })
})

describe("page registry", () => {
  it("shows platform pages only to holders of the global permission", () => {
    expect(visiblePages(me("founder"), "platform")).toContain("admin.overview")
    expect(visiblePages(me("network-admin"), "platform")).toEqual([])
    expect(visiblePages(me("analyst"), "platform")).toEqual([])
  })

  it("needs a network for network pages", () => {
    expect(canSeePage(me("analyst"), "network.overview")).toBe(false)
    expect(canSeePage(me("analyst"), "network.overview", network("kocaeli"))).toBe(true)
    expect(canSeePage(me("analyst"), "network.overview", network("istanbul-iett"))).toBe(false)
  })

  it("guards routes with a ForbiddenError naming the permission and network", () => {
    expect(() => {
      assertPage("admin.overview", { me: me("analyst") })
    }).toThrow(ForbiddenError)
    try {
      assertPage("network.overview", { me: me("analyst"), network: network("istanbul-iett") })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError)
      expect((error as ForbiddenError).permission).toBe("network.overview.read")
      expect((error as ForbiddenError).networkName).toBe("İETT")
    }
    expect(() => {
      assertPage("admin.overview", { me: me("founder") })
    }).not.toThrow()
  })
})
