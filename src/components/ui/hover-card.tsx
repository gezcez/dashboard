import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const HoverCard = HoverCardPrimitive.Root
export const HoverCardTrigger = HoverCardPrimitive.Trigger

export function HoverCardContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-2xl border bg-popover p-4 text-popover-foreground",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}
