import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { createRef, type ReactNode } from "react"
import { standardAppearance } from "@phreshos/core"
import { AppearanceProvider, Button, type ButtonColor, type ButtonProps, type ScaleLevel } from "../source/main.js"
import { colorShade, opaqueColor, solidColors } from "../source/color.js"

afterEach(cleanup)

describe("Button", function () {
  it("accepts only semantic palette keys and the shared size scale", function () {
    expectTypeOf<ButtonProps["color"]>().toEqualTypeOf<"primary" | "secondary" | "success" | "warning" | "danger" | "info" | undefined>()
    expectTypeOf<ButtonProps["size"]>().toEqualTypeOf<ScaleLevel | undefined>()
  })
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

    expect(button.style.paddingInline).toBe(`${standardAppearance.spacing.light * 2}px`)
    expect(button.style.borderRadius).toBe(`${standardAppearance.radius.light * 0.25}px`)
    expect(button.style.color).toBe("rgb(24, 52, 71)")
    expect(button.style.fontSize).toBe("15px")
  })

  it("uses shared Surface material with a neutral control color by default", function () {
    renderButton(<Button>Continue</Button>)
    const button = screen.getByRole("button")
    expect(materialColor(button)).toBe(cssBackground(colorShade(standardAppearance.background.light, 0.08)))
    expect(button.style.background).toBe("transparent")
    expect(button.style.height).toBe("36px")
    expect(button.style.fontSize).toBe("13px")
    expect(button.style.boxShadow).toBe("")
    expect(button.style.transform).toBe("")
    expect(button.style.backgroundImage).toBe("none")
  })

  it.each<ButtonColor>(["primary", "secondary", "success", "warning", "danger", "info"])("uses Appearance's %s color", function (color) {
    renderButton(<Button color={color}>Continue</Button>)
    const button = screen.getByRole("button")
    const paint = solidColors(standardAppearance[color].light, standardAppearance.background.light, standardAppearance.foreground.light).rest
    expect(materialColor(button)).toBe(cssBackground(paint.background))
    const expected = document.createElement("span")
    expected.style.color = paint.color
    expect(button.style.color).toBe(expected.style.color)
    expect(button.hasAttribute("color")).toBe(false)
  })

  it.each<[ScaleLevel, number, number]>([
    ["xsmall", 27, 11], ["small", 30, 12], ["medium", 36, 13], ["large", 42, 14], ["xlarge", 48, 15]
  ])("derives the %s size without scaling content", function (size, height, fontSize) {
    renderButton(<Button size={size}>Continue</Button>)
    const button = screen.getByRole("button")
    expect(button.style.height).toBe(`${height}px`)
    expect(button.style.fontSize).toBe(`${fontSize}px`)
    expect(button.style.transform).toBe("")
  })

  it("updates its material color on hover and press without changing geometry", async function () {
    const user = userEvent.setup()
    renderButton(<Button color="primary">Continue</Button>)
    const button = screen.getByRole("button")
    const paints = solidColors(standardAppearance.primary.light, standardAppearance.background.light, standardAppearance.foreground.light)
    await user.hover(button)
    expect(materialColor(button)).toBe(cssBackground(paints.hover.background))
    await user.pointer({ target: button, keys: "[MouseLeft>]" })
    expect(materialColor(button)).toBe(cssBackground(paints.pressed.background))
    expect(button.style.height).toBe("36px")
    expect(button.style.transform).toBe("")
    await user.pointer({ keys: "[/MouseLeft]" })
    await user.unhover(button)
    expect(materialColor(button)).toBe(cssBackground(paints.rest.background))
  })

  it("shows an outline for keyboard focus", async function () {
    renderButton(<Button>Continue</Button>)
    await userEvent.setup().tab()
    const button = screen.getByRole("button")
    expect(document.activeElement).toBe(button)
    expect(button.style.outline).toBe(`2px solid ${standardAppearance.foreground.light}`)
    expect(button.style.boxShadow).toBe("")
  })

  it.each(["disabled", "pending"] as const)("keeps the %s fill unchanged on hover", async function (state) {
    renderButton(<Button color="primary" disabled={state === "disabled"} pending={state === "pending"}>Continue</Button>)
    const button = screen.getByRole("button")
    const background = materialColor(button)
    await userEvent.setup().hover(button)
    expect(materialColor(button)).toBe(background)
  })

  it("resolves the nearest palette and updates when the theme changes", function () {
    const appearance = {
      ...standardAppearance,
      background: { light: "#101820", dark: "#faf0e0" },
      foreground: { light: "#faf0e0", dark: "#101820" },
      primary: { light: "#aabbcc", dark: "#334455" }
    }
    const view = render(<AppearanceProvider appearance={standardAppearance} theme="light">
      <AppearanceProvider appearance={appearance} theme="light"><Button color="primary">Continue</Button></AppearanceProvider>
    </AppearanceProvider>)
    expect(materialColor(screen.getByRole("button"))).toBe(cssBackground(opaqueColor("#aabbcc")))
    expect(screen.getByRole("button").style.color).toBe(cssBackground(opaqueColor("#101820")))
    view.rerender(<AppearanceProvider appearance={standardAppearance} theme="light">
      <AppearanceProvider appearance={appearance} theme="dark"><Button color="primary">Continue</Button></AppearanceProvider>
    </AppearanceProvider>)
    expect(materialColor(screen.getByRole("button"))).toBe(cssBackground(opaqueColor("#334455")))
    expect(screen.getByRole("button").style.color).toBe(cssBackground(opaqueColor("#faf0e0")))
  })

  it("forwards its native button reference", function () {
    const ref = createRef<HTMLButtonElement>()

    renderButton(<Button ref={ref}>Continue</Button>)

    expect(ref.current).toBe(screen.getByRole("button", { name: "Continue" }))
  })
})

function renderButton(button: ReactNode) {
  return render(<AppearanceProvider appearance={standardAppearance} theme="light">{button}</AppearanceProvider>)
}

function cssBackground(value: string) {
  const element = document.createElement("div")
  element.style.background = value
  return element.style.background
}

function materialColor(button: HTMLElement) {
  const base = button.querySelector<SVGRectElement>("[data-surface-base]")
  expect(base).not.toBeNull()
  expect(button.querySelector("button, div")).toBeNull()
  return cssBackground(base?.style.fill ?? "")
}
