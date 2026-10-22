import type { ChannelLike, LockManagerLike } from "./config"

export const CHANNEL_NAME = "gz.auth"

export type CrossTabMessage =
  { type: "logout" } | { type: "refreshed" } | { type: "step_up"; ok: boolean }

export function isCrossTabMessage(data: unknown): data is CrossTabMessage {
  if (typeof data !== "object" || data === null) return false
  const type = (data as { type?: unknown }).type
  return type === "logout" || type === "refreshed" || type === "step_up"
}

export function defaultLocks(): LockManagerLike | null {
  if (typeof navigator !== "undefined" && "locks" in navigator && navigator.locks) {
    const locks = navigator.locks
    return {
      request: <T>(name: string, cb: () => Promise<T>) => locks.request(name, cb) as Promise<T>,
    }
  }
  return null
}

export function defaultChannel(): ChannelLike | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Fallback mutex for browsers without Web Locks (Safari before 15.4): a localStorage lease with
 * write-then-verify. Holds at most `leaseMs`; after `maxWaitMs` it proceeds anyway and relies on
 * the backend's 10 s grace window.
 */
export function localStorageLocks(
  storage: () => Storage = () => window.localStorage,
  { leaseMs = 10_000, maxWaitMs = 12_000 } = {},
): LockManagerLike {
  const owner = Math.random().toString(36).slice(2)
  return {
    async request(name, callback) {
      const key = `gz.auth.lock.${name}`
      const started = Date.now()
      let held = false
      while (!held && Date.now() - started < maxWaitMs) {
        try {
          const s = storage()
          const current = s.getItem(key)
          const until = current ? Number(current.split(":")[1]) : 0
          if (!current || until < Date.now()) {
            s.setItem(key, `${owner}:${Date.now() + leaseMs}`)
            await sleep(25)
            held = s.getItem(key)?.startsWith(`${owner}:`) ?? false
          }
        } catch {
          break // storage unavailable: proceed without the lock
        }
        if (!held) await sleep(50)
      }
      try {
        return await callback()
      } finally {
        try {
          if (storage().getItem(key)?.startsWith(`${owner}:`)) storage().removeItem(key)
        } catch {
          // ignore
        }
      }
    },
  }
}
