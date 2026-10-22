import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/** The amber uppercase kicker above section titles on www. */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-semibold tracking-widest text-brand-strong uppercase", className)}
      {...props}
    />
  )
}
