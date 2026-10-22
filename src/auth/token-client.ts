import { AuthError } from "./errors"

/** RFC 6749 token response. `refresh_token` is absent for cookie clients (it is the gz_rt cookie). */
export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
  refresh_token?: string
}

interface TokenClientOptions {
  apiBaseUrl: string
  clientId: string
  fetch: typeof fetch
}

async function postForm(
  opts: TokenClientOptions,
  path: string,
  body: Record<string, string>,
): Promise<Response> {
  try {
    return await opts.fetch(`${opts.apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      // The gz_rt cookie (Path=/v1/oauth, SameSite=Strict) only travels with credentials.
      credentials: "include",
      body: new URLSearchParams(body).toString(),
    })
  } catch (error) {
    throw new AuthError("network", "token endpoint unreachable", error)
  }
}

async function readTokenResponse(res: Response): Promise<TokenResponse> {
  let json: unknown
  try {
    json = await res.json()
  } catch (error) {
    throw new AuthError(
      res.ok ? "server" : res.status >= 500 ? "network" : "server",
      "unreadable token response",
      error,
    )
  }
  if (!res.ok) {
    const error = (json as { error?: unknown } | null)?.error
    if (error === "invalid_grant") throw new AuthError("invalid_grant")
    if (res.status >= 500) throw new AuthError("network", `token endpoint ${res.status}`)
    throw new AuthError(
      "server",
      typeof error === "string" ? error : `token endpoint ${res.status}`,
    )
  }
  const body = json as Partial<TokenResponse>
  if (typeof body.access_token !== "string" || typeof body.expires_in !== "number") {
    throw new AuthError("server", "token response without access_token")
  }
  return body as TokenResponse
}

export async function exchangeCode(
  opts: TokenClientOptions,
  params: { code: string; verifier: string; redirectUri: string },
): Promise<TokenResponse> {
  const res = await postForm(opts, "/v1/oauth/token", {
    grant_type: "authorization_code",
    client_id: opts.clientId,
    code: params.code,
    code_verifier: params.verifier,
    redirect_uri: params.redirectUri,
  })
  return readTokenResponse(res)
}

/** Cookie refresh: empty refresh_token, the browser sends gz_rt. */
export async function refreshWithCookie(opts: TokenClientOptions): Promise<TokenResponse> {
  const res = await postForm(opts, "/v1/oauth/token", {
    grant_type: "refresh_token",
    client_id: opts.clientId,
  })
  return readTokenResponse(res)
}

/** RFC 7009. For cookie clients the server reads gz_rt, revokes the family and clears the cookie. */
export async function revokeWithCookie(opts: TokenClientOptions): Promise<void> {
  const res = await postForm(opts, "/v1/oauth/revoke", {
    client_id: opts.clientId,
    token_type_hint: "refresh_token",
  })
  if (!res.ok && res.status >= 500) throw new AuthError("network", `revoke ${res.status}`)
}
