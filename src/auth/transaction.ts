import type { AuthStorage } from "./storage"

export const TXN_PREFIX = "gz.auth.txn."
export const TXN_TTL_MS = 10 * 60 * 1000

export type TransactionKind = "login" | "step_up"

export interface Transaction {
  state: string
  verifier: string
  redirectUri: string
  returnTo: string
  kind: TransactionKind
  createdAt: number
}

export async function saveTransaction(storage: AuthStorage, txn: Transaction): Promise<void> {
  await storage.set(TXN_PREFIX + txn.state, JSON.stringify(txn))
}

/**
 * Reads and deletes the transaction for `state`. Returns null when it is unknown, malformed or
 * older than 10 minutes. Also sweeps other expired transactions.
 */
export async function takeTransaction(
  storage: AuthStorage,
  state: string,
  now: number,
): Promise<Transaction | null> {
  const raw = await storage.get(TXN_PREFIX + state)
  await storage.remove(TXN_PREFIX + state)
  await sweepExpired(storage, now)
  if (!raw) return null
  try {
    const txn = JSON.parse(raw) as Partial<Transaction>
    if (
      txn.state !== state ||
      typeof txn.verifier !== "string" ||
      typeof txn.redirectUri !== "string" ||
      typeof txn.createdAt !== "number"
    ) {
      return null
    }
    if (now - txn.createdAt > TXN_TTL_MS || txn.createdAt > now + 60_000) return null
    return {
      state: txn.state,
      verifier: txn.verifier,
      redirectUri: txn.redirectUri,
      returnTo: safeInternalPath(txn.returnTo),
      kind: txn.kind === "step_up" ? "step_up" : "login",
      createdAt: txn.createdAt,
    }
  } catch {
    return null
  }
}

async function sweepExpired(storage: AuthStorage, now: number): Promise<void> {
  for (const key of await storage.keys(TXN_PREFIX)) {
    const raw = await storage.get(key)
    try {
      const createdAt = (JSON.parse(raw ?? "{}") as { createdAt?: unknown }).createdAt
      if (typeof createdAt !== "number" || now - createdAt > TXN_TTL_MS) await storage.remove(key)
    } catch {
      await storage.remove(key)
    }
  }
}

const PROBE_ORIGIN = "https://same-origin.invalid"

/**
 * Accepts only a same-origin path. Anything that could leave the origin (protocol-relative,
 * backslash tricks, absolute URLs, `javascript:`, encoded variants) becomes "/".
 */
export function safeInternalPath(input: unknown): string {
  if (typeof input !== "string" || !input.startsWith("/")) return "/"
  // Reject control characters anywhere.
  for (const ch of input) {
    const code = ch.charCodeAt(0)
    if (code < 0x20 || code === 0x7f) return "/"
  }
  let decoded = input
  for (let i = 0; i < 3; i++) {
    let next: string
    try {
      next = decodeURIComponent(decoded)
    } catch {
      return "/"
    }
    if (next === decoded) break
    decoded = next
  }
  if (decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("\\")) return "/"
  try {
    const url = new URL(input, PROBE_ORIGIN)
    if (url.origin !== PROBE_ORIGIN) return "/"
    return url.pathname + url.search + url.hash
  } catch {
    return "/"
  }
}

/** Turns `location.href` (same origin) or a path into a safe internal path. */
export function toInternalPath(hrefOrPath: string | undefined, origin: string): string {
  if (!hrefOrPath) return "/"
  if (hrefOrPath.startsWith(origin + "/")) return safeInternalPath(hrefOrPath.slice(origin.length))
  return safeInternalPath(hrefOrPath)
}
