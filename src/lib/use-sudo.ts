import { useCallback } from "react"
import { useAuth } from "@/auth/react"
import { runWithSudo } from "./sudo"

/** `runWithSudo` bound to the signed-in session: `const sudo = useSudo(); sudo(() => callApi(...))`. */
export function useSudo() {
  const auth = useAuth()
  return useCallback(
    <T>(action: () => Promise<T>) =>
      runWithSudo(action, { authTime: () => auth.claims()?.authTime ?? null }),
    [auth],
  )
}
