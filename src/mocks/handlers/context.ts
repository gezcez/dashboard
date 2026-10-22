import { delay, HttpResponse } from "msw"
import { createOpenApiHttp } from "openapi-msw"
import { OPERATION_AUTH } from "@/api/permission-keys.gen"
import type { components, paths } from "@/api/schema.gen"
import { base64UrlEncode, randomBase64Url } from "@/auth/pkce"
import { decodeAccessToken } from "@/auth/jwt"
import type { MockDb } from "../db"
import { findPersona, type Persona } from "../fixtures"

type S = components["schemas"]
type ErrorCode = S["ErrorCode"]

export const ACCESS_TTL = 15 * 60
export const STEP_UP_MAX_AGE = 600

export const nowSec = () => Math.floor(Date.now() / 1000)

export function jwt(claims: Record<string, unknown>): string {
  const enc = (o: unknown) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(o)))
  return `${enc({ alg: "none", typ: "JWT", kid: "mock" })}.${enc(claims)}.mock`
}

export function errorBody(code: ErrorCode, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      request_id: `mock_${randomBase64Url(6)}`,
      ...(details ? { details } : {}),
    },
  }
}

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return HttpResponse.json(errorBody(code, message, details), { status })
}

export interface Caller {
  persona: Persona
  me: S["Me"]
  authTime: number
  ref: S["UserRef"]
}

export type Operation = keyof typeof OPERATION_AUTH

// ---- pagination (backend 7.0) ----------------------------------------------------------------

export function paginate<T>(
  items: T[],
  url: URL,
  sorters: Record<string, (a: T, b: T) => number>,
  defaultSort: string,
) {
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 200)
  const sort = url.searchParams.get("sort") ?? defaultSort
  const [field = "", dir = "asc"] = sort.split(":")
  const cmp = sorters[field]
  const sorted = cmp ? [...items].sort((a, b) => (dir === "desc" ? -cmp(a, b) : cmp(a, b))) : items
  const offset = Number(atob(url.searchParams.get("cursor") ?? "") || 0) || 0
  const page = sorted.slice(offset, offset + limit)
  return {
    items: page,
    next_cursor: offset + limit < sorted.length ? btoa(String(offset + limit)) : null,
    prev_cursor: offset > 0 ? btoa(String(Math.max(offset - limit, 0))) : null,
    total: sorted.length > 10_000 ? null : sorted.length,
  }
}

export const byString =
  <T>(get: (x: T) => string | null) =>
  (a: T, b: T) =>
    (get(a) ?? "").localeCompare(get(b) ?? "")

export const byNumber =
  <T>(get: (x: T) => number) =>
  (a: T, b: T) =>
    get(a) - get(b)

export const matches = (q: string | null, ...values: (string | null | undefined)[]) =>
  !q || values.some((v) => (v ?? "").toLowerCase().includes(q.toLowerCase()))

/** Everything a handler group needs: typed http, the db, auth checks and the audit writer. */
export function createContext(apiUrl: string, db: MockDb, options: { latency?: boolean }) {
  const http = createOpenApiHttp<paths>({ baseUrl: apiUrl })
  const wait = () => (options.latency ? delay(120 + Math.random() * 200) : Promise.resolve())

  function caller(request: Request): Caller | Response {
    const header = request.headers.get("authorization") ?? ""
    const claims = header.startsWith("Bearer ") ? decodeAccessToken(header.slice(7)) : null
    if (!claims) return apiError(401, "AUTH_REQUIRED", "missing bearer token")
    if (claims.exp < nowSec()) return apiError(401, "AUTH_TOKEN_EXPIRED", "access token expired")
    const persona = findPersona(claims.sub.replace(/^persona:/, ""))
    if (!persona) return apiError(401, "AUTH_TOKEN_INVALID", "unknown subject")
    return {
      persona,
      me: db.meOf(persona, claims.authTime),
      authTime: claims.authTime,
      ref: { id: persona.userId, display_name: persona.name, username: persona.username },
    }
  }

  const holds = (c: Caller, key: string, networkId?: string | number) => {
    if ((c.me.global.permissions as string[]).includes(key)) return true
    if (networkId === undefined) return false
    const n = c.me.networks.find((x) => String(x.id) === String(networkId) || x.slug === networkId)
    return (n?.permissions as string[] | undefined)?.includes(key) ?? false
  }

  const isRoot = (c: Caller) => c.me.global.roles.some((r) => r.key === "root")

  const stepUpError = () =>
    apiError(403, "AUTH_STEP_UP_REQUIRED", "re-authenticate", { max_age: STEP_UP_MAX_AGE })
  const fresh = (c: Caller) => nowSec() - c.authTime <= STEP_UP_MAX_AGE

  /** Enforces x-gezcez-permission and x-gezcez-sudo exactly as the generated OPERATION_AUTH says. */
  function authorize(
    request: Request,
    operation: Operation,
    networkId?: string,
  ): Caller | Response {
    const c = caller(request)
    if (c instanceof Response) return c
    const rule = OPERATION_AUTH[operation]
    const allowed = holds(c, rule.key, rule.scope === "network" ? networkId : undefined)
    if (!allowed)
      return apiError(403, "PERMISSION_MISSING", `missing ${rule.key}`, { permission: rule.key })
    if (rule.sudo && !fresh(c)) return stepUpError()
    return c
  }

  function record(
    c: Caller,
    action: string,
    target: { type: string; id: string | null; label: string | null },
    change: { before?: S["AuditEntry"]["before"]; after?: S["AuditEntry"]["after"] } = {},
    options: { severity?: S["AuditEntry"]["severity"]; networkId?: number | null } = {},
  ) {
    const n = db.audit.length + 1
    db.audit.unshift({
      id: `aud_live_${String(n)}`,
      at: new Date().toISOString(),
      action,
      severity: options.severity ?? "info",
      actor: c.ref,
      target_type: target.type,
      target_id: target.id,
      target_label: target.label,
      network_id: options.networkId ?? null,
      ip_prefix: "127.0.0.0/24",
      request_id: `req_live_${String(n)}`,
      before: change.before ?? null,
      after: change.after ?? null,
    })
  }

  const network = (idOrSlug: string) =>
    db.networkList.find((x) => x.slug === idOrSlug || String(x.id) === idOrSlug)

  return {
    apiUrl,
    http,
    db,
    wait,
    caller,
    authorize,
    holds,
    isRoot,
    fresh,
    stepUpError,
    record,
    network,
  }
}

export type Ctx = ReturnType<typeof createContext>
