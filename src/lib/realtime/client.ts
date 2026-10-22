import {
  WS_CLOSE,
  WsServerMessageSchema,
  type Channel,
  type SubscriptionMessage,
  type WsClientMessage,
  type WsServerMessage,
} from "@/api/realtime-types"

/**
 * The dashboard's client for the realtime protocol v1 (backend plan 6.10, dashboard plan 8.6):
 * one socket per tab, auth by first message, ref-counted subscriptions, `seq` gap recovery,
 * full-jitter backoff, a 45 s silence watchdog, vehicle channels paused after 5 min hidden and a
 * REST fallback signal after 3 failed connects.
 */

export type ConnectionState = "idle" | "connecting" | "open" | "reconnecting" | "fallback"

export interface SubscriptionHandlers {
  onMessage: (message: SubscriptionMessage) => void
  /** A server error for this subscription. PERMISSION_MISSING and friends stop it. */
  onError?: (error: { code: string; message: string }) => void
}

export interface RealtimeOptions {
  url: string
  /** Access token for the `auth` message, or null when signed out (public channels only). */
  getToken: () => Promise<string | null>
  WebSocketImpl?: typeof WebSocket
  random?: () => number
  now?: () => number
  /** Validate every server message with zod (dev and tests); production trusts the shape. */
  validate?: boolean
  visibility?: VisibilitySource
  online?: { subscribe: (onOnline: () => void) => () => void }
}

export interface VisibilitySource {
  isHidden: () => boolean
  subscribe: (onChange: () => void) => () => void
}

export const BACKOFF = { baseMs: 1000, factor: 2, capMs: 30_000, healthyMs: 60_000 } as const
export const SILENCE_MS = 45_000
export const HIDDEN_PAUSE_MS = 5 * 60_000
export const FALLBACK_AFTER_FAILURES = 3
const AUTH_TIMEOUT_MS = 10_000

/** Full jitter: uniform in [0, min(cap, base * factor^attempt)]. */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const ceiling = Math.min(BACKOFF.capMs, BACKOFF.baseMs * BACKOFF.factor ** attempt)
  return Math.round(random() * ceiling)
}

/** Fatal subscription errors: retrying the same params can not succeed. */
const FATAL_SUB_ERRORS = new Set([
  "PERMISSION_MISSING",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "PROVIDER_DISABLED",
  "AUTH_REQUIRED",
])

interface Sub {
  id: string
  key: string
  channel: Channel
  params: Record<string, unknown>
  handlers: Set<SubscriptionHandlers>
  lastSeq: number | null
  /** Sent to the server and not unsubscribed. */
  active: boolean
  failed: boolean
  pausedWhileHidden: boolean
}

export function subscriptionKey(channel: Channel, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      if (params[k] !== undefined) acc[k] = params[k]
      return acc
    }, {})
  return `${channel}:${JSON.stringify(sorted)}`
}

export class RealtimeClient {
  private socket: WebSocket | null = null
  private readonly subs = new Map<string, Sub>()
  private readonly byId = new Map<string, Sub>()
  private nextId = 1
  private stateValue: ConnectionState = "idle"
  private readonly stateListeners = new Set<(state: ConnectionState) => void>()
  private attempt = 0
  private failures = 0
  private openedAt = 0
  private authed = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private hiddenTimer: ReturnType<typeof setTimeout> | null = null
  private authTimer: ReturnType<typeof setTimeout> | null = null
  private retriedAuth = false
  private disposed = false
  private readonly cleanups: (() => void)[] = []
  private readonly WS: typeof WebSocket
  private readonly random: () => number
  private readonly now: () => number

  constructor(private readonly options: RealtimeOptions) {
    this.WS = options.WebSocketImpl ?? WebSocket
    this.random = options.random ?? Math.random
    this.now = options.now ?? Date.now
    if (options.visibility) {
      const vis = options.visibility
      this.cleanups.push(vis.subscribe(() => this.onVisibility(vis.isHidden())))
    }
    if (options.online) this.cleanups.push(options.online.subscribe(() => this.retryNow()))
  }

  // ---- public API ---------------------------------------------------------------------------

  state(): ConnectionState {
    return this.stateValue
  }

