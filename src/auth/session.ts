import type { AuthConfig, AuthEvent, ChannelLike, LockManagerLike, WebEnvironment } from "./config"
import {
  defaultChannel,
  defaultLocks,
  isCrossTabMessage,
  localStorageLocks,
  type CrossTabMessage,
} from "./cross-tab"
import { AuthError, isAuthError } from "./errors"
import { decodeAccessToken, type AccessClaims } from "./jwt"
import { challengeS256, createState, createVerifier } from "./pkce"
import {
  exchangeCode,
  refreshWithCookie,
  revokeWithCookie,
  type TokenResponse,
} from "./token-client"
import {
  saveTransaction,
  takeTransaction,
  toInternalPath,
  type TransactionKind,
} from "./transaction"

export type AuthStatus = "unknown" | "signed_in" | "signed_out"

export interface LoginOptions {
  returnTo?: string
  prompt?: "login" | "select_account" | "consent"
  maxAge?: number
  loginHint?: string
}

export interface StepUpOptions {
  maxAge?: number
  returnTo?: string
  mode?: "popup" | "redirect"
  /** Cancels a popup step-up that is still waiting (the dialog's Cancel button). */
  signal?: AbortSignal
}

export type StepUpResult = { type: "elevated" } | { type: "redirected" }

export interface CallbackResult {
  returnTo: string
  kind: TransactionKind
  /** True when this callback runs in a step-up popup. */
  popup: boolean
}

/** Reference interface from oauth.md 9.2, web flavour. */
export interface AuthClient {
  status(): AuthStatus
  subscribe(listener: (status: AuthStatus) => void): () => void
  onEvent(listener: (event: AuthEvent) => void): () => void
  login(opts?: LoginOptions): Promise<void>
  handleCallback(url?: string): Promise<CallbackResult>
  getAccessToken(): Promise<string>
  tryRestore(): Promise<boolean>
  stepUp(opts?: StepUpOptions): Promise<StepUpResult>
  logout(opts?: { endIdentitySession?: boolean }): Promise<void>
  claims(): AccessClaims | null
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  /** Hooks run on logout (local or from another tab): clear the query cache, close sockets. */
  onLogout(hook: () => void): () => void
  dispose(): void
}

export const STEP_UP_MESSAGE = "gz-step-up"

function closeQuietly(popup: Window): void {
  try {
    popup.close()
  } catch {
    // severed by COOP
  }
}
export const SELECT_ACCOUNT_FLAG = "gz.auth.select_account"
const STEP_UP_MAX_WAIT_MS = 10 * 60 * 1000

interface AccessState {
  token: string
  claims: AccessClaims
  /** Absolute expiry in ms (from expires_in, capped by the JWT exp). */
  expiresAt: number
}

function browserEnvironment(): WebEnvironment {
  return {
    origin: window.location.origin,
    currentHref: () => window.location.href,
    replaceUrl: (url) => window.history.replaceState(window.history.state, "", url),
    navigate: (url) => window.location.assign(url),
    openPopup: (url) => window.open(url, "gz-step-up", "popup,width=480,height=720"),
    isHidden: () => document.visibilityState === "hidden",
    onVisible: (cb) => {
      const handler = () => {
        if (document.visibilityState === "visible") cb()
      }
      document.addEventListener("visibilitychange", handler)
      return () => document.removeEventListener("visibilitychange", handler)
    },
    onMessage: (cb) => {
      window.addEventListener("message", cb)
      return () => window.removeEventListener("message", cb)
    },
  }
}

function browserFlags(): NonNullable<AuthConfig["flags"]> {
  return {
    get: (k) => {
      try {
        return window.localStorage.getItem(k)
      } catch {
        return null
      }
    },
    set: (k, v) => {
      try {
        if (v === null) window.localStorage.removeItem(k)
        else window.localStorage.setItem(k, v)
      } catch {
        // ignore: the flag is a convenience
      }
    },
  }
}

async function readErrorCode(res: Response): Promise<{ code?: string; maxAge?: number }> {
  try {
    const body = (await res.clone().json()) as {
      error?: { code?: unknown; details?: { max_age?: unknown } }
    }
    const code = typeof body.error?.code === "string" ? body.error.code : undefined
    const maxAge =
      typeof body.error?.details?.max_age === "number" ? body.error.details.max_age : undefined
    return { code, maxAge }
  } catch {
    return {}
  }
}

