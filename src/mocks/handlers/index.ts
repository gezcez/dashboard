import type { HttpHandler } from "msw"
import { createDb } from "../db"
import { appHandlers } from "./apps"
import { createContext } from "./context"
import { coreHandlers } from "./core"
import { emailHandlers } from "./email"
import { roleHandlers } from "./roles"
import { userHandlers } from "./users"

/**
 * The whole mock API, typed from src/api/schema.gen.ts via openapi-msw. Each call starts a fresh
 * in-memory db, so a page reload or a new test begins from the fixtures.
 */
export function createHandlers(apiUrl: string, options: { latency?: boolean } = {}): HttpHandler[] {
  const ctx = createContext(apiUrl, createDb(), options)
  return [
    ...coreHandlers(ctx),
    ...userHandlers(ctx),
    ...roleHandlers(ctx),
    ...appHandlers(ctx),
    ...emailHandlers(ctx),
  ]
}
