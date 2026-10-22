import type { PermissionKey } from "@/api/permission-keys.gen"
import type { components } from "@/api/schema.gen"

type PermissionInfo = components["schemas"]["PermissionInfo"]
type Role = components["schemas"]["Role"]

export type MatrixOp = "grant" | "revoke"
/** Staged edits keyed by `"roleId:permissionKey"` (plan 6.9). */
export type StagedDiff = ReadonlyMap<string, MatrixOp>
/** What the server says each role holds today. */
export type Grants = ReadonlyMap<number, ReadonlySet<string>>

export interface MatrixOperation {
  role_id: number
  permission_key: PermissionKey
  op: MatrixOp
}

export interface OperationResult extends MatrixOperation {
  ok: boolean
  error_code: string | null
}

export const cellKey = (roleId: number, key: string) => `${String(roleId)}:${key}`

export function parseCellKey(cell: string): { roleId: number; key: PermissionKey } {
  const i = cell.indexOf(":")
  return { roleId: Number(cell.slice(0, i)), key: cell.slice(i + 1) as PermissionKey }
}

export function grantsFrom(rows: { role_id: number; permissions: readonly string[] }[]): Grants {
  return new Map(rows.map((g) => [g.role_id, new Set(g.permissions)]))
}

/** Whether a cell is checked once the staged diff is applied. */
export function isChecked(grants: Grants, staged: StagedDiff, roleId: number, key: string) {
  const op = staged.get(cellKey(roleId, key))
  if (op) return op === "grant"
  return grants.get(roleId)?.has(key) ?? false
}

/**
 * Flips a cell. Toggling a staged cell back to the server value drops it from the diff, so the
 * diff only ever holds real changes.
 */
export function toggleCell(
  grants: Grants,
  staged: StagedDiff,
  roleId: number,
  key: string,
): Map<string, MatrixOp> {
  const next = new Map(staged)
  const k = cellKey(roleId, key)
  if (next.has(k)) next.delete(k)
  else next.set(k, grants.get(roleId)?.has(key) ? "revoke" : "grant")
  return next
}

export function countOps(staged: StagedDiff): { grants: number; revokes: number } {
  let grants = 0
  for (const op of staged.values()) if (op === "grant") grants++
  return { grants, revokes: staged.size - grants }
}

/** The batch body, ordered by role then key so the review dialog and request agree. */
export function toOperations(staged: StagedDiff): MatrixOperation[] {
  return [...staged.entries()]
    .map(([cell, op]) => {
      const { roleId, key } = parseCellKey(cell)
      return { role_id: roleId, permission_key: key, op }
    })
    .sort((a, b) => a.role_id - b.role_id || a.permission_key.localeCompare(b.permission_key))
}

/** After a batch save: succeeded operations leave the diff, failed ones stay staged. */
export function keepFailed(staged: StagedDiff, results: OperationResult[]): Map<string, MatrixOp> {
  const next = new Map(staged)
  for (const r of results) if (r.ok) next.delete(cellKey(r.role_id, r.permission_key))
  return next
}

/** Dangerous per plan 6.9: any key with sudo or global scope. */
export function isDangerous(info: Pick<PermissionInfo, "sudo" | "scope"> | undefined): boolean {
  return !info || info.sudo || info.scope === "global"
}

/** Keys that change who can change permissions: granting them gets an extra warning. */
export const ESCALATION_KEYS: readonly string[] = [
  "roles.write",
  "roles.assign",
  "permissions.write",
]

export type DisabledReason = "immutable" | "not_held" | "level" | null

/** Why a cell can't be toggled by this viewer (null: it can). Mirrors backend 6.4 rules. */
export function disabledReason(
  role: Pick<Role, "immutable" | "level">,
  key: string,
  viewer: { held: ReadonlySet<string>; level: number; root: boolean },
): DisabledReason {
  if (role.immutable) return "immutable"
  if (viewer.root) return null
  if (role.level >= viewer.level) return "level"
  if (!viewer.held.has(key)) return "not_held"
  return null
}

/** Area prefix of a key: `tracker.config.write` → `tracker`. */
export function areaOf(key: string): string {
  return key.split(".")[0] ?? key
}

export function groupByArea<T extends { key: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const area = areaOf(item.key)
    groups.set(area, [...(groups.get(area) ?? []), item])
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}
