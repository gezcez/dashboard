import { ERROR_CODES, type ErrorCode } from "./error-codes.gen"
import type { components } from "./schema.gen"

export type ApiErrorBody = components["schemas"]["ApiError"]

const KNOWN = new Set<string>(ERROR_CODES)

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && KNOWN.has(value)
}

/**
 * Typed error for every non-ok API response. `code` is a backend ErrorCode, or NETWORK when the
 * request never got an answer, or UNKNOWN when the body was not an error envelope.
 */
export class GezcezApiError extends Error {
  readonly code: ErrorCode | "NETWORK" | "UNKNOWN"
  readonly status: number
  readonly details: Record<string, unknown>
  readonly requestId: string | null

  constructor(init: {
    code: GezcezApiError["code"]
    message: string
    status: number
    details?: Record<string, unknown>
    requestId?: string | null
  }) {
    super(init.message)
    this.name = "GezcezApiError"
    this.code = init.code
    this.status = init.status
    this.details = init.details ?? {}
    this.requestId = init.requestId ?? null
  }

  /** `PERMISSION_MISSING` carries the missing key in details.permission. */
  get permission(): string | null {
    return typeof this.details.permission === "string" ? this.details.permission : null
  }
}

export function isApiError(error: unknown, code?: GezcezApiError["code"]): error is GezcezApiError {
  return error instanceof GezcezApiError && (code === undefined || error.code === code)
}

/** Builds a GezcezApiError from whatever openapi-fetch returned as `error`. */
export function toApiError(body: unknown, response: Response): GezcezApiError {
  const err = (body as { error?: Partial<ApiErrorBody> } | null | undefined)?.error
  const requestId = err?.request_id ?? response.headers.get("x-request-id")
  if (err && isErrorCode(err.code)) {
    return new GezcezApiError({
      code: err.code,
      message: err.message ?? err.code,
      status: response.status,
      details: err.details ?? {},
      requestId,
    })
  }
  return new GezcezApiError({
    code: "UNKNOWN",
    message: `HTTP ${response.status}`,
    status: response.status,
    requestId,
  })
}

/** Unwraps `{ ok: true, data }`. */
export function unwrap<T>(body: { ok: true; data: T } | undefined, response: Response): T {
  if (!body?.ok) throw toApiError(body, response)
  return body.data
}
