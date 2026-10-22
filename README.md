# gezcez dashboard

Operations console for gezcez at **dash.gezcez.com**: identity admin, transit catalogue, VTS tracker
operations, live vehicles and analytics. Static SPA (Vite, React 19, TypeScript strict) on Cloudflare
Workers static assets.

This repo is standalone: no monorepo, no shared gezcez packages. It owns its auth client
(`src/auth/`), generated API types and query wrappers (`src/api/`), shadcn components
(`src/components/ui/`), brand tokens (`src/styles/tokens.css`) and tr/en catalogs (`src/i18n/`).

## Quick start

```sh
bun install
bun run dev:mock     # no backend needed: MSW mocks + persona sign-in at http://localhost:5173
bun run dev          # against VITE_API_URL from .env.development (local backend)
```

## Scripts

| Script                                        | What it does                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `dev` / `dev:mock`                            | Vite dev server, live API or MSW mock mode                                |
| `build` / `build:mock`                        | Typecheck, then production build (`--mode mock` for previews and e2e)     |
| `typecheck`, `lint`, `format`, `format:check` | `tsc -b`, ESLint (type-aware), Prettier                                   |
| `test`                                        | Vitest + Testing Library + MSW (node)                                     |
| `e2e`                                         | Playwright smoke against `vite preview` of a mock build                   |
| `api:gen [source]`                            | Regenerate `src/api/*.gen.ts` from the backend's `openapi.json`           |
| `api:check [source]`                          | Fail when the committed `*.gen.ts` files differ from the spec             |
| `i18n:check`                                  | Every backend error code has tr and en text; tr and en have the same keys |

## Environment

All variables are validated with zod in `vite.config.ts` (the build fails on a missing variable)
and again at boot (`src/env.ts`). There is no hard-coded environment anywhere. Modes:
`.env.development`, `.env.mock`, `.env.staging`, `.env.production`; per-machine overrides go in
`.env.<mode>.local` (git-ignored). See `.env.example`.

| Variable                                      | Example                                           |
| --------------------------------------------- | ------------------------------------------------- |
| `VITE_ENV`                                    | `production`, `staging`, `development`, `preview` |
| `VITE_API_MODE`                               | `live` or `mock`                                  |
| `VITE_API_URL`                                | `https://api.gezcez.com`                          |
| `VITE_OAUTH_URL`                              | `https://oauth.gezcez.com`                        |
| `VITE_WS_URL`                                 | `wss://api.gezcez.com/v1/ws`                      |
| `VITE_CLIENT_ID`                              | `dashboard` (`dashboard-dev` on localhost)        |
| `VITE_MAP_STYLE_LIGHT`, `VITE_MAP_STYLE_DARK` | map style URLs (default OpenFreeMap)              |

## App structure

- **Routes** (`src/routes/`, file-based): `/login`, `/auth/callback`, `/auth/step-up` (popup),
  `/auth/logged-out`, and the signed-in shell `_app` with `/` (redirects to your first network or
  the platform overview), `/n/$network/...` (network-scoped pages, network in the URL) and
  `/admin/...` (platform pages). `/ui-kit` is a dev-only component gallery.
- **Pages and permissions** (`src/lib/pages.ts`): one table lists every page with its permission
  key and scope. The sidebar, the command palette (Ctrl+K), the `/` redirect and each route's
  `beforeLoad` guard read it, so hidden nav and blocked routes cannot disagree. A blocked route
  renders a 403 in place that names the missing permission.
- **Shell** (`src/components/shell/`): navy sidebar, network switcher, breadcrumbs, theme toggle,
  user menu (language, theme, sign out), session-expired banner.

## Mock mode

`bun run dev:mock` (or `build:mock` + `preview`) runs the whole app with no backend. MSW
(`src/mocks/`) serves the API from fixtures and enforces each operation's permission and sudo rule
from the generated `OPERATION_AUTH`. `/mock/authorize` stands in for oauth.gezcez.com with a
persona picker (PKCE is still verified):

| Persona       | Roles                                 | Lands on                   |
| ------------- | ------------------------------------- | -------------------------- |
| phasenull     | root                                  | system overview            |
| Elif Kaya     | network admin in Kocaeli              | `/n/kocaeli`               |
| Murat Demir   | analyst in Kocaeli, viewer in Sakarya | `/n/kocaeli`, 403 on admin |
| Zeynep Arslan | global moderator (users, audit)       | platform pages             |

