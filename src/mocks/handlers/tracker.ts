import { delay, type HttpHandler } from "msw"
import type { components } from "@/api/schema.gen"
import {
  inGap,
  KENTKART_CONFIG_SCHEMA,
  nowSec,
  pollAt,
  pollLine,
  pollsBefore,
  type TransitState,
} from "../transit/state"
import { apiError, type Ctx } from "./context"

type S = components["schemas"]

const WORKER_ACK_MS = 1200

/** Tracker ops: bindings, polls, stats and series, control, config, providers and kill switch. */
export function trackerHandlers(ctx: Ctx, transit: TransitState): HttpHandler[] {
  const { http, wait, authorize } = ctx
  const notFound = (what: string): Response => apiError(404, "NOT_FOUND", `${what} not found`)
  const bindingIn = (networkId: string, bindingId: string) => {
    const n = ctx.network(networkId)
    const b = transit.binding(bindingId)
    return n && b && b.network.networkId === n.id ? b : undefined
  }

  const providerRow = (p: TransitState["providers"][number]): S["DashProviderDto"] => ({
    key: p.key,
    name: p.name,
    url: p.key === "kentkart" ? "https://www.kentkart.com" : null,
    image_url: null,
    enabled: p.enabled,
    env_enabled: true,
    disabled_reason: p.killedReason,
    adapter: true,
    replayed: p.key === "fake",
    capabilities: null,
    pulled_data: [
      {
        key: "vehicle_position",
        is_collected: true,
        can_optout: false,
        details: "Vehicle GPS positions, route, trip and plate. No rider data.",
      },
    ],
    legal_note: null,
    binding_count: transit.bindings.filter((b) => b.providerKey === p.key).length,
  })

  return [
    http.get("/v1/dash/networks/{networkId}/bindings", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/bindings", params.networkId)
      if (c instanceof Response) return c
      const n = ctx.network(params.networkId)
      if (!n) return notFound("network")
      return response(200).json({
        ok: true,
        data: transit.bindingsOf(n.id).map((b) => transit.toBinding(b)),
      })
    }),
    http.get(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/bindings/{bindingId}",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        return response(200).json({ ok: true, data: transit.toBinding(b) })
      },
    ),
    http.get("/v1/dash/networks/{networkId}/tracker", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/tracker", params.networkId)
      if (c instanceof Response) return c
      const n = ctx.network(params.networkId)
      if (!n) return notFound("network")
      return response(200).json({
        ok: true,
        data: {
          runner: "worker",
          running: true,
          bindings: transit.bindingsOf(n.id).map((b) => transit.statusView(b)),
        },
      })
    }),
    http.get("/v1/dash/tracker/status", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/tracker/status")
      if (c instanceof Response) return c
      const network = new URL(request.url).searchParams.get("network")
      return response(200).json({
        ok: true,
        data: {
          bindings: transit.bindings
            .filter(
              (b) =>
                !network || b.network.slug === network || String(b.network.networkId) === network,
            )
            .map((b) => {
              const n = ctx.network(String(b.network.networkId))
              return {
                network_id: b.network.networkId,
                network_slug: b.network.slug,
                network_name: n?.name ?? b.network.slug,
                provider_key: b.providerKey,
                external_ref: b.externalRef,
                status: transit.statusView(b),
              }
            }),
        },
      })
    }),

    http.get(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}/polls",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/bindings/{bindingId}/polls",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        const url = new URL(request.url)
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 200)
        const offset = Number(atob(url.searchParams.get("cursor") ?? "") || 0) || 0
        const errorsOnly = url.searchParams.get("errors_only") === "true"
        const outcome = url.searchParams.get("outcome")
        const end = transit.frozenAt(b) ?? nowSec()
        let items
        if (errorsOnly || outcome) {
          // Scan back up to 24 h for matching polls.
          const all = pollsBefore(b, end, Math.ceil(86_400 / b.pollIntervalS), 0).filter((p) =>
            outcome
              ? p.outcome === outcome
              : !["ok", "empty", "duplicate_header"].includes(p.outcome),
          )
          items = all.slice(offset, offset + limit + 1)
        } else {
          items = pollsBefore(b, end, limit + 1, offset)
        }
        const more = items.length > limit
        return response(200).json({
          ok: true,
          data: {
            items: items.slice(0, limit),
            next_cursor: more ? btoa(String(offset + limit)) : null,
            prev_cursor: offset > 0 ? btoa(String(Math.max(0, offset - limit))) : null,
            total: null,
          },
        })
      },
    ),
    http.get(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}/stats",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/bindings/{bindingId}/stats",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        const polls = pollsBefore(b, nowSec(), Math.floor(86_400 / b.pollIntervalS), 0)
        const counts: Record<string, number> = {}
        for (const p of polls) counts[p.outcome] = (counts[p.outcome] ?? 0) + 1
        const ok = polls.filter((p) =>
          ["ok", "empty", "duplicate_header"].includes(p.outcome),
        ).length
        return response(200).json({
          ok: true,
          data: {
            binding_id: b.id,
            window_hours: 24,
            polls: counts,
            success_rate: polls.length ? Math.round((ok / polls.length) * 1000) / 1000 : null,
            positions_hot: 7 * 86_400 * 0.4 * transit.statusView(b).live_vehicles,
            open_runs: transit.statusView(b).live_vehicles,
            live_vehicles: transit.statusView(b).live_vehicles,
          },
        })
      },
    ),
    http.get(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}/series",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "GET /v1/dash/networks/{networkId}/bindings/{bindingId}/series",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        const url = new URL(request.url)
        const bucket =
          { "5m": 300, "15m": 900, "1h": 3600 }[url.searchParams.get("bucket") ?? "5m"] ?? 300
        const to = Math.floor(new Date(url.searchParams.get("to") ?? Date.now()).getTime() / 1000)
        const from = Math.floor(
          new Date(url.searchParams.get("from") ?? (to - 86_400) * 1000).getTime() / 1000,
        )
        const out: S["BindingSeriesDto"] = {
          bucket_s: bucket,
          t: [],
          polls: [],
          ok: [],
          failed: [],
          latency_p50_ms: [],
          latency_p95_ms: [],
          vehicles: [],
          lag_p50_s: [],
          lag_p95_s: [],
          dedup_ratio: [],
          errors: {},
          gaps: [],
        }
        const frozen = transit.frozenAt(b)
        let gapStart: number | null = null
        const start = from - (from % bucket)
        for (let t0 = start; t0 < to; t0 += bucket) {
          const index = out.t.length
          const ms: number[] = []
          const lags: number[] = []
          let okN = 0
          let failN = 0
          let veh = 0
          let ins = 0
          let acc = 0
          for (let t = t0; t < t0 + bucket; t += b.pollIntervalS) {
            const missing = inGap(t) || (frozen !== null && t > frozen) || t > to
            if (missing) {
              gapStart ??= t
              continue
            }
            if (gapStart !== null && t - gapStart > 3 * b.pollIntervalS)
              out.gaps.push([iso(gapStart), iso(t)])
            gapStart = null
            const p = pollAt(b, t)
            ms.push(p.duration_ms)
            if (["ok", "empty", "duplicate_header"].includes(p.outcome)) {
              okN++
              if (p.feed_at) lags.push(t - new Date(p.feed_at).getTime() / 1000)
              veh = Math.max(veh, p.entities)
              ins += p.inserted
              acc += p.accepted
            } else {
              failN++
              const series = (out.errors[p.outcome] ??= [])
              while (series.length <= index) series.push(0)
              series[index] = (series[index] ?? 0) + 1
            }
          }
          out.t.push(iso(t0))
          out.polls.push(okN + failN)
          out.ok.push(okN)
          out.failed.push(failN)
          out.latency_p50_ms.push(pct(ms, 0.5))
          out.latency_p95_ms.push(pct(ms, 0.95))
          out.vehicles.push(okN ? veh : null)
          out.lag_p50_s.push(pct(lags, 0.5))
          out.lag_p95_s.push(pct(lags, 0.95))
          out.dedup_ratio.push(acc ? Math.round((1 - ins / acc) * 1000) / 1000 : null)
        }
        if (gapStart !== null && to - gapStart > 3 * b.pollIntervalS)
          out.gaps.push([iso(gapStart), iso(to)])
        for (const series of Object.values(out.errors))
          while (series.length < out.t.length) series.push(0)
        return response(200).json({ ok: true, data: out })
      },
    ),

    http.post(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}/control",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "POST /v1/dash/networks/{networkId}/bindings/{bindingId}/control",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        const body = await request.json()
        // The backend answers after the worker acknowledges (plan 6.5).
        await delay(WORKER_ACK_MS)
        const t = nowSec()
        let error: string | null = null
        switch (body.action) {
          case "pause":
            if (!body.reason?.trim())
              return apiError(400, "VALIDATION_FAILED", "reason required") as Response
            b.status = "paused"
            b.pausedAt = t
            b.pausedBy = c.persona.name
            b.pauseReason = body.reason
            break
          case "resume":
            b.status = "active"
            b.pausedAt = null
            b.pausedBy = null
            b.pauseReason = null
            break
          case "reset-url":
            b.urlVariant = "primary"
            b.fallbackSince = null
            b.fallbackReason = null
            break
          case "refresh-token":
            b.tokenRefreshedAt = t
            b.tokenExpiresAt = t + 3600
            b.tokenFailures = 0
            break
          case "poll-now":
            if (b.status === "paused") error = "binding is paused"
            else b.extraPolls.push(t)
            break
        }
        b.updatedAt = new Date().toISOString()
        ctx.record(
          c,
          "tracker.control",
          { type: "binding", id: String(b.id), label: `${b.providerKey} ${b.externalRef}` },
          { after: { action: body.action, reason: body.reason ?? null } },
          { networkId: b.network.networkId, severity: body.action === "pause" ? "warn" : "info" },
        )
        transit.emitStatus(b)
        transit.emitLog({
          at: t,
          binding_id: b.id,
          level: "warn",
          message: `control ${body.action} by ${c.persona.name}${body.reason ? `: ${body.reason}` : ""}`,
        })
        if (body.action === "poll-now" && !error) transit.emitLog(pollLine(b, pollAt(b, t)))
        return response(200).json({
          ok: true,
          data: { ok: error === null, error, status: transit.statusView(b) },
        })
      },
    ),
    http.patch(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}/config",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "PATCH /v1/dash/networks/{networkId}/bindings/{bindingId}/config",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        const body = await request.json()
        const before = {
          poll_interval_s: b.pollIntervalS,
          idle_poll_interval_s: b.idleIntervalS,
          config: b.config,
        }
        if (body.poll_interval_s !== undefined) b.pollIntervalS = body.poll_interval_s
        if (body.idle_poll_interval_s !== undefined) b.idleIntervalS = body.idle_poll_interval_s
        if (body.config) b.config = { ...b.config, ...body.config }
        b.updatedAt = new Date().toISOString()
        ctx.record(
          c,
          "tracker.config.update",
          { type: "binding", id: String(b.id), label: `${b.providerKey} ${b.externalRef}` },
          {
            before,
            after: {
              poll_interval_s: b.pollIntervalS,
              idle_poll_interval_s: b.idleIntervalS,
              config: b.config,
            },
          },
          { networkId: b.network.networkId },
        )
        return response(200).json({ ok: true, data: transit.toBinding(b) })
      },
    ),
    http.post(
      "/v1/dash/networks/{networkId}/bindings/{bindingId}/sync",
      async ({ request, params, response }) => {
        await wait()
        const c = authorize(
          request,
          "POST /v1/dash/networks/{networkId}/bindings/{bindingId}/sync",
          params.networkId,
        )
        if (c instanceof Response) return c
        const b = bindingIn(params.networkId, params.bindingId)
        if (!b) return notFound("binding")
        await delay(900)
        const run = {
          id: syncRuns.length + 100,
          binding_id: b.id,
          version_id: 30 + syncRuns.length,
          trigger: `manual:${c.persona.username}`,
          status: "unchanged" as const,
          started_at: new Date(Date.now() - 900).toISOString(),
          finished_at: new Date().toISOString(),
          counts: {
            routes: b.network.routes.length,
            stops: 0,
            patterns: b.network.routes.length * 2,
          },
          warnings: [],
          error: null,
        }
        syncRuns.unshift(run)
        return response(200).json({
          ok: true,
          data: {
            binding_id: b.id,
            run_id: run.id,
            status: "unchanged",
            version_id: run.version_id,
            counts: run.counts,
            warnings: [],
            error: null,
          },
        })
      },
    ),
    http.get("/v1/dash/networks/{networkId}/sync-runs", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/networks/{networkId}/sync-runs", params.networkId)
      if (c instanceof Response) return c
      const n = ctx.network(params.networkId)
      if (!n) return notFound("network")
      const ids = transit.bindingsOf(n.id).map((b) => b.id)
      return response(200).json({
        ok: true,
        data: {
          items: syncRuns.filter((r) => ids.includes(r.binding_id)),
          next_cursor: null,
          prev_cursor: null,
          total: null,
        },
      })
    }),

    http.get("/v1/dash/providers", async ({ request, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/providers")
      if (c instanceof Response) return c
      return response(200).json({ ok: true, data: transit.providers.map(providerRow) })
    }),
    http.get("/v1/dash/providers/{key}", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "GET /v1/dash/providers/{key}")
      if (c instanceof Response) return c
      const p = transit.provider(params.key)
      if (!p) return notFound("provider")
      return response(200).json({
        ok: true,
        data: {
          ...providerRow(p),
          config_schema: KENTKART_CONFIG_SCHEMA,
          credentials: transit.bindings
            .filter((b) => b.providerKey === p.key)
            .flatMap((b) => {
              const cr = transit.statusView(b).credentials
              return cr ? [cr] : []
            }),
          rate_hint: { host: "service.kentkart.com", requests_per_second: 2 },
        },
      })
    }),
    http.post("/v1/dash/providers/{key}/kill", async ({ request, params, response }) => {
      await wait()
      const c = authorize(request, "POST /v1/dash/providers/{key}/kill")
      if (c instanceof Response) return c
      const p = transit.provider(params.key)
      if (!p) return notFound("provider")
      const body = await request.json()
      p.enabled = body.enabled
      p.killedReason = body.enabled ? null : body.reason
      p.killedAt = body.enabled ? null : nowSec()
      ctx.record(
        c,
        body.enabled ? "provider.enable" : "provider.kill",
        { type: "provider", id: p.key, label: p.name },
        { after: { enabled: body.enabled, reason: body.reason } },
        { severity: "critical" },
      )
      for (const b of transit.bindings) if (b.providerKey === p.key) transit.emitStatus(b)
      return response(200).json({ ok: true, data: providerRow(p) })
    }),
  ]
}

const iso = (t: number) => new Date(t * 1000).toISOString()

function pct(values: number[], p: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0)
}

const syncRuns: S["SyncRunPageDto"]["items"] = [4, 54].flatMap((bindingId) =>
  [1, 2, 3, 8].map((daysAgo, i) => {
    const started = Date.now() - daysAgo * 86_400_000 - 3.6e6
    const failed = bindingId === 54 && i === 2
    return {
      id: bindingId * 10 + i,
      binding_id: bindingId,
      version_id: failed ? null : 20 + i,
      trigger: i === 3 ? "manual:phasenull" : "schedule",
      status: failed ? ("failed" as const) : i === 0 ? ("unchanged" as const) : ("ok" as const),
      started_at: new Date(started).toISOString(),
      finished_at: new Date(started + 41_000).toISOString(),
      counts: failed
        ? null
        : {
            routes: bindingId === 4 ? 12 : 3,
            stops: bindingId === 4 ? 168 : 31,
            patterns: bindingId === 4 ? 24 : 6,
          },
      warnings: i === 1 ? ["2 stops without coordinates", "route 777 has no pathInfo"] : null,
      error: failed ? "upstream_error: HTTP 503 on route/list" : null,
    }
  }),
)
