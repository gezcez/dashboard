export type AppPlatform = "web" | "native" | "dev"

export type RedirectUriProblem =
  "invalid" | "https_required" | "custom_scheme_native_only" | "wildcard" | "fragment" | "duplicate"

export interface RedirectUriCheck {
  uri: string
  problem: RedirectUriProblem | null
  /** Same URI apart from a trailing slash exists in the list (allowed, but usually a mistake). */
  trailingSlashTwin: boolean
}

const LOOPBACK = new Set(["localhost", "127.0.0.1"])

/**
 * Backend 6.2 rules: `https://` only, except `http://localhost:<port>` and
 * `http://127.0.0.1:<port>` for dev clients and custom schemes for native clients. Exact match,
 * so no wildcards and no fragments.
 */
export function checkRedirectUri(uri: string, platform: AppPlatform): RedirectUriProblem | null {
  const trimmed = uri.trim()
  if (trimmed.includes("*")) return "wildcard"
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return "invalid"
  }
  if (url.hash || trimmed.includes("#")) return "fragment"
  if (url.protocol === "https:") return url.hostname ? null : "invalid"
  if (url.protocol === "http:") {
    return platform === "dev" && LOOPBACK.has(url.hostname) && url.port !== ""
      ? null
      : "https_required"
  }
  if (/^[a-z][a-z0-9+.-]*:$/.test(url.protocol)) {
    return platform === "native" ? null : "custom_scheme_native_only"
  }
  return "invalid"
}

export function checkRedirectUris(uris: string[], platform: AppPlatform): RedirectUriCheck[] {
  const norm = (u: string) => u.trim().replace(/\/$/, "")
  return uris.map((uri, i) => {
    const duplicate = uris.findIndex((u) => u.trim() === uri.trim()) !== i
    return {
      uri,
      problem: duplicate ? "duplicate" : checkRedirectUri(uri, platform),
      trailingSlashTwin: uris.some(
        (u, j) => j !== i && u.trim() !== uri.trim() && norm(u) === norm(uri),
      ),
    }
  })
}
