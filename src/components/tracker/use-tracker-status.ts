import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { BindingStatusView, TrackerStatusEvent } from "@/api/realtime-types"
import { trackerQuery } from "@/components/transit/queries"
import { useChannel, type ChannelError } from "@/lib/realtime"

/**
 * Binding states of one network: the REST overview (polled every 30 s) overlaid with pushes from
 * the `tracker.status` channel, so a pause or a failure shows within a poll, not a refresh.
 */
export function useTrackerStatus(networkId: number): {
  bindings: Map<number, BindingStatusView>
  runner: string | null
  running: boolean | null
  isPending: boolean
  error: unknown
  channelError: ChannelError | null
  refetch: () => void
  /** When the last push arrived, ms. */
  pushedAt: number | null
} {
  const rest = useQuery(trackerQuery(networkId))
  const [pushed, setPushed] = useState<{ at: number; map: Map<number, BindingStatusView> }>({
    at: 0,
    map: new Map(),
  })
  const channelError = useChannel("tracker.status", { network: networkId }, (m) => {
    if (m.type !== "event") return
    const e = m.data as TrackerStatusEvent
    setPushed((prev) => {
      const map = new Map(prev.map)
      if (e.kind === "snapshot") for (const b of e.bindings) map.set(b.binding_id, b)
      else map.set(e.binding.binding_id, e.binding)
      return { at: Date.now(), map }
    })
  })
  const bindings = useMemo(() => {
    const map = new Map<number, BindingStatusView>()
    for (const b of rest.data?.bindings ?? []) map.set(b.binding_id, b)
    // A push newer than the last REST fetch wins.
    if (pushed.at >= rest.dataUpdatedAt) for (const [id, b] of pushed.map) map.set(id, b)
    else for (const [id, b] of pushed.map) if (!map.has(id)) map.set(id, b)
    return map
  }, [rest.data, rest.dataUpdatedAt, pushed])
  return {
    bindings,
    runner: rest.data?.runner ?? null,
    running: rest.data?.running ?? null,
    isPending: rest.isPending,
    error: rest.error,
    channelError,
    refetch: () => void rest.refetch(),
    pushedAt: pushed.at || null,
  }
}