The mock refresh "cookie" lives in localStorage (`gz.mock.session`). Outside mock mode the
`/mock/*` routes are 404s and MSW is never started.

## API types (`src/api/`)

Every request goes through `openapi-fetch` over `src/api/schema.gen.ts`, generated by
`openapi-typescript` from the backend's `/openapi.json` and committed. `bun run api:gen` also
writes `permission-keys.gen.ts` (the `PermissionKey` union plus `OPERATION_AUTH`, read from the
`x-gezcez-permission` / `x-gezcez-sudo` extensions) and `error-codes.gen.ts` (the `ErrorCode`
enum, which the `errors` i18n namespace must cover).

```sh
bun run api:gen                                   # $API_SPEC, else $VITE_API_URL/openapi.json, else staging
bun run api:gen http://localhost:3000/openapi.json
bun run api:check openapi/stub.openapi.json       # what CI runs today
```

> **The backend has not published its OpenAPI yet.** The current `*.gen.ts` files are generated
> from `openapi/stub.openapi.json`, a hand-written stub of `/v1/me` and a few `/v1/dash/*`
> endpoints following backend.md (sections 3.3, 6.4, 7.0, 7.2). Regenerate against the real spec
> as soon as it exists, delete the stub, and point CI's `API_SPEC` at staging.

`src/api/query.ts` has the thin TanStack Query wrappers: `apiQueryOptions(client, path, init)`
and `apiCall(client, method, path, init)` unwrap the `{ ok, data }` envelope and throw a typed
`GezcezApiError { code, message, status, details, requestId }`. Query keys are
`["api", path, params]` and never contain tokens. Mutations get an `Idempotency-Key`.

## Auth (`src/auth/`)

The dashboard's own implementation of the oauth plan's "client integration contract" (oauth.md
section 9); nothing is imported from another repo.

- Authorization Code + PKCE (S256) with `state`; the transaction lives in `sessionStorage` under
  `gz.auth.txn.<state>` for at most 10 minutes. `/auth/callback` strips `code`/`state` with
  `history.replaceState` before exchanging, and `returnTo` must pass `safeInternalPath`.
- Access token in memory only. The refresh token is the HttpOnly `gz_rt` cookie
  (`Path=/v1/oauth`), so refresh and revoke are `credentials: "include"` posts with no token in JS.
- Refresh is single-flight in the tab and serialised across tabs with
  `navigator.locks.request("gz.auth.refresh.<clientId>")` (localStorage lease fallback), scheduled
  at `exp - 60 s`, paused while the tab is hidden. `BroadcastChannel("gz.auth")` propagates
  sign-out. `invalid_grant` signs out; network errors never do.
- `auth.fetch` adds the bearer token, retries a 401 `AUTH_TOKEN_EXPIRED` once, and emits
  `step_up_required` on a 403 `AUTH_STEP_UP_REQUIRED` without retrying.
- `auth.stepUp()` opens `/authorize?max_age=600` in a popup that returns to `/auth/step-up`
  (strict `postMessage` origin check, BroadcastChannel backup), falling back to a redirect.
- `auth.logout()` revokes, wipes memory and the query cache, broadcasts, then goes to
  `oauth.gezcez.com/logout` with the registered post-logout URI. The next login uses
  `prompt=select_account`.
- `requireAuth` (route `beforeLoad`), `<RequirePermission>` and `usePermission` (permission
  lookup injected by the app from `GET /v1/me`).

The RFC 7636 Appendix B vector and the contract's test vectors and race rules (9.8) run as
Vitest tests in `src/auth/*.test.ts`.

## Brand

Same brand as www.gezcez.com, copied by hand into `src/styles/tokens.css` (Tailwind v4 `@theme`):
cream `#fffbeb`, navy `#172554`, amber-600 `#d97706`, amber-700 `#b45309`, amber-400 `#fbbf24`,
yellow-400 to amber-500 gradient, Inter (self-hosted), rounded-2xl cards, pill buttons, no
shadows. The dashboard is the denser variant (14 px base, 36 px table rows) with a navy dark
mode. `/ui-kit` shows every component (not available in production builds).

## Deploy

`wrangler.jsonc` serves `dist/` as static assets with SPA fallback
(`not_found_handling: "single-page-application"`); `public/_headers` sets CSP, HSTS and cache rules.
