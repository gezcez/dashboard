import type { DataTag } from "@tanstack/react-query"
import type { MaybeOptionalInit } from "openapi-fetch"
import type { PathsWithMethod, RequiredKeysOf } from "openapi-typescript-helpers"
import type { GezcezClient } from "./client"
import { GezcezApiError, toApiError, unwrap } from "./envelope"
import type { paths } from "./schema.gen"

export type Method = "get" | "post" | "put" | "patch" | "delete"
export type PathFor<M extends Method> = PathsWithMethod<paths, M>
export type InitFor<M extends Method, P extends PathFor<M>> = MaybeOptionalInit<paths[P], M>

type Envelope<T> = { ok: true; data: T }
type Unwrap<T> = T extends Envelope<infer D> ? D : never
type JsonOf<R> = R extends { content: { "application/json": infer B } } ? B : never
type SuccessBody<Op> = Op extends { responses: infer R }
  ? R extends { 200: infer S }
    ? JsonOf<S>
    : R extends { 201: infer S }
      ? JsonOf<S>
      : never
  : never

/** The `data` inside the `{ ok: true, data }` envelope of the success response. */
export type DataFor<M extends Method, P extends PathFor<M>> = Unwrap<SuccessBody<paths[P][M]>>

/** `init` is required only when the operation has required params or a required body. */
export type ArgsFor<M extends Method, P extends PathFor<M>> =
  RequiredKeysOf<NonNullable<InitFor<M, P>>> extends never
    ? [init?: InitFor<M, P>]
    : [init: InitFor<M, P>]

type LooseRequest = (
  method: string,
  path: string,
  init?: object,
) => Promise<{ data?: unknown; error?: unknown; response: Response }>

/**
 * Calls an operation and returns the unwrapped `data`, or throws GezcezApiError. A fetch that
 * never got an answer (TypeError) becomes code NETWORK. Anything else thrown by the injected
 * fetch (an aborted signal, the auth client's signed-out error) propagates unchanged so the shell
 * can react to it.
 */
export async function apiCall<M extends Method, P extends PathFor<M>>(
  client: GezcezClient,
  method: M,
  path: P,
  ...[init]: ArgsFor<M, P>
): Promise<DataFor<M, P>> {
  const request = client.request as unknown as LooseRequest
  let result: Awaited<ReturnType<LooseRequest>>
  try {
    result = await request(method.toUpperCase(), path, init ?? undefined)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new GezcezApiError({ code: "NETWORK", message: error.message, status: 0 })
    }
    throw error
  }
  const { data, error, response } = result
  if (error !== undefined || !response.ok) throw toApiError(error, response)
  return unwrap(data as Envelope<DataFor<M, P>> | undefined, response)
}

/** Stable, token-free query keys: ["api", path, params]. */
export function apiKey<P extends PathFor<"get">>(path: P, init?: InitFor<"get", P>) {
  const params = (init as { params?: unknown } | undefined)?.params ?? null
  return ["api", path, params] as const
}

export type ApiKey<P extends PathFor<"get">> = readonly ["api", P, unknown]

/**
 * TanStack Query options for a GET operation. The return type is spelled out (instead of going
 * through `queryOptions()`), because inferring it across every path makes TypeScript give up
 * (TS2590) once the schema has a few dozen operations. Runtime-wise `queryOptions` is identity.
 */
export interface ApiQueryOptions<P extends PathFor<"get">> {
  queryKey: DataTag<ApiKey<P>, DataFor<"get", P>, Error>
  queryFn: (context: { signal: AbortSignal }) => Promise<DataFor<"get", P>>
}

export function apiQueryOptions<P extends PathFor<"get">>(
  client: GezcezClient,
  path: P,
  ...args: ArgsFor<"get", P>
): ApiQueryOptions<P> {
  const [init] = args
  return {
    queryKey: apiKey(path, init) as ApiQueryOptions<P>["queryKey"],
    queryFn: ({ signal }) =>
      apiCall(
        client,
        "get",
        path,
        ...([{ ...(init ?? {}), signal }] as unknown as ArgsFor<"get", P>),
      ),
  }
}