  onState(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  /**
   * Subscribes (ref-counted: equal channel and params share one server subscription). Returns
   * the unsubscribe function; the server subscription ends when its last user leaves.
   */
  subscribe(
    channel: Channel,
    params: Record<string, unknown>,
    handlers: SubscriptionHandlers,
  ): () => void {
    const key = subscriptionKey(channel, params)
    let sub = this.subs.get(key)
    if (!sub) {
      sub = {
        id: `s${String(this.nextId++)}`,
        key,
        channel,
        params,
        handlers: new Set(),
        lastSeq: null,
        active: false,
        failed: false,
        pausedWhileHidden: false,
      }
      this.subs.set(key, sub)
      this.byId.set(sub.id, sub)
      if (this.ready()) this.sendSubscribe(sub)
    }
    sub.handlers.add(handlers)
    this.ensureSocket()
    const current = sub
    return () => {
      current.handlers.delete(handlers)
      if (current.handlers.size > 0) return
      this.subs.delete(current.key)
      this.byId.delete(current.id)
      if (current.active && this.ready()) this.send({ type: "unsubscribe", id: current.id })
      if (this.subs.size === 0) this.closeSocket()
    }
  }

  /** Call after every token refresh so staff subscriptions keep running. */
  async reauth(): Promise<void> {
    if (!this.socket || this.socket.readyState !== this.WS.OPEN) return
    const token = await this.options.getToken()
    if (token) this.send({ type: "auth", token })
  }

  /** Retry immediately (network regained, tab visible, user pressed "retry"). */
  retryNow(): void {
    if (this.disposed || this.subs.size === 0) return
    if (this.socket) return
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.connect()
  }

  dispose(): void {
    this.disposed = true
    for (const c of this.cleanups) c()
    this.closeSocket()
    this.subs.clear()
    this.byId.clear()
  }

  // ---- socket lifecycle ---------------------------------------------------------------------

  private ready(): boolean {
    return this.socket?.readyState === this.WS.OPEN && this.authed
  }

  private setState(state: ConnectionState): void {
    if (this.stateValue === state) return
    this.stateValue = state
    for (const l of this.stateListeners) l(state)
  }

  private ensureSocket(): void {
    if (this.disposed || this.socket || this.retryTimer) return
    this.connect()
  }

  private connect(): void {
    this.setState(
      this.failures >= FALLBACK_AFTER_FAILURES
        ? "fallback"
        : this.failures > 0
          ? "reconnecting"
          : "connecting",
    )
    let socket: WebSocket
    try {
      socket = new this.WS(this.options.url)
    } catch {
      this.scheduleReconnect()
      return
    }
    this.socket = socket
    this.authed = false
    socket.onopen = () => {
      if (this.socket !== socket) return
      this.openedAt = this.now()
      this.armSilence()
      void this.authenticate(socket)
    }
    socket.onmessage = (event: MessageEvent) => {
      if (this.socket !== socket) return
      this.armSilence()
      this.onRaw(event.data)
    }
    socket.onclose = (event: CloseEvent) => {
      if (this.socket !== socket) return
      this.onClosed(event.code)
    }
    socket.onerror = () => {
      // onclose follows; nothing to do here.
    }
  }

  private async authenticate(socket: WebSocket): Promise<void> {
    let token: string | null = null
    try {
      token = await this.options.getToken()
    } catch {
      token = null
    }
    if (this.socket !== socket) return
    if (!token) {
      this.onAuthed()
      return
    }
    this.send({ type: "auth", token })
    this.authTimer = setTimeout(() => {
      // No auth_ok: treat as a dead connection.
      if (this.socket === socket && !this.authed) socket.close()
    }, AUTH_TIMEOUT_MS)
  }

  private onAuthed(): void {
    if (this.authTimer) clearTimeout(this.authTimer)
    this.authTimer = null
    this.authed = true
    this.failures = 0
    this.retriedAuth = false
    this.setState("open")
    for (const sub of this.subs.values()) {
      sub.active = false
      sub.lastSeq = null
      if (!sub.failed && !sub.pausedWhileHidden) this.sendSubscribe(sub)
    }
  }

  private onClosed(code: number): void {
    const healthy = this.openedAt > 0 && this.now() - this.openedAt >= BACKOFF.healthyMs
    this.teardownSocket()
    for (const sub of this.subs.values()) sub.active = false
    if (this.disposed || this.subs.size === 0) {
      this.setState("idle")
      return
    }
    if (healthy) {
      this.attempt = 0
      this.failures = 0
    }
    if (code === WS_CLOSE.authInvalid && !this.retriedAuth) {
      // The token was rejected: fetch a fresh one and reconnect right away, once.
      this.retriedAuth = true
      this.connect()
      return
    }
    this.failures++
    if (code === WS_CLOSE.rateLimited) this.attempt = 30
    this.scheduleReconnect()
  }

  private scheduleReconnect(): void {
    this.socket = null
    this.setState(this.failures >= FALLBACK_AFTER_FAILURES ? "fallback" : "reconnecting")
    const delay = backoffDelay(this.attempt, this.random)
    this.attempt = Math.min(this.attempt + 1, 30)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      if (this.subs.size > 0) this.connect()
    }, delay)
  }

  private teardownSocket(): void {
    const socket = this.socket
    this.socket = null
    this.authed = false
    this.openedAt = 0
    if (this.silenceTimer) clearTimeout(this.silenceTimer)
    if (this.authTimer) clearTimeout(this.authTimer)
    this.silenceTimer = null
    this.authTimer = null
    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onclose = null
      socket.onerror = null
      if (socket.readyState === this.WS.OPEN || socket.readyState === this.WS.CONNECTING)
        socket.close(1000)
    }
  }

  private closeSocket(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    if (this.hiddenTimer) clearTimeout(this.hiddenTimer)
    this.retryTimer = null
    this.hiddenTimer = null
    this.teardownSocket()
    this.attempt = 0
    this.failures = 0
    this.setState("idle")
  }

  private armSilence(): void {
    if (this.silenceTimer) clearTimeout(this.silenceTimer)
    const socket = this.socket
    this.silenceTimer = setTimeout(() => {
      if (this.socket === socket && socket) {
        // 45 s without any message: dead connection.
        this.teardownSocket()
        this.failures++
        this.scheduleReconnect()
      }
    }, SILENCE_MS)
  }

  // ---- messages -----------------------------------------------------------------------------

  private send(message: WsClientMessage): void {
    if (this.socket?.readyState === this.WS.OPEN) this.socket.send(JSON.stringify(message))
  }

  private sendSubscribe(sub: Sub): void {
    sub.active = true
    sub.lastSeq = null
    this.send({ type: "subscribe", id: sub.id, channel: sub.channel, params: sub.params })
  }

  private onRaw(data: unknown): void {
    if (typeof data !== "string") return
    let parsed: unknown
    try {
      parsed = JSON.parse(data)
    } catch {
      return
    }
    let message: WsServerMessage
    if (this.options.validate) {
      const result = WsServerMessageSchema.safeParse(parsed)
      if (!result.success) {
        console.warn("realtime: invalid server message", result.error.issues)
        return
      }
      message = result.data
    } else {
      message = parsed as WsServerMessage
    }
    this.onMessage(message)
  }

  private onMessage(message: WsServerMessage): void {
    switch (message.type) {
      case "hello":
      case "pong":
        return
      case "ping":
        this.send({ type: "pong", t: message.t })
        return
      case "auth_ok":
        if (!this.authed) this.onAuthed()
        return
      case "error": {
        const sub = message.id ? this.byId.get(message.id) : undefined
        if (!sub) return
        if (FATAL_SUB_ERRORS.has(message.code)) {
          sub.failed = true
          sub.active = false
        }
        for (const h of sub.handlers) h.onError?.({ code: message.code, message: message.message })
        return
      }
      default: {
        const sub = this.byId.get(message.sub)
        if (!sub?.active) return
        if (sub.lastSeq !== null && message.seq !== sub.lastSeq + 1) {
          // Lost a message: start over with a fresh snapshot.
          this.send({ type: "unsubscribe", id: sub.id })
          this.sendSubscribe(sub)
          return
        }
        sub.lastSeq = message.seq
        for (const h of sub.handlers) h.onMessage(message)
      }
    }
  }

  // ---- visibility ---------------------------------------------------------------------------

  private onVisibility(hidden: boolean): void {
    if (hidden) {
      if (this.hiddenTimer) clearTimeout(this.hiddenTimer)
      this.hiddenTimer = setTimeout(() => {
        this.hiddenTimer = null
        for (const sub of this.subs.values()) {
          if (sub.channel !== "vehicles") continue
          sub.pausedWhileHidden = true
          if (sub.active && this.ready()) this.send({ type: "unsubscribe", id: sub.id })
          sub.active = false
        }
      }, HIDDEN_PAUSE_MS)
      return
    }
    if (this.hiddenTimer) clearTimeout(this.hiddenTimer)
    this.hiddenTimer = null
    for (const sub of this.subs.values()) {
      if (!sub.pausedWhileHidden) continue
      sub.pausedWhileHidden = false
      if (this.ready()) this.sendSubscribe(sub)
    }
    this.retryNow()
  }
}

export function documentVisibility(): VisibilitySource {
  return {
    isHidden: () => document.visibilityState === "hidden",
    subscribe: (onChange) => {
      document.addEventListener("visibilitychange", onChange)
      return () => document.removeEventListener("visibilitychange", onChange)
    },
  }
}

export function windowOnline(): { subscribe: (onOnline: () => void) => () => void } {
  return {
    subscribe: (onOnline) => {
      window.addEventListener("online", onOnline)
      return () => window.removeEventListener("online", onOnline)
    },
  }
}
