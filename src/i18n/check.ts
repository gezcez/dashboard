import { ERROR_CODES } from "../api/error-codes.gen"

type Catalog = { [key: string]: string | Catalog }

function flatten(obj: Catalog, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`),
  )
}

/**
 * Returns human-readable problems: error codes without a translation, and keys present in one
 * language but not the other. Used by `bun run i18n:check` and by a unit test.
 */
export function checkCatalogs(resources: Record<string, Record<string, Catalog>>): string[] {
  const problems: string[] = []
  const langs = Object.keys(resources)
  for (const lang of langs) {
    const errors = resources[lang]?.errors ?? {}
    for (const code of ERROR_CODES) {
      if (typeof errors[code] !== "string") problems.push(`${lang}: errors.${code} is missing`)
    }
  }
  const [base, ...others] = langs
  if (!base) return problems
  for (const ns of Object.keys(resources[base] ?? {})) {
    const baseKeys = new Set(flatten(resources[base]?.[ns] ?? {}))
    for (const lang of others) {
      const keys = new Set(flatten(resources[lang]?.[ns] ?? {}))
      for (const k of baseKeys) if (!keys.has(k)) problems.push(`${lang}: ${ns}.${k} is missing`)
      for (const k of keys) if (!baseKeys.has(k)) problems.push(`${base}: ${ns}.${k} is missing`)
    }
  }
  return problems
}
