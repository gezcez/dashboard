import { PauseIcon, PlayIcon } from "lucide-react"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { formatClock } from "@/lib/format"
import { cn } from "@/lib/utils"

export const SPEEDS = [1, 10, 60, 300] as const
export type Speed = (typeof SPEEDS)[number]

/**
 * Timeline under the playback map: play/pause, speed, and a range input over a histogram of
 * active vehicles with poll gaps drawn as hatched bands (plan 6.4).
 */
export function Scrubber({
  start,
  span,
  time,
  onTime,
  playing,
  onPlaying,
  speed,
  onSpeed,
  histogram,
  gaps,
  timeZone,
}: {
  start: number
  span: number
  time: number
  onTime: (t: number) => void
  playing: boolean
  onPlaying: (playing: boolean) => void
  speed: Speed
  onSpeed: (speed: Speed) => void
  histogram: number[]
  gaps: number[][]
  timeZone: string
}) {
  const { t } = useTranslation("ops")
  const pattern = useId()
  const max = Math.max(1, ...histogram)
  const W = 1000
  const H = 40
  const bw = W / Math.max(1, histogram.length)
  return (
    <div className="grid gap-2 rounded-2xl border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon-sm"
          onClick={() => {
            onPlaying(!playing)
          }}
          aria-label={playing ? t("playback.pause") : t("playback.play")}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <div className="flex gap-1" role="group" aria-label={t("playback.speed")}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => {
                onSpeed(s)
              }}
              className={cn(
                "tabular rounded-full border px-2 py-0.5 text-xs font-medium hover:bg-secondary",
                speed === s && "border-primary/40 bg-accent text-accent-foreground",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className="tabular ml-auto text-sm font-semibold">
          {formatClock(start + time, timeZone, true)}
        </span>
      </div>
      <div className="relative h-10">
        <svg
          viewBox={`0 0 ${String(W)} ${String(H)}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <pattern
              id={pattern}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" />
            </pattern>
          </defs>
          {histogram.map((n, i) => (
            <rect
              key={i}
              x={i * bw}
              width={Math.max(0.5, bw - 0.6)}
              y={H - (n / max) * H}
              height={(n / max) * H}
              className="fill-brand/25"
            />
          ))}
          {gaps.map(([a = 0, b = 0], i) => (
            <rect
              key={`g${String(i)}`}
              x={(a / span) * W}
              width={Math.max(2, ((b - a) / span) * W)}
              y={0}
              height={H}
              fill={`url(#${pattern})`}
              className="text-status-warn/60"
            />
          ))}
        </svg>
        <input
          type="range"
          min={0}
          max={span}
          step={1}
          value={time}
          onChange={(e) => {
            onTime(Number(e.target.value))
          }}
          aria-label={t("playback.timeline")}
          aria-valuetext={formatClock(start + time, timeZone, true)}
          className="absolute inset-0 h-full w-full cursor-pointer accent-brand opacity-90 [&::-webkit-slider-runnable-track]:bg-transparent"
        />
      </div>
      <div className="tabular flex justify-between text-xs text-muted-foreground">
        <span>{formatClock(start, timeZone)}</span>
        {gaps.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-status-warn/50" />
            {t("playback.gaps", { count: gaps.length })}
          </span>
        )}
        <span>{formatClock(start + span, timeZone)}</span>
      </div>
    </div>
  )
}
