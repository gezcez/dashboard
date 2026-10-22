import { beforeEach, describe, expect, it, vi } from "vitest"
import { GezcezApiError } from "@/api/envelope"
import { elevationEndsAt, runWithSudo, SudoCancelledError, useSudoStore } from "./sudo"

const NOW = 1_800_000_000_000
const nowS = NOW / 1000
const stepUpRequired = () =>
  new GezcezApiError({ code: "AUTH_STEP_UP_REQUIRED", message: "", status: 403 })

beforeEach(() => {
  useSudoStore.setState({ shownFor: null, endedFor: null, pending: null })
})

describe("elevationEndsAt", () => {
  it("is ten minutes after auth_time", () => {
    expect(elevationEndsAt(nowS - 60, null, NOW)).toBe((nowS + 540) * 1000)
  })
  it("is null when stale, unknown or ended", () => {
    expect(elevationEndsAt(nowS - 601, null, NOW)).toBeNull()
    expect(elevationEndsAt(null, null, NOW)).toBeNull()
    expect(elevationEndsAt(nowS - 60, nowS - 60, NOW)).toBeNull()
  })
})

describe("runWithSudo", () => {
  it("runs at once while elevated", async () => {
    const ask = vi.fn()
    const action = vi.fn().mockResolvedValue("ok")
    await expect(runWithSudo(action, { authTime: () => nowS, now: () => NOW, ask })).resolves.toBe(
      "ok",
    )
    expect(ask).not.toHaveBeenCalled()
  })

  it("asks first when not elevated, and stops when the user cancels", async () => {
    const action = vi.fn()
    await expect(
      runWithSudo(action, {
        authTime: () => nowS - 3600,
        now: () => NOW,
        ask: () => Promise.resolve(false),
      }),
    ).rejects.toBeInstanceOf(SudoCancelledError)
    expect(action).not.toHaveBeenCalled()
  })

  it("asks again after the user ended elevation", async () => {
    useSudoStore.getState().end(nowS - 10)
    const ask = vi.fn().mockResolvedValue(true)
    await runWithSudo(() => Promise.resolve(1), {
      authTime: () => nowS - 10,
      now: () => NOW,
      ask,
    })
    expect(ask).toHaveBeenCalledOnce()
  })

  it("retries once after AUTH_STEP_UP_REQUIRED, never more", async () => {
    const ask = vi.fn().mockResolvedValue(true)
    const action = vi.fn().mockRejectedValue(stepUpRequired())
    await expect(
      runWithSudo(action, { authTime: () => nowS, now: () => NOW, ask }),
    ).rejects.toMatchObject({ code: "AUTH_STEP_UP_REQUIRED" })
    expect(action).toHaveBeenCalledTimes(2)
    expect(ask).toHaveBeenCalledOnce()
  })

  it("passes other errors through without asking", async () => {
    const ask = vi.fn()
    const boom = new GezcezApiError({ code: "NOT_FOUND", message: "", status: 404 })
    await expect(
      runWithSudo(() => Promise.reject(boom), { authTime: () => nowS, now: () => NOW, ask }),
    ).rejects.toBe(boom)
    expect(ask).not.toHaveBeenCalled()
  })
})
