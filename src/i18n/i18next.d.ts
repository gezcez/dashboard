import "i18next"
import type auth from "./en/auth.json"
import type common from "./en/common.json"
import type dashboard from "./en/dashboard.json"
import type errors from "./en/errors.json"

// Typed keys: a missing or misspelled key is a compile error. `en` is the source catalog.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof common
      errors: typeof errors
      auth: typeof auth
      dashboard: typeof dashboard
    }
  }
}
