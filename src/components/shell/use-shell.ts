import { useMatch, useMatches } from "@tanstack/react-router"
import type { NetworkContext, PageId } from "@/lib/pages"

/** The network of the current /n/$network route, if any. */
export function useCurrentNetwork(): (NetworkContext & { cityName: string }) | null {
  const match = useMatch({ from: "/_app/n/$network", shouldThrow: false })
  return match?.context.network ?? null
}

/** The page registry id of the deepest matched route. */
export function useCurrentPageId(): PageId | null {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const id = matches[i]?.staticData.pageId
    if (id) return id
  }
  return null
}
