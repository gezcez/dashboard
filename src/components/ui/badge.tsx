import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        brand: "bg-accent text-accent-foreground",
        outline: "border border-border text-foreground",
        solid: "bg-primary text-primary-foreground",
        ok: "bg-status-ok/12 text-status-ok-fg",
        warn: "bg-status-warn/12 text-status-warn-fg",
        error: "bg-status-error/12 text-status-error-fg",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
