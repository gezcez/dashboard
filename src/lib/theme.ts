import { useEffect, useSyncExternalStore } from "react"
import { usePrefs, type ThemePref } from "./prefs-store"

const query = () => window.matchMedia("(prefers-color-scheme: dark)")

function subscribeSystem(cb: () => void) {
  const mq = query()
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): "light" | "dark" {
  return pref === "system" ? (systemDark ? "dark" : "light") : pref
}

/** The theme actually shown, following the OS when the preference is "system". */
export function useResolvedTheme(): "light" | "dark" {
  const pref = usePrefs((s) => s.theme)
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => query().matches,
    () => false,
  )
  return resolveTheme(pref, systemDark)
}

/** Keeps the `.dark` class on <html> in sync (public/theme-init.js does it before first paint). */
export function useApplyTheme(): void {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])
}
