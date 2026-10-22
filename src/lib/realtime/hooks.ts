import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { BindingState, Channel, SubscriptionMessage } from "@/api/realtime-types"
import { apiQuery } from "@/lib/api"
import type { ConnectionState, RealtimeClient } from "./client"
import { realtime } from "./instance"
import { VehicleStore, type Vehicle } from "./vehicle-store"

export function useConnectionState(client: RealtimeClient = realtime): ConnectionState {
  return useSyncExternalStore(
    (cb) => client.onState(cb),
    () => client.state(),
  )
}

export interface ChannelError {
  code: string
  message: string
}

/**
 * Subscribes while mounted (ref-counted in the client). `params: null` skips the subscription.
 * Returns the last subscription error, if any.
 */
export function useChannel(
  channel: Channel,
  params: Record<string, unknown> | null,
  onMessage: (message: SubscriptionMessage) => void,
  client: RealtimeClient = realtime,
): ChannelError | null {
  const handler = useRef(onMessage)
  useEffect(() => {
    handler.current = onMessage
  })
  const [error, setError] = useState<ChannelError | null>(null)
  const key = params === null ? null : JSON.stringify(params)
  useEffect(() => {
    if (key === null) return
    setError(null)
    return client.subscribe(channel, JSON.parse(key) as Record<string, unknown>, {
      onMessage: (m) => handler.current(m),
      onError: setError,
    })
  }, [channel, key, client])
  return error
}

export interface BindingLiveState {
  state: BindingState
  message: string | null
}

export interface VehicleFeed {
  store: VehicleStore
  error: ChannelError | null
  /** Binding states pushed on the vehicles subscription (`status` messages). */
  bindings: ReadonlyMap<number, BindingLiveState>
  connection: ConnectionState
  /** Last snapshot or delta arrival, ms. */
  receivedAt: number | null
}

export const FALLBACK_POLL_MS = 15_000

/**
 * Live vehicles of one network: the `vehicles` channel with `detail: "full"`, falling back to
 * `GET /v1/networks/:id/vehicles` every 15 s while the socket is in fallback mode.
 */
export function useVehicleFeed(
  networkId: number | null,
  options: { routes?: string[]; client?: RealtimeClient } = {},
): VehicleFeed {
  const client = options.client ?? realtime
  const [store] = useState(() => new VehicleStore())
  useEffect(() => () => store.dispose(), [store])
  const [bindings, setBindings] = useState<ReadonlyMap<number, BindingLiveState>>(new Map())
  const [receivedAt, setReceivedAt] = useState<number | null>(null)
  const connection = useConnectionState(client)
  const routes = options.routes?.length ? options.routes : undefined

  const params =
    networkId === null
      ? null
      : { network: networkId, detail: "full", ...(routes ? { routes } : {}) }
  const error = useChannel(
    "vehicles",
    params,
    (m) => {
      if (m.type === "snapshot") {
        store.snapshot(m.fields, m.vehicles, m.feed_ts)
        setReceivedAt(Date.now())
      } else if (m.type === "delta") {
        store.delta(m.upsert, m.remove, m.feed_ts)
        setReceivedAt(Date.now())
      } else if (m.type === "status") {
        setBindings((prev) =>
          new Map(prev).set(m.binding, { state: m.state, message: m.message ?? null }),
        )
      }
    },
    client,
  )

  const fallback = connection === "fallback" && networkId !== null
  const polled = useQuery({
    ...apiQuery("/v1/networks/{networkId}/vehicles", {
      params: {
        path: { networkId: String(networkId ?? "") },
        query: routes ? { routes: routes.join(",") } : {},
      },
    }),
    enabled: fallback,
    refetchInterval: FALLBACK_POLL_MS,
  })
  useEffect(() => {
    if (!fallback || !polled.data) return
    store.snapshot(polled.data.fields, polled.data.vehicles, polled.data.feed_ts)
    setReceivedAt(polled.dataUpdatedAt)
  }, [fallback, polled.data, polled.dataUpdatedAt, store])

  return { store, error, bindings, connection, receivedAt }
}

/** Re-renders at most every 500 ms (the store's notify rate). */
export function useVehicles(store: VehicleStore): ReadonlyMap<string, Vehicle> {
  return useSyncExternalStore(store.subscribe, store.all)
}
