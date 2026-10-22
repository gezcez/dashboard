import { useQuery } from "@tanstack/react-query"
import type { components } from "@/api/schema.gen"
import { apiQuery } from "./api"

export type Me = components["schemas"]["Me"]
export type MeNetwork = components["schemas"]["MeNetwork"]

/** GET /v1/me: profile plus global and per-network permission keys. */
export function meQuery() {
  return { ...apiQuery("/v1/me"), staleTime: 5 * 60_000, refetchOnWindowFocus: true }
}

export const ME_KEY = meQuery().queryKey

export function useMe() {
  return useQuery(meQuery())
}
