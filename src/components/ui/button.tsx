import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/**
 * Pill buttons, flat, like www. `primary` is navy (amber-400 in dark mode). Destructive actions are
 * outline pills; the filled red pill is kept for the final confirm inside a dialog.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        brand: "brand-gradient text-navy hover:brightness-105",
        outline:
          "border border-input bg-card/60 text-foreground hover:bg-card dark:bg-transparent dark:hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-secondary",
        destructive:
          "border border-destructive bg-transparent text-destructive hover:bg-destructive/10",
        /** Only for the final confirm inside a dialog. */
        "destructive-solid": "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "rounded-none px-0 text-brand-strong underline-offset-4 hover:underline",
      },
      size: {
        // Dense on a mouse; 44 px touch targets on a touch screen.
        sm: "h-8 px-3 text-sm pointer-coarse:h-11",
        md: "h-9 px-4 text-sm pointer-coarse:h-11",
        lg: "h-11 px-6 text-base",
        icon: "size-9 pointer-coarse:size-11",
        "icon-sm": "size-8 pointer-coarse:size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
