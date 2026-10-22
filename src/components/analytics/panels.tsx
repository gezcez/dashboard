import { DownloadIcon, InfoIcon, TableIcon } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { env } from "@/env"
import { formatDateTime, formatNumber } from "@/lib/format"
import { useCan } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { compact, type MetricQuery } from "./search"
import type { MetricKey, MetricResult } from "./use-metric"

/** A titled card for one chart, with the sample size and data source in the corner. */
export function ChartCard({
  title,
  description,
  meta,
  children,
  actions,
  className,
  pending,
}: {
  title: string
  description?: ReactNode
  meta?: MetricResult["meta"]
  children: ReactNode
  actions?: ReactNode
  className?: string
  pending?: boolean
}) {
  const { t } = useTranslation("ops")
  return (
    <Card className={cn("flex min-w-0 flex-col gap-3 p-4", className)}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {meta && (
            <Badge variant="outline" title={formatDateTime(meta.generated_at)}>
              {t("analytics.n", { n: formatNumber(meta.n) })} · {t(`analytics.source.${meta.source}`)}
            </Badge>
          )}
          {actions}
        </div>
      </header>
      {pending ? <Skeleton className="h-64 w-full rounded-xl" /> : children}
    </Card>
  )
}

/** "View as table": the raw result rows, the accessible alternative to every chart. */
export function ResultTable({
  result,
  format,
  maxRows = 500,
}: {
  result: Pick<MetricResult, "columns" | "rows"> | undefined
  format?: Partial<Record<string, (v: unknown) => ReactNode>>
  maxRows?: number
}) {
  const { t } = useTranslation("ops")
  if (!result) return null
  const rows = result.rows.slice(0, maxRows)
  return (
    <div className="grid gap-2">
      <div className="max-h-[480px] overflow-auto rounded-xl border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              {result.columns.map((c) => (
                <TableHead key={c} className="font-mono text-xs whitespace-nowrap">
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {result.columns.map((c, j) => {
                  const v = r[j]
                  const f = format?.[c]
                  return (
                    <TableCell key={c} className="tabular text-xs whitespace-nowrap">
                      {f
                        ? f(v)
                        : typeof v === "number"
                          ? formatNumber(v, { maximumFractionDigits: 3 })
                          : v === null || v === undefined
                            ? "–"
                            : String(v)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {result.rows.length > maxRows && (
        <p className="text-xs text-muted-foreground">
          {t("analytics.tableCapped", {
            shown: formatNumber(maxRows),
            total: formatNumber(result.rows.length),
          })}
        </p>
      )}
    </div>
  )
}

/** Downloads through the auth client's fetch, so the bearer token is attached. */
async function download(url: string, fallbackName: string) {
  const res = await auth.fetch(new Request(url))
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`)
  const blob = await res.blob()
  const name =
    /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? fallbackName
  const href = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = href
  a.download = name
  a.click()
  URL.revokeObjectURL(href)
}

/** CSV and Parquet export of the metrics a page shows (gated by analytics.export). */
export function ExportMenu({
  networkId,
  metrics,
}: {
  networkId: number
  metrics: { metric: MetricKey; query: MetricQuery }[]
}) {
  const { t } = useTranslation("ops")
  const allowed = useCan("analytics.export", { network: networkId })
  const [busy, setBusy] = useState(false)
  if (!allowed || metrics.length === 0) return null
  const run = (metric: MetricKey, query: MetricQuery, format: "csv" | "parquet") => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(compact(query))) params.set(k, String(v))
    params.set("format", format)
    const url = `${env.VITE_API_URL}/v1/dash/networks/${String(networkId)}/analytics/${metric}/export?${params.toString()}`
    setBusy(true)
    download(url, `${metric}.${format}`)
      .catch(() => toast.error(t("analytics.exportFailed")))
      .finally(() => {
        setBusy(false)
      })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy}>
          <DownloadIcon />
          {t("analytics.export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {metrics.flatMap(({ metric, query }) =>
          (["csv", "parquet"] as const).map((format) => (
            <DropdownMenuItem
              key={`${metric}-${format}`}
              onSelect={() => {
                run(metric, query, format)
              }}
            >
              <span className="font-mono text-xs">{metric}</span>
              <span className="ml-auto pl-4 text-xs text-muted-foreground uppercase">{format}</span>
            </DropdownMenuItem>
          )),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Methodology drawer: what is computed, what is filtered out, known caveats (plan 6.6). */
export function MethodologyButton({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation("ops")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true)
        }}
      >
        <InfoIcon />
        {t("analytics.methodology")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[28rem] gap-4 overflow-y-auto bg-card p-6">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <SheetDescription className="sr-only">{t("analytics.methodology")}</SheetDescription>
          <div className="grid gap-3 text-sm leading-relaxed [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function TableToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const { t } = useTranslation("ops")
  return (
    <Button
      variant={on ? "primary" : "outline"}
      size="sm"
      aria-pressed={on}
      onClick={() => {
        onChange(!on)
      }}
    >
      <TableIcon />
      {t("analytics.viewAsTable")}
    </Button>
  )
}
