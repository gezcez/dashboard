import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { WsClientMessage, WsServerMessage } from "@/api/realtime-types"
import {
  backoffDelay,
  BACKOFF,
  FALLBACK_AFTER_FAILURES,
  HIDDEN_PAUSE_MS,
  RealtimeClient,
  SILENCE_MS,
  subscriptionKey,
  type VisibilitySource,
} from "./client"

class FakeSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: FakeSocket[] = []
  readyState = FakeSocket.CONNECTING
  sent: WsClientMessage[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onclose: ((e: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  constructor(public url: string) {
    FakeSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(JSON.parse(data) as WsClientMessage)
  }
  close() {
    if (this.readyState === FakeSocket.CLOSED) return
    this.readyState = FakeSocket.CLOSED
    this.onclose?.({ code: 1000 })
  }
  // test helpers
  open() {
    this.readyState = FakeSocket.OPEN
    this.onopen?.()
  }
  receive(message: WsServerMessage) {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
  drop(code = 1006) {
    this.readyState = FakeSocket.CLOSED
    this.onclose?.({ code })
  }
  types() {
    return this.sent.map((m) => m.type)
  }
}

const last = () => FakeSocket.instances[FakeSocket.instances.length - 1]!

function makeClient(
  options: { token?: string | null; visibility?: VisibilitySource; validate?: boolean } = {},
) {
  return new RealtimeClient({
    url: "wss://api.test/v1/ws",
    getToken: () => Promise.resolve(options.token === undefined ? "tok" : options.token),
    WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
    random: () => 1,
    validate: options.validate ?? true,
    visibility: options.visibility,
  })
}

/** Opens the newest socket and completes auth. */
async function openAndAuth(withToken = true) {
  last().open()
  await vi.advanceTimersByTimeAsync(0)
  if (withToken) last().receive({ type: "auth_ok", exp: 9_999_999_999 })
}

const snapshot = (sub: string, seq: number): WsServerMessage => ({
  type: "snapshot",
  sub,
  seq,
  feed_ts: 100,
  fields: ["id", "lat", "lon"],
  vehicles: [["1.a", 40.7, 29.9]],
})

describe("RealtimeClient", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeSocket.instances = []
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("full-jitter backoff: 1 s base, factor 2, 30 s cap", () => {
    expect(backoffDelay(0, () => 1)).toBe(1000)
    expect(backoffDelay(3, () => 1)).toBe(8000)
    expect(backoffDelay(10, () => 1)).toBe(BACKOFF.capMs)
    expect(backoffDelay(4, () => 0.5)).toBe(8000)
    expect(backoffDelay(4, () => 0)).toBe(0)
  })

  it("keys subscriptions by channel and sorted params, ignoring undefined", () => {
    expect(subscriptionKey("vehicles", { b: 1, a: 2, c: undefined })).toBe(
      subscriptionKey("vehicles", { a: 2, b: 1 }),
    )
  })

  it("authenticates by first message, then subscribes (no token in the URL)", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    expect(last().url).toBe("wss://api.test/v1/ws")
    await openAndAuth()
    expect(last().sent[0]).toEqual({ type: "auth", token: "tok" })
    expect(last().sent[1]).toMatchObject({ type: "subscribe", channel: "vehicles" })
    expect(client.state()).toBe("open")
  })

  it("subscribes anonymously when signed out", async () => {
    const client = makeClient({ token: null })
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth(false)
    expect(last().types()).toEqual(["subscribe"])
  })

  it("ref-counts equal subscriptions and unsubscribes after the last user", async () => {
    const client = makeClient()
    const a = vi.fn()
    const b = vi.fn()
    const offA = client.subscribe("vehicles", { network: 4 }, { onMessage: a })
    const offB = client.subscribe("vehicles", { network: 4 }, { onMessage: b })
    client.subscribe("tracker.status", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth()
    expect(last().types()).toEqual(["auth", "subscribe", "subscribe"])
    last().receive(snapshot("s1", 1))
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
    offA()
    expect(last().types()).not.toContain("unsubscribe")
    offB()
    expect(last().sent.at(-1)).toEqual({ type: "unsubscribe", id: "s1" })
  })

  it("closes the socket when nothing is subscribed", async () => {
    const client = makeClient()
    const off = client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth()
    off()
    expect(last().readyState).toBe(FakeSocket.CLOSED)
    expect(client.state()).toBe("idle")
  })

  it("answers pings with pongs", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth()
    last().receive({ type: "ping", t: 42 })
    expect(last().sent.at(-1)).toEqual({ type: "pong", t: 42 })
  })

  it("resubscribes for a fresh snapshot on a seq gap", async () => {
    const client = makeClient()
    const onMessage = vi.fn()
    client.subscribe("vehicles", { network: 4 }, { onMessage })
    await openAndAuth()
    last().receive(snapshot("s1", 1))
    last().receive({ type: "delta", sub: "s1", seq: 2, feed_ts: 101, upsert: [], remove: [] })
    last().receive({ type: "delta", sub: "s1", seq: 4, feed_ts: 103, upsert: [], remove: [] })
    expect(onMessage).toHaveBeenCalledTimes(2)
    expect(last().sent.slice(-2)).toEqual([
      { type: "unsubscribe", id: "s1" },
      { type: "subscribe", id: "s1", channel: "vehicles", params: { network: 4 } },
    ])
    // The fresh subscription starts its own sequence.
    last().receive(snapshot("s1", 1))
    expect(onMessage).toHaveBeenCalledTimes(3)
  })

  it("reconnects with backoff, re-auths and resubscribes every active channel", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    client.subscribe("tracker.logs", { binding: 1 }, { onMessage: () => undefined })
    await openAndAuth()
    last().drop()
    expect(client.state()).toBe("reconnecting")
    expect(FakeSocket.instances).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(BACKOFF.baseMs)
    expect(FakeSocket.instances).toHaveLength(2)
    await openAndAuth()
    expect(last().types()).toEqual(["auth", "subscribe", "subscribe"])
    expect(client.state()).toBe("open")
  })

  it("treats 45 s of silence as a dead connection", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth()
    await vi.advanceTimersByTimeAsync(SILENCE_MS - 1000)
    last().receive({ type: "ping", t: 1 })
    await vi.advanceTimersByTimeAsync(SILENCE_MS - 1000)
    expect(FakeSocket.instances).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(client.state()).toBe("reconnecting")
  })

  it("signals the REST fallback after 3 failed connects and keeps retrying", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    for (let i = 0; i < FALLBACK_AFTER_FAILURES; i++) {
      last().drop()
      await vi.advanceTimersByTimeAsync(BACKOFF.capMs)
    }
    expect(client.state()).toBe("fallback")
    await openAndAuth()
    expect(client.state()).toBe("open")
  })

  it("on 4401 reconnects once immediately with a fresh token", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    last().open()
    await vi.advanceTimersByTimeAsync(0)
    last().drop(4401)
    expect(FakeSocket.instances).toHaveLength(2)
    last().drop(4401)
    expect(FakeSocket.instances).toHaveLength(2)
    expect(client.state()).toBe("reconnecting")
  })

  it("stops a forbidden subscription without closing the socket", async () => {
    const client = makeClient()
    const onError = vi.fn()
    client.subscribe("tracker.logs", { binding: 1 }, { onMessage: () => undefined, onError })
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth()
    last().receive({ type: "error", id: "s1", code: "PERMISSION_MISSING", message: "no" })
    expect(onError).toHaveBeenCalledWith({ code: "PERMISSION_MISSING", message: "no" })
    expect(last().readyState).toBe(FakeSocket.OPEN)
    // Not resubscribed after a reconnect either.
    last().drop()
    await vi.advanceTimersByTimeAsync(BACKOFF.baseMs)
    await openAndAuth()
    expect(last().sent.filter((m) => m.type === "subscribe")).toHaveLength(1)
  })

  it("pauses vehicle channels after 5 min hidden and resumes on visible", async () => {
    let hidden = false
    let notify: () => void = () => undefined
    const visibility: VisibilitySource = {
      isHidden: () => hidden,
      subscribe: (cb) => {
        notify = cb
        return () => undefined
      },
    }
    const client = makeClient({ visibility })
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    client.subscribe("tracker.status", {}, { onMessage: () => undefined })
    await openAndAuth()
    hidden = true
    notify()
    // The server keeps pinging while the tab is hidden.
    for (let t = 0; t < HIDDEN_PAUSE_MS; t += 20_000) {
      await vi.advanceTimersByTimeAsync(20_000)
      last().receive({ type: "ping", t })
    }
    expect(last().sent).toContainEqual({ type: "unsubscribe", id: "s1" })
    expect(last().sent).not.toContainEqual({ type: "unsubscribe", id: "s2" })
    hidden = false
    notify()
    expect(last().sent.at(-1)).toMatchObject({ type: "subscribe", id: "s1" })
  })

  it("re-sends auth after a token refresh", async () => {
    const client = makeClient()
    client.subscribe("vehicles", { network: 4 }, { onMessage: () => undefined })
    await openAndAuth()
    await client.reauth()
    expect(last().sent.at(-1)).toEqual({ type: "auth", token: "tok" })
  })

  it("drops malformed messages when validating", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const client = makeClient()
    const onMessage = vi.fn()
    client.subscribe("vehicles", { network: 4 }, { onMessage })
    await openAndAuth()
    last().onmessage?.({ data: JSON.stringify({ type: "snapshot", sub: "s1" }) })
    last().onmessage?.({ data: "not json" })
    expect(onMessage).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
