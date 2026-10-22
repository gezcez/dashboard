import { auth } from "@/auth"
import { createGezcezClient } from "@/api/client"
import { apiCall, apiQueryOptions, type ArgsFor, type Method, type PathFor } from "@/api/query"
import { env } from "@/env"

/** The app's API client: typed from src/api/schema.gen.ts, bearer and refresh from src/auth. */
export const api = createGezcezClient({
  baseUrl: env.VITE_API_URL,
  fetch: (request) => auth.fetch(request),
})

export function apiQuery<P extends PathFor<"get">>(path: P, ...args: ArgsFor<"get", P>) {
  return apiQueryOptions(api, path, ...args)
}

export function callApi<M extends Method, P extends PathFor<M>>(
  method: M,
  path: P,
  ...args: ArgsFor<M, P>
) {
  return apiCall(api, method, path, ...args)
}
