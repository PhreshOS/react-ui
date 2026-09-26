import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { createRef, type ReactNode } from "react"
import { Button, defaultAppearance, UIProvider, type ButtonColor, type ButtonProps, type ScaleLevel } from "../source/main.js"
import { mixColor, readableColor } from "../source/foundation/color.js"
import { cssColor, lifted, paintDeclarations, surfaceFill } from "./support/paint.js"

afterEach(cleanup)

const colors = defaultAppearance.colors.light

describe("Button", function () {
  it("accepts the shared color and size contracts", function () {
    expectTypeOf<ButtonProps["color"]>().toEqualTypeOf<ButtonColor | undefined>()
    expectTypeOf<"primary">().toExtend<ButtonColor>()
    expectTypeOf<"primary:soft">().toExtend<ButtonColor>()
    expectTypeOf<ButtonProps["size"]>().toEqualTypeOf<ScaleLevel | undefined>()
  })

  it("renders one native non-submitting button", function () {
    renderButton(<Button onPress={() => undefined}>Continue</Button>)
    const button = screen.getByRole("button", { name: "Continue" })
    expect(button.getAttribute("type")).toBe("button")
    expect(button.querySelector("*")).toBeNull()
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

  it("is a raised neutral Surface by default", function () {
    renderButton(<Button>Continue</Button>)
    const paint = paintDeclarations(screen.getByRole("button"))
    expect(paint["--phreshos-surface-paint"]).toBe(colors.default)
    expect(lifted(paint["box-shadow"])).toBe(true)
  })

  it.each(["primary", "secondary", "success", "warning", "danger", "info"] as const)("paints %s with its readable content color", function (role) {
    renderButton(<Button color={role}>Continue</Button>)
    const paint = paintDeclarations(screen.getByRole("button"))
    expect(paint["--phreshos-surface-paint"]).toBe(colors[role])
    expect(paint.color).toBe(cssColor(readableColor(colors[role], colors)))
  })

  it("accepts a CSS color that the browser resolves", async function () {
    renderButton(<Button color="var(--brand)">Continue</Button>)
    const button = screen.getByRole("button")
    expect(surfaceFill(button)).toBe("var(--brand)")
    await userEvent.setup().hover(button)
    expect(surfaceFill(button)).toContain("var(--brand)")
    expect(surfaceFill(button)).toContain("color-mix")
  })

  it.each<[ScaleLevel, number, string]>([
    ["xsmall", 25, "0.6875em"], ["small", 28, "0.75em"], ["medium", 34, "0.8125em"], ["large", 40, "0.875em"], ["xlarge", 46, "0.9375em"]
  ])("derives the %s size from Appearance spacing", function (size, height, fontSize) {
    renderButton(<Button size={size}>Continue</Button>)
    const button = screen.getByRole("button")
    expect(button.style.height).toBe(`${height}px`)
    expect(button.style.fontSize).toBe(fontSize)
  })

  it("moves toward its content color on hover, settles on press, and keeps its label color", async function () {
    const user = userEvent.setup()
    renderButton(<Button color="primary">Continue</Button>)
    const button = screen.getByRole("button")
    const text = paintDeclarations(button).color
    await user.hover(button)
    expect(surfaceFill(button)).toBe(mixColor(colors.primary, colors.foreground, 0.05))
    await user.pointer({ target: button, keys: "[MouseLeft>]" })
    expect(surfaceFill(button)).toBe(mixColor(colors.primary, colors.foreground, 0.1))
    expect(lifted(paintDeclarations(button)["box-shadow"])).toBe(false)
    expect(button.style.scale).toBe("0.97")
    expect(paintDeclarations(button).color).toBe(text)
    await user.pointer({ keys: "[/MouseLeft]" })
    await user.unhover(button)
    expect(surfaceFill(button)).toBe(colors.primary)
  })

  it("rings keyboard focus", async function () {
    renderButton(<Button>Continue</Button>)
    await userEvent.setup().tab()
    expect(paintDeclarations(screen.getByRole("button")).outline).toContain(colors.primary)
  })

  it.each(["disabled", "pending"] as const)("keeps the %s fill unchanged on hover", async function (state) {
    renderButton(<Button color="primary" disabled={state === "disabled"} pending={state === "pending"}>Continue</Button>)
    const button = screen.getByRole("button")
    const fill = surfaceFill(button)
    await userEvent.setup().hover(button)
    expect(surfaceFill(button)).toBe(fill)
  })

  it("follows the nearest Appearance and Theme", function () {
    const appearance = { colors: { light: { primary: "#aabbcc" }, dark: { primary: "#334455" } } }
    const view = render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}><Button color="primary">Continue</Button></UIProvider>)
    expect(surfaceFill(screen.getByRole("button"))).toBe("#aabbcc")
    view.rerender(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: true }}><Button color="primary">Continue</Button></UIProvider>)
    expect(surfaceFill(screen.getByRole("button"))).toBe("#334455")
  })

  it("forwards its native button reference", function () {
    const ref = createRef<HTMLButtonElement>()
    renderButton(<Button ref={ref}>Continue</Button>)
    expect(ref.current).toBe(screen.getByRole("button", { name: "Continue" }))
  })

  it("honors native layout styles without changing activation or paint", async function () {
    const onPress = vi.fn()
    renderButton(<Button onPress={onPress} style={{ height: "auto", display: "grid", width: "100%" }}>Task</Button>)
    const button = screen.getByRole("button")
    expect(button.style.height).toBe("auto")
    expect(button.style.display).toBe("grid")
    expect(surfaceFill(button)).toBe(colors.default)
    await userEvent.setup().click(button)
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

function renderButton(button: ReactNode) {
  return render(<UIProvider preferences={{ theme: "light", animations: true }}>{button}</UIProvider>)
}
