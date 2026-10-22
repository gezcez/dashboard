import { describe, expect, it } from "vitest"
import { toCsv } from "./csv"

describe("toCsv", () => {
  it("quotes only when needed and starts with a BOM", () => {
    const csv = toCsv(
      ["a", "b"],
      [
        ["plain", 'say "hi", ok'],
        [1, null],
      ],
    )
    expect(csv).toBe('﻿a,b\r\nplain,"say ""hi"", ok"\r\n1,\r\n')
  })
})
