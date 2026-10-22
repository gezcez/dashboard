import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { generate, resolveSource } from "./api-gen-lib"

const source = resolveSource(process.argv)
const files = await generate(source)
for (const [path, content] of Object.entries(files)) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
  console.log(`wrote ${path}`)
}
console.log(`api:gen done from ${source}`)
