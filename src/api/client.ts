import createClient, { type Middleware } from "openapi-fetch"
import type { paths } from "./schema.gen"

export type GezcezClient = ReturnType<typeof createGezcezClient>

const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function uuid(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("")
}

/** Every mutation carries an Idempotency-Key so a retry after a network error never double-applies. */
export const idempotencyMiddleware: Middleware = {
  onRequest({ request }) {
    if (MUTATIONS.has(request.method) && !request.headers.has("Idempotency-Key")) {
      request.headers.set("Idempotency-Key", uuid())
    }
    return request
  },
}

/**
 * Typed client over openapi-fetch. `fetch` is the auth client's fetch (bearer token, one retry
 * after a 401 AUTH_TOKEN_EXPIRED, step-up event on 403 AUTH_STEP_UP_REQUIRED), so this layer
 * stays auth-agnostic.
 */
export function createGezcezClient(options: {
  baseUrl: string
  fetch: (request: Request) => Promise<Response>
}) {
  const client = createClient<paths>({ baseUrl: options.baseUrl, fetch: options.fetch })
  client.use(idempotencyMiddleware)
  return client
}
