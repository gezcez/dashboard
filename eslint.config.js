import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import i18next from "eslint-plugin-i18next"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "playwright-report",
      "test-results",
      "public/mockServiceWorker.js",
      "src/routeTree.gen.ts",
      "src/api/*.gen.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-nocheck": true, "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/only-throw-error": [
        "error",
        // TanStack Router control flow: `throw redirect()` / `throw notFound()`.
        {
          allow: [
            {
              from: "package",
              package: "@tanstack/router-core",
              name: ["Redirect", "NotFoundError"],
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Render user and server strings as text. dangerouslySetInnerHTML is banned.",
        },
        {
          selector:
            "MemberExpression[object.object.name='import'][object.property.name='meta'][property.name='env']",
          message: "Read environment variables through src/env.ts.",
        },
      ],
    },
  },
  {
    files: ["src/env.ts", "src/vite-env.d.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // UI strings go through t() in pages and shell components.
    files: [
      "src/routes/**/*.tsx",
      "src/features/**/*.tsx",
      "src/components/shell/**/*.tsx",
      "src/components/states/**/*.tsx",
    ],
    ignores: ["src/routes/ui-kit.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-text-only",
          "jsx-attributes": { include: ["title", "aria-label", "placeholder", "alt"] },
        },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.ts", "src/mocks/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "i18next/no-literal-string": "off",
    },
  },
  {
    files: ["scripts/**/*.ts", "*.config.{ts,js}", "tests/e2e/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier,
)
