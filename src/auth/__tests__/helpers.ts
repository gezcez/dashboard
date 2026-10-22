import type { ChannelLike, LockManagerLike, WebEnvironment } from "../config"
import { base64UrlEncode } from "../pkce"
import { WebAuthClient } from "../session"
import { memoryStorage, type AuthStorage } from "../storage"

export const API = "https://api.test"
export const ORIGIN = "https://dash.test"

export function makeJwt(claims: Record<string, unknown>): string {
  const enc = (o: unknown) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(o)))
  return `${enc({ alg: "ES256", typ: "JWT" })}.${enc(claims)}.sig`
}

export function tokenBody(
  sub = "01USER",
  ttlSec = 900,
  nowSec = Math.floor(Date.now() / 1000),
  extra = {},
) {
  return {
    access_token: makeJwt({
      sub,
      sid: "s1",
      aud: "dashboard",
      iat: nowSec,
      exp: nowSec + ttlSec,
      auth_time: nowSec,
      ...extra,
    }),
    token_type: "Bearer",
    expires_in: ttlSec,
    scope: "openid profile email offline_access dash",
  }
}

/** In-memory BroadcastChannel: every channel created from the same bus hears the others. */
export function channelBus() {
  const members = new Set<{ listeners: Set<(e: MessageEvent) => void> }>()
  return {
    create(): ChannelLike {
      const self = { listeners: new Set<(e: MessageEvent) => void>() }
      members.add(self)
      return {
        postMessage(message) {
          for (const m of members) {
            if (m === self) continue
            for (const l of m.listeners) l(new MessageEvent("message", { data: message }))
          }
        },
        addEventListener: (_t, l) => self.listeners.add(l),
        removeEventListener: (_t, l) => self.listeners.delete(l),
        close: () => members.delete(self),
      }
    },
  }
}

/** FIFO mutex standing in for navigator.locks, shared by "tabs" that share it. */
export function fakeLocks(): LockManagerLike & { log: string[] } {
  const queues = new Map<string, Promise<unknown>>()
  const log: string[] = []
  return {
    log,
    request<T>(name: string, cb: () => Promise<T>): Promise<T> {
      const prev = queues.get(name) ?? Promise.resolve()
      const run = prev
        .catch(() => undefined)
        .then(() => {
          log.push(`acquire ${name}`)
          return cb()
        })
      queues.set(
        name,
        run.catch(() => undefined),
      )
      return run
    },
  }
}

export interface FakeWeb extends WebEnvironment {
  navigated: string[]
  replaced: string[]
  hidden: boolean
  visible: () => void
  message: (event: Partial<MessageEvent> & { data: unknown }) => void
  popup: { closed: boolean; close: () => void } | null
  href: string
}

export function fakeWeb(): FakeWeb {
  const visibleCbs = new Set<() => void>()
  const messageCbs = new Set<(e: MessageEvent) => void>()
  const web: FakeWeb = {
    origin: ORIGIN,
    href: `${ORIGIN}/n/kocaeli`,
    navigated: [],
    replaced: [],
    hidden: false,
    popup: null,
    currentHref: () => web.href,
    replaceUrl: (url) => {
      web.replaced.push(url)
      web.href = ORIGIN + url
    },
    navigate: (url) => web.navigated.push(url),
    openPopup: () => web.popup as unknown as Window | null,
    isHidden: () => web.hidden,
    onVisible: (cb) => {
      visibleCbs.add(cb)
      return () => visibleCbs.delete(cb)
    },
    onMessage: (cb) => {
      messageCbs.add(cb)
      return () => messageCbs.delete(cb)
    },
    visible: () => {
      web.hidden = false
      for (const cb of visibleCbs) cb()
    },
    message: (event) => {
      for (const cb of messageCbs) cb(event as MessageEvent)
    },
  }
  return web
}

export function makeClient(
  opts: {
    web?: FakeWeb
    storage?: AuthStorage
    locks?: LockManagerLike | null
    channel?: ChannelLike | null
    fetch?: typeof fetch
    now?: () => number
    flags?: Map<string, string>
  } = {},
) {
  const web = opts.web ?? fakeWeb()
  const flags = opts.flags ?? new Map<string, string>()
  const client = new WebAuthClient({
    clientId: "dashboard",
    issuer: API,
    authorizeUrl: "https://oauth.test/authorize",
    endSessionUrl: "https://oauth.test/logout",
    apiBaseUrl: API,
    redirectUri: `${ORIGIN}/auth/callback`,
    stepUpRedirectUri: `${ORIGIN}/auth/step-up`,
    postLogoutRedirectUri: `${ORIGIN}/auth/logged-out`,
    scopes: ["openid", "profile", "email", "offline_access", "dash"],
    refreshMode: "cookie",
    storage: opts.storage ?? memoryStorage(),
    locale: () => "tr",
    locks: opts.locks === undefined ? fakeLocks() : opts.locks,
    channel: opts.channel ?? null,
    fetch: opts.fetch,
    now: opts.now,
    web,
    flags: {
      get: (k) => flags.get(k) ?? null,
      set: (k, v) => (v === null ? flags.delete(k) : flags.set(k, v)),
    },
  })
  return { client, web, flags }
}
