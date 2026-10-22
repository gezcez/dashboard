import { execSync } from "node:child_process"
import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { parseEnv } from "./src/env.schema"

function gitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {
    return "unknown"
  }
}

/** Emits /version.json so ops can see which build is live. */
function versionJson(sha: string, envName: string): Plugin {
  return {
    name: "gezcez-version-json",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ sha, env: envName, built_at: new Date().toISOString() }, null, 2),
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Fail the build (and dev server) early when a variable is missing or malformed.
  const env = parseEnv(loadEnv(mode, process.cwd(), "VITE_"))
  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? gitSha()

  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      versionJson(sha, env.VITE_ENV),
    ],
    define: {
      __BUILD_SHA__: JSON.stringify(sha),
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            tanstack: ["@tanstack/react-router", "@tanstack/react-query"],
          },
        },
      },
    },
  }
})
