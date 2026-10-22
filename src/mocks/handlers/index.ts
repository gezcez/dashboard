import type { HttpHandler, WebSocketHandler } from "msw"
import { createDb } from "../db"
import { createTransitState } from "../transit/state"
import { analyticsHandlers } from "./analytics"
import { appHandlers } from "./apps"
import { createContext } from "./context"
import { coreHandlers } from "./core"
import { emailHandlers } from "./email"
import { realtimeHandlers } from "./realtime"
import { roleHandlers } from "./roles"
import { trackerHandlers } from "./tracker"
import { transitHandlers } from "./transit"
import { userHandlers } from "./users"

/**
 * The whole mock API, typed from src/api/schema.gen.ts via openapi-msw. Each call starts a fresh
 * in-memory db, so a page reload or a new test begins from the fixtures.
 */
export function createHandlers(
  apiUrl: string,
  options: { latency?: boolean; wsUrl?: string } = {},
): (HttpHandler | WebSocketHandler)[] {
  const ctx = createContext(apiUrl, createDb(), options)
  const transit = createTransitState()
  return [
    ...coreHandlers(ctx),
    ...userHandlers(ctx),
    ...roleHandlers(ctx),
    ...appHandlers(ctx),
    ...emailHandlers(ctx),
    ...transitHandlers(ctx, transit),
    ...trackerHandlers(ctx, transit),
    ...analyticsHandlers(ctx),
    ...(options.wsUrl ? realtimeHandlers(ctx, transit, options.wsUrl) : []),
  ]
}
