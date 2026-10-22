import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./button"

describe("Button", () => {
  it("renders a pill button and handles clicks", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Pause provider</Button>)
    const button = screen.getByRole("button", { name: "Pause provider" })
    expect(button.className).toContain("rounded-full")
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("renders as its child with asChild", () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    )
    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("href", "/x")
  })
})
