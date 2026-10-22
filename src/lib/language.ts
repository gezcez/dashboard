import { useCallback } from "react"
import { setLanguage, type Language } from "@/i18n"
import { callApi } from "./api"
import { usePrefs } from "./prefs-store"

/** Switches the UI language, remembers it locally and saves it to the account (best effort). */
export function useChangeLanguage() {
  const save = usePrefs((s) => s.setLanguage)
  return useCallback(
    (language: Language) => {
      save(language)
      void setLanguage(language)
      void callApi("patch", "/v1/me", { body: { locale: language } }).catch(() => undefined)
    },
    [save],
  )
}
