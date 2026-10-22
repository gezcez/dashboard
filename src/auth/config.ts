import type { AuthStorage } from "./storage"

export type AuthEvent =
  | { type: "signed_in" }
  | { type: "refreshed" }
  | { type: "signed_out"; reason: "user" | "expired" | "revoked" }
  | { type: "step_up_required"; maxAge: number }

/** Web Locks subset we use; injectable for tests. */
export interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>
}

/** BroadcastChannel subset we use; injectable for tests. */
export interface ChannelLike {
  postMessage(message: unknown): void
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void
  close(): void
}

/** Browser seams. Defaults use `window`; tests pass fakes. */
export interface WebEnvironment {
  origin: string
  currentHref: () => string
  replaceUrl: (url: string) => void
  navigate: (url: string) => void
  openPopup: (url: string) => Window | null
  isHidden: () => boolean
  onVisible: (callback: () => void) => () => void
  onMessage: (callback: (event: MessageEvent) => void) => () => void
}

export interface AuthConfig {
  clientId: string
  /** `iss` of access tokens, the API origin. */
  issuer: string
  /** oauth.gezcez.com/authorize (or the mock page in mock mode). */
  authorizeUrl: string
  /** RP-initiated logout page: oauth.gezcez.com/logout. */
  endSessionUrl: string
  apiBaseUrl: string
  redirectUri: string
  stepUpRedirectUri: string
  postLogoutRedirectUri: string
  scopes: string[]
  /** The dashboard is a first-party web client: the refresh token is the `gz_rt` cookie. */
  refreshMode: "cookie"
  storage: AuthStorage
  /** Refresh this many seconds before `exp`. Default 60. */
  refreshLeewaySec?: number
  locale?: () => string
  onEvent?: (event: AuthEvent) => void

  // Seams, defaulted for the browser.
  fetch?: typeof fetch
  now?: () => number
  locks?: LockManagerLike | null
  channel?: ChannelLike | null
  web?: Partial<WebEnvironment>
  /** Persists "next login uses prompt=select_account" after an explicit sign-out. */
  flags?: { get(key: string): string | null; set(key: string, value: string | null): void }
}
