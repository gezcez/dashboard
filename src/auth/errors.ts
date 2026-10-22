/** Typed failure kinds from the client integration contract (oauth.md 9.1), plus web specifics. */
export type AuthErrorKind =
  | "cancelled" // user closed the popup or sheet; show nothing scary
  | "state_mismatch" // missing, unknown or expired `state` on the callback
  | "access_denied" // `error=access_denied` on the callback
  | "invalid_grant" // code or refresh token rejected by /v1/oauth/token
  | "signed_out" // no session: getAccessToken() after invalid_grant or logout
  | "network" // fetch failed; never signs the user out
  | "server" // any other OAuth error response
  | "step_up_required" // 403 AUTH_STEP_UP_REQUIRED
  | "popup_blocked"

export class AuthError extends Error {
  readonly kind: AuthErrorKind
  override readonly cause?: unknown

  constructor(kind: AuthErrorKind, message?: string, cause?: unknown) {
    super(message ?? kind)
    this.name = "AuthError"
    this.kind = kind
    this.cause = cause
  }
}

export function isAuthError(error: unknown, kind?: AuthErrorKind): error is AuthError {
  return error instanceof AuthError && (kind === undefined || error.kind === kind)
}
