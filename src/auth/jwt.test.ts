import { describe, expect, it } from "vitest"
import { makeJwt } from "./__tests__/helpers"
import { decodeAccessToken } from "./jwt"

describe("decodeAccessToken", () => {
  it("reads the UI-hint claims", () => {
    const token = makeJwt({
      sub: "01U",
      sid: "s",
      exp: 200,
      iat: 100,
      auth_time: 90,
      amr: ["otp"],
      aud: "dashboard",
    })
    expect(decodeAccessToken(token)).toMatchObject({
      sub: "01U",
      sid: "s",
      exp: 200,
      authTime: 90,
      amr: ["otp"],
    })
  })

  it("returns null for garbage", () => {
    expect(decodeAccessToken("not-a-jwt")).toBeNull()
    expect(decodeAccessToken("a.b.c")).toBeNull()
    expect(decodeAccessToken(makeJwt({ sub: "x" }))).toBeNull()
  })
})
