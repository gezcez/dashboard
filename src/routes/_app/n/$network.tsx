import { createFileRoute, notFound, Outlet, useParams } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import { NotFoundState } from "@/components/states/states"
import { apiQuery } from "@/lib/api"
import type { NetworkContext } from "@/lib/pages"
import { can } from "@/lib/permissions"
import { usePrefs } from "@/lib/prefs-store"

/**
 * Network scope lives in the path (`/n/kocaeli/...`). The slug resolves through the `me` cache;
 * holders of networks.read.all can open any network via GET /v1/dash/networks/:slug.
 */
export const Route = createFileRoute("/_app/n/$network")({
  beforeLoad: async ({
    context,
    params,
  }): Promise<{ network: NetworkContext & { cityName: string } }> => {
    const mine = context.me.networks.find((n) => n.slug === params.network)
    if (mine)
      return {
        network: { id: mine.id, slug: mine.slug, name: mine.name, cityName: mine.city.name },
      }
    if (can(context.me, "networks.read.all", "global")) {
      try {
        const n = await context.queryClient.query({
          ...apiQuery("/v1/dash/networks/{networkId}", {
            params: { path: { networkId: params.network } },
          }),
          staleTime: "static",
        })
        return { network: { id: n.id, slug: n.slug, name: n.name, cityName: n.city.name } }
      } catch (error) {
        if (!isApiError(error, "NOT_FOUND")) throw error
      }
    }
    throw notFound()
  },
  component: NetworkLayout,
  notFoundComponent: NetworkNotFound,
})

function NetworkLayout() {
  const { network } = Route.useRouteContext()
  const setLastNetwork = usePrefs((s) => s.setLastNetwork)
  useEffect(() => setLastNetwork(network.slug), [network.slug, setLastNetwork])
  return <Outlet />
}

function NetworkNotFound() {
  const { t } = useTranslation()
  const { network } = useParams({ strict: false })
  return (
    <NotFoundState
      title={t("states.networkNotFoundTitle")}
      body={t("states.networkNotFoundBody", { slug: network ?? "" })}
    />
  )
}
