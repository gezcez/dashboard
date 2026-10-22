import { createFileRoute, redirect } from "@tanstack/react-router"
import { NoRolesState } from "@/components/states/states"
import { canSeePage, PAGE_IDS, PAGES } from "@/lib/pages"
import { usePrefs } from "@/lib/prefs-store"

/** `/`: global overview for platform staff, else the last or first network, else "no roles". */
export const Route = createFileRoute("/_app/")({
  beforeLoad: ({ context: { me } }) => {
    if (canSeePage(me, "admin.overview")) throw redirect({ to: "/admin" })
    const last = usePrefs.getState().lastNetwork
    const network = me.networks.find((n) => n.slug === last) ?? me.networks[0]
    if (network) throw redirect({ to: "/n/$network", params: { network: network.slug } })
    const firstGlobal = PAGE_IDS.find((id) => PAGES[id].scope === "global" && canSeePage(me, id))
    if (firstGlobal) throw redirect({ href: PAGES[firstGlobal].to })
  },
  component: NoRolesState,
})
