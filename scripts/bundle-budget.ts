// Fails when the JS loaded by index.html (entry plus its static imports) exceeds the budget.
import { readFile } from "node:fs/promises"
import { gzipSync } from "node:zlib"

const BUDGET = 250 * 1024
const html = await readFile("dist/index.html", "utf8")
const files = new Set<string>()
for (const m of html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)) if (m[1]) files.add(m[1])

let total = 0
for (const file of files) {
  const size = gzipSync(await readFile(`dist/${file}`)).length
  total += size
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KB  ${file}`)
}
console.log(
  `${(total / 1024).toFixed(1).padStart(7)} KB  initial JS (gzip), budget ${BUDGET / 1024} KB`,
)
if (total > BUDGET) {
  console.error("Bundle budget exceeded.")
  process.exit(1)
}
