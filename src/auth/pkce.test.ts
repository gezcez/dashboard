import { describe, expect, it } from "vitest"
import { challengeS256, createState, createVerifier } from "./pkce"

describe("PKCE (RFC 7636)", () => {
  it("matches the Appendix B test vector", async () => {
    expect(await challengeS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    )
  })

  it("creates 43-character base64url verifiers that never repeat", () => {
    const a = createVerifier()
    const b = createVerifier()
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(b).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a).not.toBe(b)
  })

  it("creates 22-character base64url states (16 bytes)", () => {
    expect(createState()).toMatch(/^[A-Za-z0-9_-]{22}$/)
  })
})
