import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ConfirmDialog, typedMatches } from "./confirm-dialog"

describe("ConfirmDialog", () => {
  it("needs a reason and the typed name before confirming (L3)", async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={() => undefined}
        title="Rotate secret"
        effect="The old secret stops working."
        confirmLabel="Rotate"
        reasonLabel="Reason"
        typeToConfirm="kocaeli-open-data"
        onConfirm={onConfirm}
      />,
    )
    const button = screen.getByRole("button", { name: "Rotate" })
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Reason"), "Leaked in a log")
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Type the name/), "kocaeli-open-dat")
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Type the name/), "a")
    expect(button).toBeEnabled()
    await userEvent.click(button)
    expect(onConfirm).toHaveBeenCalledWith("Leaked in a log")
  })

  it("matches the typed name exactly", () => {
    expect(typedMatches(" kocaeli ", "kocaeli")).toBe(true)
    expect(typedMatches("Kocaeli", "kocaeli")).toBe(false)
  })
})