/**
 * Web implementation of the gezcez client integration contract (oauth.md section 9):
 * PKCE + state, code exchange, access token in memory only, refresh through the HttpOnly gz_rt
 * cookie with in-tab single-flight and a cross-tab Web Lock, BroadcastChannel sign-out, popup
 * step-up with redirect fallback, revoke-then-clear logout.
 */
export class WebAuthClient implements AuthClient {
  private readonly cfg: AuthConfig
  private readonly env: WebEnvironment
  private readonly fetchImpl: typeof fetch
  private readonly now: () => number
  private readonly locks: LockManagerLike
  private readonly channel: ChannelLike | null
  private readonly flags: NonNullable<AuthConfig["flags"]>
  private readonly leewayMs: number
  private readonly lockName: string

  private state: AuthStatus = "unknown"
  private access: AccessState | null = null
  private inflight: Promise<AccessState> | null = null
  private refreshTimer: ReturnType<typeof setTimeout> | null = null
  private refreshDueWhileHidden = false
  private readonly statusListeners = new Set<(s: AuthStatus) => void>()
  private readonly eventListeners = new Set<(e: AuthEvent) => void>()
  private readonly logoutHooks = new Set<() => void>()
  private readonly cleanups: (() => void)[] = []

  constructor(cfg: AuthConfig) {
    this.cfg = cfg
    const hasWindow = typeof window !== "undefined"
    this.env = { ...(hasWindow ? browserEnvironment() : ({} as WebEnvironment)), ...cfg.web }
    this.fetchImpl = cfg.fetch ?? ((input, init) => globalThis.fetch(input, init))
    this.now = cfg.now ?? (() => Date.now())
    this.locks =
      cfg.locks === undefined
        ? (defaultLocks() ?? localStorageLocks())
        : (cfg.locks ?? localStorageLocks())
    this.channel = cfg.channel === undefined ? defaultChannel() : cfg.channel
    this.flags = cfg.flags ?? browserFlags()
    this.leewayMs = (cfg.refreshLeewaySec ?? 60) * 1000
    this.lockName = `gz.auth.refresh.${cfg.clientId}`

    if (this.channel) {
      const onMessage = (event: MessageEvent) => {
        if (isCrossTabMessage(event.data)) this.onCrossTab(event.data)
      }
      this.channel.addEventListener("message", onMessage)
      this.cleanups.push(() => this.channel?.removeEventListener("message", onMessage))
    }
    if (this.env.onVisible) this.cleanups.push(this.env.onVisible(() => this.onVisible()))
  }

  // ---- status and events -------------------------------------------------------------------

  status(): AuthStatus {
    return this.state
  }

