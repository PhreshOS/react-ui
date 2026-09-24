import { render, renderHook, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button, defaultAppearance, resolveRadius, resolveSpacing, UIProvider, useColor, useContrastingColor, useScale } from "../source/main.js"
import { color, contrastingColor } from "../source/color.js"
import { isScaleLevel, scaleMultiplier } from "../source/scale.js"

describe("visual derivation", function () {
  it("derives and memoizes every numeric level from one concrete value", function () {
    const hook = renderHook(({ value }) => useScale(value), { initialProps: { value: 12 } })
    const first = hook.result.current

    expect(first).toEqual({ xsmall: 3, small: 6, medium: 12, large: 18, xlarge: 24 })

    hook.rerender({ value: 12 })
    expect(hook.result.current).toBe(first)

    hook.rerender({ value: 16 })
    expect(hook.result.current).toEqual({ xsmall: 4, small: 8, medium: 16, large: 24, xlarge: 32 })
    expect(hook.result.current).not.toBe(first)
  })

  it("derives and memoizes every treatment from one concrete color", function () {
    const hook = renderHook(({ value }) => useColor(value), { initialProps: { value: "hotpink" } })
    const first = hook.result.current

    expect(first.base).toBe("hotpink")
    expect(first.soft).toBe("color-mix(in oklch, hotpink 60%, white)")

    hook.rerender({ value: "hotpink" })
    expect(hook.result.current).toBe(first)
  })

  it("returns the same readable content color used by a control fill", function () {
    function Example() {
      const color = "primary:soft" as const
      const foreground = useContrastingColor(color)
      return <><Button color={color}>Tab</Button><span data-testid="content" style={{ color: foreground }}>Close</span></>
    }

    render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}><Example /></UIProvider>)

    expect(screen.getByTestId("content").style.color).toBe(screen.getByRole("button", { name: "Tab" }).style.color)
  })

  it("accepts a direct CSS fill", function () {
    const hook = renderHook(() => useContrastingColor("#101820"), {
      wrapper: ({ children }) => <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>{children}</UIProvider>
    })

    expect(hook.result.current).toBe(contrastingColor("#101820", defaultAppearance.colors.light))
  })

  it("preserves the concrete color and neutral multiplier values", function () {
    expect(color("rebeccapurple").base).toBe("rebeccapurple")
    expect(scaleMultiplier(1.8, "small")).toBe(1.4)
    expect(scaleMultiplier(1.8, "medium")).toBe(1.8)
    expect(isScaleLevel("medium")).toBe(true)
    expect(isScaleLevel("full")).toBe(false)
  })

  it("requires Appearance only when resolving semantic spacing and radius", function () {
    expect(resolveSpacing("small", defaultAppearance)).toBe(6)
    expect(resolveRadius("small", defaultAppearance)).toBe(5)
    expect(resolveSpacing(8, null)).toBe(8)
    expect(resolveRadius("1rem", null)).toBe("1rem")
    expect(() => resolveSpacing("small", null)).toThrow("Appearance value")
    expect(() => resolveRadius("small", null)).toThrow("Appearance value")
  })
})
