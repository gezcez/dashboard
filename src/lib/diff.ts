export type DiffKind = "added" | "removed" | "changed" | "same"

export interface DiffRow {
  key: string
  kind: DiffKind
  before: unknown
  after: unknown
}

type Obj = Record<string, unknown> | null | undefined

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Top-level diff of an audit entry's before/after payloads, keys sorted, changed rows first so
 * the reader sees what moved. Nested values compare by their JSON form.
 */
export function diffObjects(before: Obj, after: Obj): DiffRow[] {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort()
  const rows = keys.map((key): DiffRow => {
    const hasBefore = before != null && key in before
    const hasAfter = after != null && key in after
    const b = hasBefore ? before[key] : undefined
    const a = hasAfter ? after[key] : undefined
    const kind: DiffKind = !hasBefore
      ? "added"
      : !hasAfter
        ? "removed"
        : same(b, a)
          ? "same"
          : "changed"
    return { key, kind, before: b, after: a }
  })
  return [...rows.filter((r) => r.kind !== "same"), ...rows.filter((r) => r.kind === "same")]
}

export function formatValue(value: unknown): string {
  if (value === undefined) return ""
  if (typeof value === "string") return value
  return JSON.stringify(value)
}
