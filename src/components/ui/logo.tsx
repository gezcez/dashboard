import { cn } from "@/lib/utils"

/** The gezcez mark (same asset as www) plus the lowercase wordmark. */
export function Logo({
  className,
  wordmark = true,
  suffix,
}: {
  className?: string
  wordmark?: boolean
  suffix?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <img src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-lg" />
      {wordmark && <span className="text-base">gezcez</span>}
      {suffix && (
        <span className="text-xs font-semibold tracking-widest text-brand-strong uppercase">
          {suffix}
        </span>
      )}
    </span>
  )
}
