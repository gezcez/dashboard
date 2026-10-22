import type { QueryClient } from "@tanstack/react-query"
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
  // `as never`: re-checking the generic ArgsFor against itself makes TS expand every path
  // (TS2590). Callers are still checked against this function's own signature.
  return apiQueryOptions<P>(api, path, ...(args as never))
}

export function callApi<M extends Method, P extends PathFor<M>>(
  method: M,
  path: P,
  ...args: ArgsFor<M, P>
) {
  return apiCall<M, P>(api, method, path, ...(args as never))
}

/** Invalidates every cached GET whose path starts with `prefix` (keys are ["api", path, params]). */
export function invalidateApi(queryClient: QueryClient, prefix: string) {
  return queryClient.invalidateQueries({
    predicate: (q) =>
      q.queryKey[0] === "api" &&
      typeof q.queryKey[1] === "string" &&
      q.queryKey[1].startsWith(prefix),
  })
}