  subscribe(listener: (status: AuthStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  onEvent(listener: (event: AuthEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  onLogout(hook: () => void): () => void {
    this.logoutHooks.add(hook)
    return () => this.logoutHooks.delete(hook)
  }

  claims(): AccessClaims | null {
    return this.access?.claims ?? null
  }

  private setStatus(next: AuthStatus): void {
    if (this.state === next) return
    this.state = next
    for (const l of this.statusListeners) l(next)
  }

  private emit(event: AuthEvent): void {
    this.cfg.onEvent?.(event)
    for (const l of this.eventListeners) l(event)
  }

  private broadcast(message: CrossTabMessage): void {
    try {
      this.channel?.postMessage(message)
    } catch {
      // closed channel
    }
  }

  // ---- login and callback -------------------------------------------------------------------

  private async buildAuthorizeUrl(params: {
    kind: TransactionKind
    redirectUri: string
    returnTo?: string
    prompt?: string
    maxAge?: number
    loginHint?: string
    popup?: boolean
  }): Promise<string> {
    const state = createState()
    const verifier = createVerifier()
    const challenge = await challengeS256(verifier)
    await saveTransaction(this.cfg.storage, {
      state,
      verifier,
      redirectUri: params.redirectUri,
      returnTo: toInternalPath(params.returnTo, this.env.origin),
      kind: params.kind,
      ...(params.popup ? { popup: true } : {}),
      createdAt: this.now(),
    })
    const query = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: params.redirectUri,
      response_type: "code",
      scope: this.cfg.scopes.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    })
    const locale = this.cfg.locale?.()
    if (locale) query.set("ui_locales", locale)
    if (params.prompt) query.set("prompt", params.prompt)
    if (params.maxAge !== undefined) query.set("max_age", String(params.maxAge))
    if (params.loginHint) query.set("login_hint", params.loginHint)
    return `${this.cfg.authorizeUrl}?${query.toString()}`
  }

  async login(opts: LoginOptions = {}): Promise<void> {
    // After an explicit sign-out the next login lets the person pick the account consciously.
    const selectAccount = this.flags.get(SELECT_ACCOUNT_FLAG) === "1"
    const url = await this.buildAuthorizeUrl({
      kind: "login",
      redirectUri: this.cfg.redirectUri,
      returnTo: opts.returnTo,
      prompt: opts.prompt ?? (selectAccount ? "select_account" : undefined),
      maxAge: opts.maxAge,
      loginHint: opts.loginHint,
    })
    this.flags.set(SELECT_ACCOUNT_FLAG, null)
    this.env.navigate(url)
  }

  async handleCallback(url: string = this.env.currentHref()): Promise<CallbackResult> {
    const parsed = new URL(url)
    const code = parsed.searchParams.get("code")
    const state = parsed.searchParams.get("state")
    const error = parsed.searchParams.get("error")

    // Strip the one-time values from the address bar before anything slow happens.
    for (const p of ["code", "state", "error", "error_description", "iss"])
      parsed.searchParams.delete(p)
    this.env.replaceUrl(parsed.pathname + parsed.search + parsed.hash)

    if (!state) throw new AuthError("state_mismatch")
    const txn = await takeTransaction(this.cfg.storage, state, this.now())
    if (!txn) throw new AuthError("state_mismatch")
    if (error) {
      if (error === "access_denied") throw new AuthError("access_denied")
      throw new AuthError("server", error)
    }
    if (!code) throw new AuthError("server", "callback without code")

    const tokens = await exchangeCode(this.tokenOpts(), {
      code,
      verifier: txn.verifier,
      redirectUri: txn.redirectUri,
    })
    this.setAccess(tokens)
    this.setStatus("signed_in")
    this.emit({ type: "signed_in" })
    return { returnTo: txn.returnTo, kind: txn.kind, popup: txn.popup === true }
  }

  // ---- tokens -------------------------------------------------------------------------------

  private tokenOpts() {
    return { apiBaseUrl: this.cfg.apiBaseUrl, clientId: this.cfg.clientId, fetch: this.fetchImpl }
  }

  private setAccess(tokens: TokenResponse): AccessState {
    const claims = decodeAccessToken(tokens.access_token)
    if (!claims) throw new AuthError("server", "access token is not a JWT")
    const fromExpiresIn = this.now() + tokens.expires_in * 1000
    const access: AccessState = {
      token: tokens.access_token,
      claims,
      expiresAt: Math.min(fromExpiresIn, claims.exp * 1000),
    }
    this.access = access
    this.scheduleRefresh()
    return access
  }

  private clearAccess(): void {
    this.access = null
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    this.refreshTimer = null
    this.refreshDueWhileHidden = false
  }

  private isFresh(access: AccessState | null): access is AccessState {
    return access !== null && access.expiresAt - this.now() > this.leewayMs
  }

  async getAccessToken(): Promise<string> {
    if (this.isFresh(this.access)) return this.access.token
    return (await this.refresh()).token
  }

  async tryRestore(): Promise<boolean> {
    try {
      await this.getAccessToken()
      return true
    } catch (error) {
      if (isAuthError(error, "signed_out")) return false
      throw error
    }
  }

  /** Single-flight in this tab, serialised across tabs by the Web Lock. */
  private refresh(): Promise<AccessState> {
    this.inflight ??= this.locks
      .request(this.lockName, () => this.doRefresh())
      .finally(() => {
        this.inflight = null
      })
    return this.inflight
  }

  private async doRefresh(): Promise<AccessState> {
    try {
      const tokens = await refreshWithCookie(this.tokenOpts())
      const wasSignedIn = this.state === "signed_in"
      const access = this.setAccess(tokens)
      this.setStatus("signed_in")
      this.emit(wasSignedIn ? { type: "refreshed" } : { type: "signed_in" })
      this.broadcast({ type: "refreshed" })
      return access
    } catch (error) {
      if (isAuthError(error, "invalid_grant")) {
        const wasSignedIn = this.state === "signed_in"
        this.clearAccess()
        this.setStatus("signed_out")
        if (wasSignedIn) this.emit({ type: "signed_out", reason: "expired" })
        throw new AuthError("signed_out", "refresh rejected", error)
      }
      // Network and server errors never sign out; callers can retry.
      throw error
    }
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    if (!this.access) return
    const delay = Math.max(0, this.access.expiresAt - this.leewayMs - this.now())
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null
      if (this.env.isHidden?.()) {
        // Paused while hidden; runs once on the next visibilitychange.
        this.refreshDueWhileHidden = true
        return
      }
      void this.refresh().catch(() => undefined)
    }, delay)
  }

