import { env, isMock } from "@/env"
import { i18n } from "@/i18n"
import { createWebAuth } from "./session"
import { webSessionStorage } from "./storage"

export * from "./errors"
export * from "./session"
export { safeInternalPath } from "./transaction"

const origin = window.location.origin

/** The app's configured auth client. Tests construct their own with createWebAuth(). */
export const auth = createWebAuth({
  clientId: env.VITE_CLIENT_ID,
  issuer: env.VITE_API_URL,
  // Mock builds run the whole flow against an in-app persona picker and MSW.
  authorizeUrl: isMock ? `${origin}/mock/authorize` : `${env.VITE_OAUTH_URL}/authorize`,
  endSessionUrl: isMock ? `${origin}/mock/logout` : `${env.VITE_OAUTH_URL}/logout`,
  apiBaseUrl: env.VITE_API_URL,
  redirectUri: `${origin}/auth/callback`,
  stepUpRedirectUri: `${origin}/auth/step-up`,
  postLogoutRedirectUri: `${origin}/auth/logged-out`,
  scopes: ["openid", "profile", "email", "offline_access", "dash"],
  refreshMode: "cookie",
  storage: webSessionStorage(),
  locale: () => i18n.language,
})
