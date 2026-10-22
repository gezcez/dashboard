/** Server sort strings (backend 7.0): "field:asc" or "field:desc"; one field at a time here. */
export type SortDir = "asc" | "desc"
export interface SortState {
  field: string
  dir: SortDir
}

export function parseSort(sort: string | undefined): SortState | null {
  if (!sort) return null
  const [field = "", dir = "asc"] = sort.split(",")[0]?.split(":") ?? []
  if (!field) return null
  return { field, dir: dir === "desc" ? "desc" : "asc" }
}

export function formatSort(sort: SortState | null): string | undefined {
  return sort ? `${sort.field}:${sort.dir}` : undefined
}

/**
 * Header click cycle: a new column starts at its first direction (descending for dates, so the
 * newest come first), the second click flips it, the third returns to the server default.
 */
export function nextSort(
  current: string | undefined,
  field: string,
  firstDir: SortDir = "asc",
): string | undefined {
  const parsed = parseSort(current)
  if (parsed?.field !== field) return formatSort({ field, dir: firstDir })
  if (parsed.dir === firstDir)
    return formatSort({ field, dir: firstDir === "asc" ? "desc" : "asc" })
  return undefined
}
