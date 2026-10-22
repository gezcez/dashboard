// CI guard: every backend error code has tr and en text, and both catalogs have the same keys.
import { readdir, readFile } from "node:fs/promises"
import { checkCatalogs } from "../src/i18n/check"

const root = new URL("../src/i18n/", import.meta.url)
const resources: Parameters<typeof checkCatalogs>[0] = {}
for (const lang of ["en", "tr"]) {
  resources[lang] = {}
  for (const file of await readdir(new URL(`${lang}/`, root))) {
    if (!file.endsWith(".json")) continue
    resources[lang][file.replace(/\.json$/, "")] = JSON.parse(
      await readFile(new URL(`${lang}/${file}`, root), "utf8"),
    ) as Record<string, never>
  }
}

const problems = checkCatalogs(resources)
if (problems.length) {
  console.error(`i18n:check found ${problems.length} problem(s):\n  ${problems.join("\n  ")}`)
  process.exit(1)
}
console.log("i18n:check ok")
