/** One changed key of a binding config, for the diff preview before saving (plan 6.5). */
export interface ConfigChange {
  key: string
  before: unknown
  after: unknown
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Top-level keys whose value differs between two configs, sorted by key. */
export function diffConfig(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ConfigChange[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  return keys
    .filter((k) => !same(before[k], after[k]))
    .map((key) => ({ key, before: before[key], after: after[key] }))
}

/** Compact display of a config value in the diff. */
export function showValue(value: unknown): string {
  if (value === undefined) return "∅"
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

export interface SchemaField {
  key: string
  type: "string" | "number" | "integer" | "boolean" | "string[]"
  required: boolean
  description?: string
  pattern?: string
  minimum?: number
  maximum?: number
}

interface JsonSchemaProp {
  type?: string
  items?: { type?: string }
  description?: string
  pattern?: string
  minimum?: number
  maximum?: number
}

/**
 * Fields of an adapter's config JSON Schema that the generated form can edit: strings, numbers,
 * booleans and string arrays. Anything else stays editable in the raw JSON view.
 */
export function schemaFields(schema: unknown): SchemaField[] {
  if (!schema || typeof schema !== "object") return []
  const s = schema as { properties?: Record<string, JsonSchemaProp>; required?: string[] }
  const required = new Set(s.required ?? [])
  return Object.entries(s.properties ?? {}).flatMap(([key, p]): SchemaField[] => {
    const type =
      p.type === "array" && p.items?.type === "string"
        ? "string[]"
        : p.type === "string" || p.type === "number" || p.type === "integer" || p.type === "boolean"
          ? p.type
          : null
    if (!type) return []
    return [
      {
        key,
        type,
        required: required.has(key),
        description: p.description,
        pattern: p.pattern,
        minimum: p.minimum,
        maximum: p.maximum,
      },
    ]
  })
}

/** Validates one field value against its schema field; returns an error key or null. */
export function fieldError(field: SchemaField, value: unknown): "required" | "pattern" | "range" | null {
  const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0)
  if (empty) return field.required ? "required" : null
  if (field.type === "string" && field.pattern && typeof value === "string")
    return new RegExp(field.pattern).test(value) ? null : "pattern"
  if ((field.type === "number" || field.type === "integer") && typeof value === "number") {
    if (Number.isNaN(value)) return "range"
    if (field.minimum !== undefined && value < field.minimum) return "range"
    if (field.maximum !== undefined && value > field.maximum) return "range"
  }
  return null
}
