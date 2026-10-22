import { parseEnv } from "./env.schema"

/** Validated environment. Import this, never `import.meta.env` directly. */
export const env = parseEnv(import.meta.env)

export const isMock = env.VITE_API_MODE === "mock"
export const isProduction = env.VITE_ENV === "production"
