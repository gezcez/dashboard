/** Key-value storage seam (oauth.md 9.4). The dashboard only stores the PKCE transaction. */
export interface AuthStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  /** Keys with the given prefix, so expired transactions can be swept. */
  keys(prefix: string): Promise<string[]>
}

export function memoryStorage(initial: Record<string, string> = {}): AuthStorage {
  const map = new Map(Object.entries(initial))
  return {
    get: (k) => Promise.resolve(map.get(k) ?? null),
    set: (k, v) => {
      map.set(k, v)
      return Promise.resolve()
    },
    remove: (k) => {
      map.delete(k)
      return Promise.resolve()
    },
    keys: (prefix) => Promise.resolve([...map.keys()].filter((k) => k.startsWith(prefix))),
  }
}

/**
 * sessionStorage: survives the redirect, scoped to the tab, gone when the tab closes. Holds the
 * PKCE transaction only; tokens never go here. Every access is guarded because storage can throw
 * (private mode, blocked site data).
 */
export function webSessionStorage(store: () => Storage = () => window.sessionStorage): AuthStorage {
  return {
    get: (k) => {
      try {
        return Promise.resolve(store().getItem(k))
      } catch {
        return Promise.resolve(null)
      }
    },
    set: (k, v) => {
      try {
        store().setItem(k, v)
      } catch {
        // The login still works in this tab's memory-less flow only if storage works; the
        // callback then reports state_mismatch, which is the safe failure.
      }
      return Promise.resolve()
    },
    remove: (k) => {
      try {
        store().removeItem(k)
      } catch {
        // ignore
      }
      return Promise.resolve()
    },
    keys: (prefix) => {
      try {
        const s = store()
        const out: string[] = []
        for (let i = 0; i < s.length; i++) {
          const key = s.key(i)
          if (key?.startsWith(prefix)) out.push(key)
        }
        return Promise.resolve(out)
      } catch {
        return Promise.resolve([])
      }
    },
  }
}
