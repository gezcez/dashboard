import { QueryCache, QueryClient } from "@tanstack/react-query"
import { isApiError } from "@/api/envelope"
import { isAuthError } from "@/auth/errors"
import { ME_KEY } from "./me"

function isMeQuery(key: readonly unknown[]): boolean {
  return key[0] === ME_KEY[0] && key[1] === ME_KEY[1]
}

export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // A 403 means permissions changed under us: refetch `me` so nav and gates catch up.
        if (isApiError(error) && error.status === 403 && !isMeQuery(query.queryKey)) {
          void client.invalidateQueries({ queryKey: ME_KEY })
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false
          return failureCount < 2
        },
      },
      mutations: { retry: false },
    },
  })
  return client
}
