import { parseEnv } from "./env.schema"

const valid = {
  VITE_ENV: "production",
  VITE_API_URL: "https://api.gezcez.com",
  VITE_OAUTH_URL: "https://oauth.gezcez.com",
  VITE_WS_URL: "wss://api.gezcez.com/v1/ws",
  VITE_CLIENT_ID: "dashboard",
}

describe("parseEnv", () => {
  it("accepts a complete environment and fills defaults", () => {
    const env = parseEnv(valid)
    expect(env.VITE_API_MODE).toBe("live")
    expect(env.VITE_MAP_STYLE_LIGHT).toMatch(/^https:/)
  })

  it("fails loudly when a variable is missing (no hardcoded fallback ENV)", () => {
    const { VITE_API_URL: _, ...missing } = valid
    expect(() => parseEnv(missing)).toThrow(/VITE_API_URL/)
  })

  it("rejects an unknown environment name", () => {
    expect(() => parseEnv({ ...valid, VITE_ENV: "dev" })).toThrow(/VITE_ENV/)
  })
})
