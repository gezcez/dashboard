import { readFile } from "node:fs/promises"
import openapiTS, { astToString } from "openapi-typescript"

/**
 * Shared by api-gen.ts and api-check.ts.
 *
 * Source resolution, first match wins:
 *   1. the first CLI argument (a URL or a local path to openapi.json)
 *   2. API_SPEC (URL or path)
 *   3. VITE_API_URL + "/openapi.json"
 *   4. https://api-staging.gezcez.com/openapi.json
 *
 * Until the backend publishes its spec, use the hand-written stub:
 *   bun run api:gen openapi/stub.openapi.json
 */
export function resolveSource(argv: string[]): string {
  const fromArg = argv[2]
  if (fromArg) return fromArg
  if (process.env.API_SPEC) return process.env.API_SPEC
  if (process.env.VITE_API_URL) return `${process.env.VITE_API_URL.replace(/\/$/, "")}/openapi.json`
  return "https://api-staging.gezcez.com/openapi.json"
}

type JsonObject = Record<string, unknown>

export type OpenApiDoc = {
  info?: { title?: string; version?: string }
  paths?: Record<string, Record<string, JsonObject | undefined>>
  components?: { schemas?: Record<string, { enum?: unknown[] } | undefined> }
}

export async function loadSpec(source: string): Promise<OpenApiDoc> {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, { headers: { accept: "application/json" } })
    if (!res.ok) throw new Error(`GET ${source} failed: ${res.status} ${res.statusText}`)
    return (await res.json()) as OpenApiDoc
  }
  return JSON.parse(await readFile(source, "utf8")) as OpenApiDoc
}

const METHODS = ["get", "put", "post", "delete", "patch"] as const

function header(source: string, doc: OpenApiDoc): string {
  const version = `${doc.info?.title ?? "api"} ${doc.info?.version ?? ""}`.trim()
  return [
    "/**",
    " * GENERATED FILE, DO NOT EDIT. Run `bun run api:gen` to regenerate.",
    ` * Source: ${source.includes("://") ? source : source.replace(/\\/g, "/")}`,
    ` * Spec: ${version}`,
    ...(/stub/i.test(version)
      ? [
          " * STUB: generated from the hand-written openapi/stub.openapi.json. Regenerate against the",
          " * backend's published openapi.json as soon as it exists, then delete the stub.",
        ]
      : []),
    " */",
    "",
  ].join("\n")
}

function stringEnum(doc: OpenApiDoc, name: string): string[] {
  const values = doc.components?.schemas?.[name]?.enum ?? []
  return values.filter((v): v is string => typeof v === "string")
}

export type OperationAuth = { key: string; scope: "global" | "network"; sudo: boolean }

export function collectOperationAuth(doc: OpenApiDoc): Record<string, OperationAuth> {
  const out: Record<string, OperationAuth> = {}
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const method of METHODS) {
      const op = item[method]
      if (!op) continue
      const perm = op["x-gezcez-permission"] as { key?: string; scope?: string } | undefined
      if (!perm?.key) continue
      out[`${method.toUpperCase()} ${path}`] = {
        key: perm.key,
        scope: perm.scope === "network" ? "network" : "global",
        sudo: op["x-gezcez-sudo"] === true,
      }
    }
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
}

const lit = (values: string[]) =>
  values.length ? values.map((v) => JSON.stringify(v)).join(" | ") : "never"

export async function generate(source: string): Promise<Record<string, string>> {
  const doc = await loadSpec(source)
  const head = header(source, doc)

  // openapi-typescript takes the parsed document so URL and file sources behave the same.
  const ast = await openapiTS(doc as Parameters<typeof openapiTS>[0], { alphabetize: true })
  const schema = head + astToString(ast)

  const operationAuth = collectOperationAuth(doc)
  const permissionKeys = [
    ...new Set([
      ...stringEnum(doc, "PermissionKey"),
      ...Object.values(operationAuth).map((o) => o.key),
    ]),
  ].sort()
  const permissions =
    head +
    `export const PERMISSION_KEYS = ${JSON.stringify(permissionKeys, null, 2)} as const\n\n` +
    `export type PermissionKey = ${lit(permissionKeys)}\n\n` +
    "/** `METHOD /path` to the permission and step-up flag the backend enforces (x-gezcez-permission, x-gezcez-sudo). */\n" +
    `export const OPERATION_AUTH = ${JSON.stringify(operationAuth, null, 2)} as const satisfies Record<string, { key: PermissionKey; scope: "global" | "network"; sudo: boolean }>\n`

  const errorCodes = stringEnum(doc, "ErrorCode").sort()
  const errors =
    head +
    `export const ERROR_CODES = ${JSON.stringify(errorCodes, null, 2)} as const\n\n` +
    `export type ErrorCode = ${lit(errorCodes)}\n`

  return {
    "src/api/schema.gen.ts": schema,
    "src/api/permission-keys.gen.ts": permissions,
    "src/api/error-codes.gen.ts": errors,
  }
}
