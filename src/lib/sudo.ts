import { create } from "zustand"
import { isApiError } from "@/api/envelope"

/** Backend sudo window (x-gezcez-sudo): `auth_time` must be at most this old. */
export const SUDO_MAX_AGE_S = 600

interface PendingStepUp {
  resolve: (elevated: boolean) => void
}

interface SudoState {
  /** auth_time of the step-up done in this tab; the top-bar pill shows while it is fresh. */
  shownFor: number | null
  /** auth_time the user ended early. Elevation is a local flag; the backend has no step-down. */
  endedFor: number | null
  pending: PendingStepUp | null
  markElevated: (authTime: number) => void
  end: (authTime: number) => void
  setPending: (pending: PendingStepUp | null) => void
}

export const useSudoStore = create<SudoState>()((set) => ({
  shownFor: null,
  endedFor: null,
  pending: null,
  markElevated: (authTime) => {
    set({ shownFor: authTime, endedFor: null })
  },
  end: (authTime) => {
    set({ endedFor: authTime, shownFor: null })
  },
  setPending: (pending) => {
    set({ pending })
  },
}))

/** When the elevation for `authTime` (unix s) runs out, in ms, or null when not elevated. */
export function elevationEndsAt(
  authTime: number | null | undefined,
  endedFor: number | null,
  nowMs: number,
): number | null {
  if (!authTime || authTime === endedFor) return null
  const ends = (authTime + SUDO_MAX_AGE_S) * 1000
  // A few seconds of margin so we never start an action that the server then refuses.
  return ends - 5_000 > nowMs ? ends : null
}

/** Thrown when the user closes the step-up dialog or popup. Callers stay silent on it. */
export class SudoCancelledError extends Error {
  readonly cancelled = true

  constructor() {
    super("step-up cancelled")
    this.name = "SudoCancelledError"
  }
}

export function isSudoCancelled(error: unknown): error is SudoCancelledError {
  return error instanceof SudoCancelledError
}

export interface SudoDeps {
  /** auth_time of the current access token (unix s). */
  authTime: () => number | null
  now?: () => number
  /** Shows the step-up dialog; resolves true once elevated, false when cancelled. */
  ask?: () => Promise<boolean>
}

function askViaDialog(): Promise<boolean> {
  return new Promise((resolve) => {
    useSudoStore.getState().pending?.resolve(false)
    useSudoStore.getState().setPending({ resolve })
  })
}

/**
 * Runs a sudo action (backend 6.4 `x-gezcez-sudo`). Not elevated: ask first (the popup needs the
 * dialog's click). Server says AUTH_STEP_UP_REQUIRED anyway (clock skew, revoked session): ask
 * once more and retry once; a second refusal surfaces as the error. Never loops.
 */
export async function runWithSudo<T>(action: () => Promise<T>, deps: SudoDeps): Promise<T> {
  const now = deps.now ?? Date.now
  const ask = deps.ask ?? askViaDialog
  const elevated = () =>
    elevationEndsAt(deps.authTime(), useSudoStore.getState().endedFor, now()) !== null

  if (!elevated() && !(await ask())) throw new SudoCancelledError()
  try {
    return await action()
  } catch (error) {
    if (!isApiError(error, "AUTH_STEP_UP_REQUIRED")) throw error
    if (!(await ask())) throw new SudoCancelledError()
    return action()
  }
}
