import { checkCatalogs } from "./check"
import { resources } from "./index"

describe("i18n catalogs", () => {
  it("translate every backend error code and have the same keys in tr and en", () => {
    expect(checkCatalogs(resources)).toEqual([])
  })

  it("reports a missing error code", () => {
    const broken = { en: { errors: {} }, tr: { errors: {} } }
    expect(checkCatalogs(broken)).toContain("en: errors.INTERNAL is missing")
  })
})
