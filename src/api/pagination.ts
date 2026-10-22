import { z } from "zod"

/** Response shape of every list endpoint (backend 7.0). */
export interface Page<T> {
  items: T[]
  next_cursor: string | null
  prev_cursor: string | null
  /** Counted up to 10 000, else null ("10 000+"). */
  total: number | null
}

export const PAGE_LIMITS = [25, 50, 100, 200] as const

/** URL search params shared by every server table. Changing a filter must reset `cursor`. */
export const tableSearchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
  sort: z.string().optional(),
  q: z.string().optional(),
})

export type TableSearch = z.infer<typeof tableSearchSchema>
