import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createRef, type ReactNode } from "react"
import { standardTheme } from "@phreshos/core"
import { Button, ThemeProvider } from "../source/main.js"

afterEach(cleanup)

describe("Button", function () {
  it("renders a native non-submitting button", function () {
    renderButton(<Button onPress={() => undefined}>Continue</Button>)

    expect(screen.getByRole("button", { name: "Continue" }).getAttribute("type")).toBe("button")
  })

  it("normalizes pointer, Enter, and Space activation", async function () {
    const onPress = vi.fn()
    const user = userEvent.setup()

    renderButton(<Button onPress={onPress}>Continue</Button>)

    const button = screen.getByRole("button", { name: "Continue" })

    await user.click(button)
    button.focus()
    await user.keyboard("[Enter]")
    await user.keyboard("[Space]")

    expect(onPress).toHaveBeenCalledTimes(3)
  })

  it("does not activate while disabled", async function () {
    const onPress = vi.fn()

    renderButton(<Button disabled onPress={onPress}>Continue</Button>)

    await userEvent.setup().click(screen.getByRole("button", { name: "Continue" }))

    expect(onPress).not.toHaveBeenCalled()
  })

  it("remains focusable but does not activate while pending", async function () {
    const onPress = vi.fn()

    renderButton(<Button pending onPress={onPress}>Continue</Button>)

    const button = screen.getByRole("button", { name: "Continue" })

    button.focus()
    await userEvent.setup().keyboard("[Enter]")

    expect(document.activeElement).toBe(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it("derives spacing and radius from the supplied Theme", function () {
    renderButton(<Button size="xlarge" radius="xsmall">Continue</Button>)

    const button = screen.getByRole("button", { name: "Continue" })

    expect(button.style.paddingInline).toBe(`${standardTheme.spacing * 2 * 2 / 3}px`)
    expect(button.style.borderRadius).toBe(`${standardTheme.radius * 0.25}px`)
    expect(button.style.color).toBe("rgb(24, 52, 71)")
    expect(button.style.fontSize).toBe("14px")
  })

  it("forwards its native button reference", function () {
    const ref = createRef<HTMLButtonElement>()

    renderButton(<Button ref={ref}>Continue</Button>)

    expect(ref.current).toBe(screen.getByRole("button", { name: "Continue" }))
  })
})

function renderButton(button: ReactNode) {
  return render(<ThemeProvider theme={standardTheme}>{button}</ThemeProvider>)
}
