import { readFile } from "node:fs/promises"
import { generate, resolveSource } from "./api-gen-lib"

// Regenerates in memory and fails when the committed *.gen.ts files differ (contract drift).
const source = resolveSource(process.argv)
const files = await generate(source)
const drift: string[] = []
for (const [path, content] of Object.entries(files)) {
  const committed = await readFile(path, "utf8").catch(() => "")
  if (committed !== content) drift.push(path)
}
if (drift.length) {
  console.error(`api:check: generated files differ from ${source}:\n  ${drift.join("\n  ")}`)
  console.error("Run `bun run api:gen` (same source) and commit the result.")
  process.exit(1)
}
console.log(`api:check ok (${source})`)
