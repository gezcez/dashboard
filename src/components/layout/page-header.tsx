import type { ReactNode } from "react"
import { Eyebrow } from "@/components/ui/eyebrow"
import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  intro,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  intro?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-muted-foreground">{intro}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
