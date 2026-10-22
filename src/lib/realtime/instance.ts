import { auth, isAuthError } from "@/auth"
import { env, isProduction } from "@/env"
import { documentVisibility, RealtimeClient, windowOnline } from "./client"

/** The tab's one realtime socket (opened lazily by the first subscription). */
export const realtime = new RealtimeClient({
  url: env.VITE_WS_URL,
  getToken: async () => {
    if (auth.status() !== "signed_in") return null
    try {
      return await auth.getAccessToken()
    } catch (error) {
      if (isAuthError(error, "signed_out")) return null
      throw error
    }
  },
  validate: !isProduction,
  visibility: documentVisibility(),
  online: windowOnline(),
})

auth.onEvent((event) => {
  if (event.type === "refreshed") void realtime.reauth()
})
