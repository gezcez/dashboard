import { base64UrlDecode } from "./pkce"

/** Claims the UI reads for hints (expiry, sudo countdown). Never trusted for authorization. */
export interface AccessClaims {
  sub: string
  sid: string
  aud: string
  scope: string
  authTime: number
  amr: string[]
  iat: number
  exp: number
}

export function decodeAccessToken(token: string): AccessClaims | null {
  const payload = token.split(".")[1]
  if (!payload) return null
  try {
    const json = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as Record<
      string,
      unknown
    >
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
    const exp = num(json.exp)
    if (exp === null) return null
    return {
      sub: typeof json.sub === "string" ? json.sub : "",
      sid: typeof json.sid === "string" ? json.sid : "",
      aud: typeof json.aud === "string" ? json.aud : "",
      scope: typeof json.scope === "string" ? json.scope : "",
      authTime: num(json.auth_time) ?? num(json.iat) ?? 0,
      amr: Array.isArray(json.amr)
        ? json.amr.filter((x): x is string => typeof x === "string")
        : [],
      iat: num(json.iat) ?? 0,
      exp,
    }
  } catch {
    return null
  }
}
