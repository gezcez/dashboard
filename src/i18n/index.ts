import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enAuth from "./en/auth.json"
import enCommon from "./en/common.json"
import enDashboard from "./en/dashboard.json"
import enErrors from "./en/errors.json"
import enOps from "./en/ops.json"
import trAuth from "./tr/auth.json"
import trCommon from "./tr/common.json"
import trDashboard from "./tr/dashboard.json"
import trErrors from "./tr/errors.json"
import trOps from "./tr/ops.json"

export const LANGUAGES = ["tr", "en"] as const
export type Language = (typeof LANGUAGES)[number]

export const resources = {
  en: { common: enCommon, errors: enErrors, auth: enAuth, dashboard: enDashboard, ops: enOps },
  tr: { common: trCommon, errors: trErrors, auth: trAuth, dashboard: trDashboard, ops: trOps },
} as const

export function isLanguage(value: unknown): value is Language {
  return value === "tr" || value === "en"
}

/** `tr` when the browser prefers Turkish, else `en`. */
export function detectLanguage(
  navigatorLanguages: readonly string[] = navigator.languages,
): Language {
  return navigatorLanguages.some((l) => l.toLowerCase().startsWith("tr")) ? "tr" : "en"
}

export function initI18n(language: Language): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: "en",
      supportedLngs: LANGUAGES,
      defaultNS: "common",
      ns: ["common", "errors", "auth", "dashboard", "ops"],
      interpolation: { escapeValue: false },
      returnNull: false,
      initAsync: false,
      showSupportNotice: false,
    })
  } else if (i18n.language !== language) {
    void i18n.changeLanguage(language)
  }
  document.documentElement.lang = language
  return i18n
}

export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language)
  document.documentElement.lang = language
}

export { i18n }
