import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronRightIcon } from "lucide-react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import { ErrorState } from "@/components/states/states"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { nextSort, parseSort, type SortDir } from "./sort"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- generic params must match the library's
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Server sort field; the header becomes a sort button when set. */
    sortKey?: string
    /** Direction of the first click (dates usually start descending). */
    firstDir?: SortDir
    className?: string
    /** Hidden below the sm breakpoint to keep phone tables readable. */
    hideOnMobile?: boolean
  }
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  rows: T[] | undefined
  getRowId: (row: T) => string
  isPending: boolean
  /** True while a new page or filter loads over the previous rows. */
  isFetching?: boolean
  error: unknown
  onRetry: () => void
  sort?: string
  onSortChange?: (sort: string | undefined) => void
  /** Rendered instead of the table when the result is empty. */
  empty: ReactNode
  footer?: ReactNode
  caption: string
  skeletonRows?: number
  /** Expandable rows: a toggle column is added and this renders under an open row. */
  renderDetail?: (row: T) => ReactNode
  /** Window-virtualised rows once a page holds more than 60 (plan 8.3: audit, poll log). */
  virtualize?: boolean
}

const VIRTUAL_MIN_ROWS = 60

/**
 * Server-driven table: rows, sort and paging come from the API (manual mode); state lives in the
 * URL so every view is linkable. Column `meta` carries the sort field and responsive hints.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isPending,
  isFetching = false,
  error,
  onRetry,
  sort,
  onSortChange,
  empty,
  footer,
  caption,
  skeletonRows = 8,
  renderDetail,
  virtualize = false,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }
  const colSpan = columns.length + (renderDetail ? 1 : 0)
  const table = useReactTable({
    data: rows ?? [],
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  })
  const current = parseSort(sort)
  const bodyRows = table.getRowModel().rows
  const virtual = virtualize && !isPending && bodyRows.length > VIRTUAL_MIN_ROWS
  const tableRef = useRef<HTMLTableElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    if (virtual && tableRef.current)
      setScrollMargin(tableRef.current.getBoundingClientRect().top + window.scrollY)
  }, [virtual, bodyRows.length])
  const virtualizer = useWindowVirtualizer({
    count: virtual ? bodyRows.length : 0,
    estimateSize: () => 45,
    overscan: 12,
    scrollMargin,
  })

  type Row = (typeof bodyRows)[number]
  const rowContent = (row: Row) => (
    <>
      <TableRow data-state={open.has(row.id) ? "open" : undefined}>
        {renderDetail && (
          <TableCell className="w-8 pr-0">
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-expanded={open.has(row.id)}
              aria-controls={`detail-${row.id}`}
              aria-label={t("table.toggleDetails")}
              onClick={() => {
                toggle(row.id)
              }}
            >
              <ChevronRightIcon
                className={cn("size-4 transition-transform", open.has(row.id) && "rotate-90")}
              />
            </button>
          </TableCell>
        )}
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta
          return (
            <TableCell
              key={cell.id}
              className={cn(meta?.className, meta?.hideOnMobile && "hidden sm:table-cell")}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          )
        })}
      </TableRow>
      {renderDetail && open.has(row.id) && (
        <TableRow id={`detail-${row.id}`} className="bg-muted/40 hover:bg-muted/40">
          <TableCell colSpan={colSpan} className="whitespace-normal">
            {renderDetail(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
  const renderRow = (row: Row) => <Fragment key={row.id}>{rowContent(row)}</Fragment>
  const items = virtualizer.getVirtualItems()
  const padTop = items.length ? (items[0]?.start ?? 0) - virtualizer.options.scrollMargin : 0
  const padBottom = items.length
    ? virtualizer.getTotalSize() -
      ((items[items.length - 1]?.end ?? 0) - virtualizer.options.scrollMargin)
    : 0

  if (error && !rows) {
    return (
      <ErrorState
        message={isApiError(error) ? apiErrorMessage(error) : undefined}
        requestId={isApiError(error) ? error.requestId : null}
        onRetry={onRetry}
      />
    )
  }
  if (!isPending && rows?.length === 0) return <>{empty}</>

  return (
    <div className="rounded-2xl border bg-card">
      <Table
        ref={tableRef}
        aria-busy={isPending || isFetching}
        className={cn(isFetching && "opacity-70")}
      >
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {renderDetail && (
                <TableHead className="w-8 pr-0">
                  <span className="sr-only">{t("table.details")}</span>
                </TableHead>
              )}
              {group.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const sortKey = meta?.sortKey
                const active = sortKey && current?.field === sortKey ? current.dir : null
                const label = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())
                return (
                  <TableHead
                    key={header.id}
                    className={cn(meta?.className, meta?.hideOnMobile && "hidden sm:table-cell")}
                    aria-sort={
                      active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined
                    }
                  >
                    {sortKey && onSortChange ? (
                      <button
                        type="button"
                        className="-mx-1 inline-flex items-center gap-1 rounded-md px-1 uppercase hover:text-foreground"
                        onClick={() => {
                          onSortChange(nextSort(sort, sortKey, meta.firstDir))
                        }}
                      >
                        {label}
                        {active === "asc" ? (
                          <ArrowUpIcon className="size-3" aria-label={t("table.sortedAsc")} />
                        ) : active === "desc" ? (
                          <ArrowDownIcon className="size-3" aria-label={t("table.sortedDesc")} />
                        ) : (
                          <ArrowUpDownIcon className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      label
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {renderDetail && <TableCell className="w-8 pr-0" />}
                  {columns.map((c, j) => (
                    <TableCell
                      key={j}
                      className={cn(c.meta?.hideOnMobile && "hidden sm:table-cell")}
                    >
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : !virtual && bodyRows.map((row) => renderRow(row))}
        </TableBody>
        {virtual && (
          <>
            {padTop > 0 && (
              <tbody aria-hidden>
                <tr style={{ height: padTop }} />
              </tbody>
            )}
            {items.map((item) => {
              const row = bodyRows[item.index]
              if (!row) return null
              // One <tbody> per row so an open detail row is measured with it.
              return (
                <tbody key={row.id} data-index={item.index} ref={virtualizer.measureElement}>
                  {rowContent(row)}
                </tbody>
              )
            })}
            {padBottom > 0 && (
              <tbody aria-hidden>
                <tr style={{ height: padBottom }} />
              </tbody>
            )}
          </>
        )}
      </Table>
      {footer && <div className="border-t px-3 py-2">{footer}</div>}
    </div>
  )
}
