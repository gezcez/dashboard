import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Shared frame for empty, error, 403 and 404 states: gradient icon tile, as on www. */
export function StateCard({
  icon: Icon,
  title,
  children,
  actions,
  className,
  tone = "brand",
}: {
  icon: LucideIcon
  title: ReactNode
  children?: ReactNode
  actions?: ReactNode
  className?: string
  tone?: "brand" | "muted"
}) {
  return (
    <div
      role="status"
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center rounded-2xl border bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-xl",
          tone === "brand" ? "brand-gradient text-navy" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