  private onVisible(): void {
    if (this.state !== "signed_in") return
    if (this.refreshDueWhileHidden || !this.isFresh(this.access)) {
      this.refreshDueWhileHidden = false
      void this.refresh().catch(() => undefined)
    }
  }

  // ---- fetch --------------------------------------------------------------------------------

  /**
   * Adds the bearer token. A 401 AUTH_TOKEN_EXPIRED is retried exactly once after a refresh. A
   * 403 AUTH_STEP_UP_REQUIRED is never retried; it emits `step_up_required`.
   */
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const original = new Request(input, init)
    const spare = original.clone()
    const token = await this.getAccessToken()
    const first = await this.send(original, token)

    if (first.status === 401) {
      const { code } = await readErrorCode(first)
      if (code === "AUTH_TOKEN_EXPIRED") {
        if (this.access?.token === token) this.access = null
        const fresh = await this.getAccessToken()
        return this.send(spare, fresh)
      }
    }
    if (first.status === 403) {
      const { code, maxAge } = await readErrorCode(first)
      if (code === "AUTH_STEP_UP_REQUIRED")
        this.emit({ type: "step_up_required", maxAge: maxAge ?? 600 })
    }
    return first
  }

  private send(request: Request, token: string): Promise<Response> {
    const headers = new Headers(request.headers)
    headers.set("Authorization", `Bearer ${token}`)
    return this.fetchImpl(new Request(request, { headers }))
  }

  // ---- step-up ------------------------------------------------------------------------------

  /**
   * Re-authenticates with `max_age` (default 600 s). Popup mode waits for the /auth/step-up page
   * to exchange the code (which rotates gz_rt to the fresh session), then refreshes here so the
   * new access token carries the new `auth_time`. If the popup is blocked it falls back to a full
   * redirect; the caller must not replay the pending action after a redirect.
   */
  async stepUp(opts: StepUpOptions = {}): Promise<StepUpResult> {
    const maxAge = opts.maxAge ?? 600
    const authorize = (popup: boolean) =>
      this.buildAuthorizeUrl({
        kind: "step_up",
        redirectUri: this.cfg.stepUpRedirectUri,
        returnTo: opts.returnTo ?? this.env.currentHref(),
        maxAge,
        popup,
      })
    if (opts.mode === "redirect") {
      this.env.navigate(await authorize(false))
      return { type: "redirected" }
    }
    // The popup must open in the click's task, so build its URL first. A blocked popup falls back
    // to a redirect with its own transaction (one not flagged as a popup).
    const url = await authorize(true)
    const popup = this.env.openPopup(url)
    if (!popup) {
      this.env.navigate(await authorize(false))
      return { type: "redirected" }
    }
    const state = new URL(url).searchParams.get("state") ?? ""
    await this.waitForStepUp(popup, state, opts.signal)
    this.access = null
    await this.refresh()
    return { type: "elevated" }
  }

  /**
   * Waits for the popup's result. The identity pages send Cross-Origin-Opener-Policy: same-origin,
   * which severs the popup from this window: the popup's `window.opener` is null and, here,
   * `popup.closed` turns true as soon as it reaches the identity origin. So the primary signal is
   * the BroadcastChannel (same origin, unaffected by COOP); postMessage stays as a fallback for an
   * opener link that survives. `closed` cannot tell "user closed it" from "severed", so it is not
   * a cancel: the caller cancels through `signal`, and a stale wait ends after 10 minutes.
   */
  private waitForStepUp(popup: Window, state: string, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const started = this.now()
      let done = false
      const finish = (ok: boolean, error?: AuthError) => {
        if (done) return
        done = true
        clearInterval(poll)
        offMessage()
        this.channel?.removeEventListener("message", onChannel)
        signal?.removeEventListener("abort", onAbort)
        if (ok) resolve()
        else reject(error ?? new AuthError("server", "step-up failed"))
      }
      const onChannel = (event: MessageEvent) => {
        const data: unknown = event.data
        if (isCrossTabMessage(data) && data.type === "step_up" && data.state === state)
          finish(data.ok)
      }
      this.channel?.addEventListener("message", onChannel)
      // Fallback: postMessage from the popup, strict origin and source checks.
      const offMessage = this.env.onMessage((event) => {
        if (event.origin !== this.env.origin || event.source !== popup) return
        const data = event.data as { type?: unknown; ok?: unknown; state?: unknown } | null
        if (data?.type !== STEP_UP_MESSAGE || data.state !== state) return
        finish(data.ok === true)
      })
      const onAbort = () => {
        closeQuietly(popup)
        finish(false, new AuthError("cancelled"))
      }
      if (signal?.aborted) {
        onAbort()
        return
      }
      signal?.addEventListener("abort", onAbort)
      const poll = setInterval(() => {
        if (this.now() - started > STEP_UP_MAX_WAIT_MS) {
          closeQuietly(popup)
          finish(false, new AuthError("cancelled", "step-up timed out"))
        }
      }, 1000)
    })
  }

  /**
   * Called by the /auth/step-up page in a popup. `state` is the callback's `state` parameter, so
   * only the window that started this step-up acts on it. BroadcastChannel first; postMessage to
   * a surviving opener as the fallback.
   */
  reportStepUp(ok: boolean, state: string, opener: Window | null): void {
    this.broadcast({ type: "step_up", ok, state })
    try {
      opener?.postMessage({ type: STEP_UP_MESSAGE, ok, state }, this.env.origin)
    } catch {
      // opener gone
    }
  }

  // ---- logout -------------------------------------------------------------------------------

  async logout(opts: { endIdentitySession?: boolean } = {}): Promise<void> {
    // Revoke first; clear locally even when revoke fails, and never retry forever.
    try {
      await revokeWithCookie(this.tokenOpts())
    } catch {
      // network or server error: local state is wiped anyway
    }
    this.signOutLocally("user")
    this.broadcast({ type: "logout" })
    this.flags.set(SELECT_ACCOUNT_FLAG, "1")
    if (opts.endIdentitySession ?? true) {
      const query = new URLSearchParams({
        client_id: this.cfg.clientId,
        post_logout_redirect_uri: this.cfg.postLogoutRedirectUri,
        state: createState(),
      })
      this.env.navigate(`${this.cfg.endSessionUrl}?${query.toString()}`)
    }
  }

  private signOutLocally(reason: "user" | "revoked"): void {
    const wasSignedIn = this.state !== "signed_out"
    this.clearAccess()
    this.setStatus("signed_out")
    for (const hook of this.logoutHooks) {
      try {
        hook()
      } catch {
        // a broken hook must not block sign-out
      }
    }
    if (wasSignedIn) this.emit({ type: "signed_out", reason })
  }

  private onCrossTab(message: CrossTabMessage): void {
    // Signed out in another tab: drop the in-memory token here too.
    if (message.type === "logout") this.signOutLocally("user")
    // "refreshed": the cookie rotated in another tab. Our access token is still valid until its
    // own exp; the next refresh here (behind the lock) sends the rotated cookie automatically.
  }

  dispose(): void {
    this.clearAccess()
    for (const c of this.cleanups) c()
    this.channel?.close()
  }
}

export function createWebAuth(config: AuthConfig): WebAuthClient {
  return new WebAuthClient(config)
}
