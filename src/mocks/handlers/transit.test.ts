import { beforeEach, describe, expect, it } from "vitest"
import { challengeS256, randomBase64Url } from "@/auth/pkce"
import { decodePolyline } from "@/lib/geo"
import { server } from "../../../tests/setup/msw"
import { mockSession } from "../session"
import { KOCAELI } from "../transit/networks"
import { networkSim, positionAt } from "../transit/sim"
import { createHandlers } from "."

const API = "https://api.test"
const REDIRECT = "http://localhost:3000/auth/callback"

async function signIn(persona: string) {
  const verifier = randomBase64Url(32)
  const code = randomBase64Url(16)
  mockSession.issueCode({
    code,
    persona,
    challenge: await challengeS256(verifier),
    redirectUri: REDIRECT,
    authTime: Math.floor(Date.now() / 1000),
    expiresAt: Date.now() + 60_000,
  })
  const res = await fetch(`${API}/v1/oauth/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
      client_id: "dashboard-test",
    }).toString(),
  })
  return ((await res.json()) as { access_token: string }).access_token
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- typed test helper
const call = async <T>(path: string, token?: string, init: RequestInit = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "content-type": "application/json",
    },
  })
  return {
    status: res.status,
    body: (await res.json()) as { ok: boolean; data: T; error?: { code: string } },
  }
}

beforeEach(() => {
  localStorage.clear()
  server.use(...createHandlers(API))
})

describe("vehicle simulator", () => {
  it("stops exactly at stops and moves between them", () => {
    const sim = networkSim(KOCAELI)
    const v = sim.vehicles[0]!
    const states = Array.from({ length: 200 }, (_, i) => positionAt(v, 1_760_000_000 + i * 15))
    expect(states.some((s) => s.status === 1 && s.speed < 0.5)).toBe(true)
    expect(states.some((s) => s.speed > 5)).toBe(true)
    for (const s of states) {
      expect(s.lat).toBeGreaterThan(40.6)
      expect(s.lat).toBeLessThan(41.2)
      expect(s.stop_seq).toBeGreaterThanOrEqual(1)
    }
  })

  it("is a pure function of time", () => {
    const v = networkSim(KOCAELI).vehicles[5]!
    expect(positionAt(v, 1_760_001_234)).toEqual(positionAt(v, 1_760_001_234))
  })
})

describe("transit mock API", () => {
  it("serves routes, shapes and stops of the synthetic network", async () => {
    const routes = await call<{ items: { id: string; short_name: string }[] }>(
      "/v1/networks/kocaeli/routes?limit=200",
    )
    expect(routes.body.data.items.map((r) => r.short_name)).toContain("41C")
    const id = routes.body.data.items.find((r) => r.short_name === "41C")!.id
    const shape = await call<{ shapes: { polyline: string }[] }>(`/v1/routes/${id}/shape`)
    const coords = decodePolyline(shape.body.data.shapes[0]!.polyline)
    expect(coords[0]![1]).toBeCloseTo(40.8239, 3)
    const detail = await call<{ directions: { patterns: { stops: unknown[] }[] }[] }>(
      `/v1/routes/${id}`,
    )
    expect(detail.body.data.directions[0]!.patterns[0]!.stops.length).toBeGreaterThan(5)
  })

  it("enforces tracker permissions and pauses a binding", async () => {
    const analyst = await signIn("analyst")
    const denied = await call("/v1/dash/networks/4/bindings/4/control", analyst, {
      method: "POST",
      body: JSON.stringify({ action: "pause", reason: "test" }),
    })
    expect(denied.status).toBe(403)

    const admin = await signIn("network-admin")
    const paused = await call<{ ok: boolean; status: { state: string } }>(
      "/v1/dash/networks/4/bindings/4/control",
      admin,
      { method: "POST", body: JSON.stringify({ action: "pause", reason: "upstream maintenance" }) },
    )
    expect(paused.body.data).toMatchObject({ ok: true, status: { state: "paused" } })
    const tracker = await call<{ bindings: { state: string; message: string }[] }>(
      "/v1/dash/networks/kocaeli/tracker",
      admin,
    )
    expect(tracker.body.data.bindings[0]).toMatchObject({ state: "paused" })
    expect(tracker.body.data.bindings[0]!.message).toContain("upstream maintenance")
  }, 15_000)

  it("pages the poll log newest first and filters errors", async () => {
    const token = await signIn("analyst")
    const page = await call<{
      items: { started_at: string; outcome: string }[]
      next_cursor: string
    }>("/v1/dash/networks/4/bindings/4/polls?limit=20", token)
    const times = page.body.data.items.map((p) => Date.parse(p.started_at))
    expect(times).toEqual([...times].sort((a, b) => b - a))
    expect(page.body.data.next_cursor).toBeTruthy()
    const errors = await call<{ items: { outcome: string }[] }>(
      "/v1/dash/networks/4/bindings/4/polls?errors_only=true",
      token,
    )
    expect(errors.body.data.items.length).toBeGreaterThan(0)
    for (const p of errors.body.data.items)
      expect(["ok", "empty", "duplicate_header"]).not.toContain(p.outcome)
  })

  it("answers analytics in columnar form and caps windows at 90 days", async () => {
    const token = await signIn("analyst")
    const ok = await call<{ columns: string[]; rows: unknown[][]; meta: { n: number } }>(
      "/v1/dash/networks/4/analytics/fleet.hourly?from=2026-10-01&to=2026-10-07&granularity=1h",
      token,
    )
    expect(ok.body.data.columns).toEqual(["bucket", "vehicles", "vehicle_hours", "peak_vehicles"])
    expect(ok.body.data.rows.length).toBeGreaterThan(80)
    const tooLong = await call(
      "/v1/dash/networks/4/analytics/fleet.hourly?from=2026-01-01&to=2026-10-07",
      token,
    )
    expect(tooLong.status).toBe(400)
    const sakarya = await call<{ rows: unknown[] }>(
      "/v1/dash/networks/54/analytics/adherence.departure?from=2026-10-01&to=2026-10-02",
      await signIn("founder"),
    )
    expect(sakarya.body.data.rows).toEqual([])
    const marey = await call("/v1/dash/networks/4/analytics/headways.marey?date=2026-10-01", token)
    expect(marey.status).toBe(400)
  })
})

describe("mock realtime gateway", () => {
  it("streams a vehicles snapshot to the real RealtimeClient after auth", async () => {
    const { RealtimeClient } = await import("@/lib/realtime/client")
    server.use(...createHandlers(API, { wsUrl: "wss://api.test/v1/ws" }))
    const token = await signIn("analyst")
    const client = new RealtimeClient({
      url: "wss://api.test/v1/ws",
      getToken: () => Promise.resolve(token),
      validate: true,
    })
    const snapshot = await new Promise<{ fields: string[]; vehicles: unknown[][] }>(
      (resolve, reject) => {
        const off = client.subscribe(
          "vehicles",
          { network: 4, detail: "full" },
          {
            onMessage: (m) => {
              if (m.type === "snapshot") {
                off()
                resolve(m)
              }
            },
            onError: (e) => reject(new Error(e.code)),
          },
        )
      },
    )
    expect(snapshot.fields).toContain("plate")
    expect(snapshot.vehicles.length).toBeGreaterThan(0)
    client.dispose()
  })

  it("refuses full detail without vehicles.live.read", async () => {
    const { RealtimeClient } = await import("@/lib/realtime/client")
    server.use(...createHandlers(API, { wsUrl: "wss://api.test/v1/ws" }))
    const client = new RealtimeClient({
      url: "wss://api.test/v1/ws",
      getToken: () => Promise.resolve(null),
    })
    const code = await new Promise<string>((resolve) => {
      client.subscribe(
        "vehicles",
        { network: 4, detail: "full" },
        { onMessage: () => undefined, onError: (e) => resolve(e.code) },
      )
    })
    expect(code).toBe("PERMISSION_MISSING")
    client.dispose()
  })
})
