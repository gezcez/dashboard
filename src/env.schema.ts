import { z } from "zod"

/**
 * Every build-time variable the app reads. Validated twice: in vite.config.ts (so a build
 * with a missing or malformed variable fails) and at boot in src/env.ts.
 */
export const envSchema = z.object({
  VITE_ENV: z.enum(["production", "staging", "development", "preview"]),
  VITE_API_MODE: z.enum(["live", "mock"]).default("live"),
  VITE_API_URL: z.url(),
  VITE_OAUTH_URL: z.url(),
  VITE_WS_URL: z.url(),
  VITE_CLIENT_ID: z.string().min(1),
  VITE_MAP_STYLE_LIGHT: z.url().default("https://tiles.openfreemap.org/styles/positron"),
  VITE_MAP_STYLE_DARK: z.url().default("https://tiles.openfreemap.org/styles/positron"),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
    throw new Error(`Invalid environment variables:\n${issues}`)
  }
  return result.data
}
