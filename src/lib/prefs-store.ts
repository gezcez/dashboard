import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import type { Language } from "@/i18n"

export type ThemePref = "system" | "light" | "dark"

interface PrefsState {
  theme: ThemePref
  language: Language | null
  sidebarCollapsed: boolean
  lastNetwork: string | null
  setTheme: (theme: ThemePref) => void
  setLanguage: (language: Language) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLastNetwork: (slug: string) => void
}

/** localStorage behind try/catch: private windows and blocked storage must not break the app. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // ignore
    }
  },
}

/** UI preferences only (never server data). Key mirrored in public/theme-init.js. */
export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: "system",
      language: null,
      sidebarCollapsed: false,
      lastNetwork: null,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLastNetwork: (lastNetwork) => set({ lastNetwork }),
    }),
    {
      name: "gz.dash.prefs",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ theme, language, sidebarCollapsed, lastNetwork }) => ({
        theme,
        language,
        sidebarCollapsed,
        lastNetwork,
      }),
    },
  ),
)
