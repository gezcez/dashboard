import { PauseIcon, PlayIcon, Trash2Icon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TrackerLogLine } from "@/api/realtime-types"
import { Button } from "@/components/ui/button"
import { formatClock } from "@/lib/format"
import { useChannel } from "@/lib/realtime"
import { DEFAULT_NETWORK_TIMEZONE } from "@/lib/time"
import { cn } from "@/lib/utils"

export const MAX_LINES = 2000
const LEVELS = ["debug", "info", "warn", "error"] as const
type Level = (typeof LEVELS)[number]
const RANK: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const COLOR: Record<Level, string> = {
  debug: "text-muted-foreground",
  info: "text-foreground",
  warn: "text-status-warn",
  error: "text-status-error",
}

/** Appends lines, keeping only the newest MAX_LINES. */
export function appendLines(prev: TrackerLogLine[], next: TrackerLogLine[]): TrackerLogLine[] {
  const all = prev.concat(next)
  return all.length > MAX_LINES ? all.slice(all.length - MAX_LINES) : all
}

/**
 * Live tail of `tracker.logs` (plan 6.5, successor of the legacy terminal page). Lines render as
 * text nodes only, never HTML. Scrolling up pauses the follow; the level filter is client side.
 */
export function LiveLogs({ bindingId }: { bindingId: number }) {
  const { t } = useTranslation("ops")
  const [lines, setLines] = useState<TrackerLogLine[]>([])
  const [minLevel, setMinLevel] = useState<Level>("info")
  const [follow, setFollow] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const buffer = useRef<TrackerLogLine[]>([])

  const error = useChannel("tracker.logs", { binding: bindingId }, (m) => {
    if (m.type === "event") buffer.current.push(m.data as TrackerLogLine)
  })
  // Batch incoming lines once per animation frame-ish tick to keep long bursts cheap.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (buffer.current.length === 0) return
      const next = buffer.current
      buffer.current = []
      setLines((prev) => appendLines(prev, next))
    }, 250)
    return () => {
      window.clearInterval(id)
    }
  }, [])
  useEffect(() => {
    const el = box.current
    if (follow && el) el.scrollTop = el.scrollHeight
  }, [lines, follow, minLevel])

  const shown = lines.filter((l) => RANK[l.level] >= RANK[minLevel])
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="group" aria-label={t("tracker.logs.level")}>
          {LEVELS.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={l === minLevel ? "primary" : "outline"}
              aria-pressed={l === minLevel}
              onClick={() => {
                setMinLevel(l)
              }}
            >
              {l}+
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFollow((f) => !f)
          }}
        >
          {follow ? <PauseIcon /> : <PlayIcon />}
          {follow ? t("tracker.logs.pause") : t("tracker.logs.follow")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setLines([])
          }}
        >
          <Trash2Icon />
          {t("tracker.logs.clear")}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {t("tracker.logs.count", { shown: shown.length, max: MAX_LINES })}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-status-error">
          {error.message}
        </p>
      )}
      <div
        ref={box}
        role="log"
        aria-live="off"
        aria-label={t("tracker.tabs.logs")}
        onScroll={(e) => {
          const el = e.currentTarget
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
          if (!atBottom && follow) setFollow(false)
        }}
        className="h-[480px] overflow-auto rounded-2xl border bg-navy-deep p-3 font-mono text-xs leading-relaxed text-cream dark:bg-black/40"
      >
        {shown.length === 0 ? (
          <p className="text-cream/60">{t("tracker.logs.waiting")}</p>
        ) : (
          shown.map((l, i) => (
            <div key={`${String(l.at)}-${String(i)}`} className="flex gap-3 whitespace-pre-wrap">
              <span className="shrink-0 text-cream/50">{formatClock(l.at, DEFAULT_NETWORK_TIMEZONE, true)}</span>
              <span className={cn("w-11 shrink-0 uppercase", COLOR[l.level], l.level === "info" && "text-cream/80")}>
                {l.level}
              </span>
              <span className="min-w-0 break-all">{l.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
