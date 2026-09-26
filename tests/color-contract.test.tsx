import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultAppearance, resolveColor, resolveRadius, resolveSpacing, UIProvider, useColor, useContrastingColor, useScale } from "../source/main.js"
import { colorLevel, contrast, darkCanvas, lightColor, luminance, mixColor, readability, readableColor } from "../source/foundation/color.js"

const light = defaultAppearance.colors.light
const dark = defaultAppearance.colors.dark

describe("color derivation", function () {
  it("resolves a bare Appearance name as its base and keeps direct CSS colors", function () {
    expect(resolveColor("primary", light)).toBe(light.primary)
    expect(resolveColor("primary", light)).toBe(light.primary)
    expect(resolveColor("#123456", light)).toBe("#123456")
    expect(resolveColor("currentColor", light)).toBe("currentColor")
  })

  it("moves softer levels toward the canvas and stronger levels toward the content in every Theme", function () {
    for (const colors of [light, dark]) {
      const base = colors.primary
      const distance = (value: string, target: string) => Math.abs((luminance(value) ?? 0) - (luminance(target) ?? 0))
      expect(distance(colorLevel(base, "subtle", colors), colors.background)).toBeLessThan(distance(base, colors.background))
      expect(distance(colorLevel(base, "subtle", colors), colors.background)).toBeLessThan(distance(colorLevel(base, "soft", colors), colors.background))
      expect(distance(colorLevel(base, "intense", colors), colors.foreground)).toBeLessThan(distance(base, colors.foreground))
    }
  })

  it("keeps the Appearance text color unless the other reads better by one APCA step", function () {
    for (const colors of [light, dark]) {
      for (const role of ["primary", "secondary", "success", "warning", "danger", "info"] as const) {
        const text = readableColor(colors[role], colors)
        const onForeground = readability(colors[role], colors.foreground)!
        const onBackground = readability(colors[role], colors.background)!
        expect(text).toBe(onBackground >= onForeground + 15 ? colors.background : colors.foreground)
      }
    }
    // Close contrasts read alike: dark-theme danger keeps the light Appearance text.
    expect(readableColor(dark.danger, dark)).toBe(dark.foreground)
    // Saturated mid-tones carry light text even where the WCAG 2 ratio favors dark text.
    expect(contrast(light.secondary, light.foreground)!).toBeGreaterThan(contrast(light.secondary, light.background)!)
    expect(readableColor(light.secondary, light)).toBe(light.background)
  })

  it("derives depth direction and lit paint from the colors rather than the Theme name", function () {
    expect(darkCanvas(light)).toBe(false)
    expect(darkCanvas(dark)).toBe(true)
    const inverted = { ...light, background: dark.background, foreground: dark.foreground }
    expect(darkCanvas(inverted)).toBe(true)
    expect(lightColor(dark)).toBe(dark.foreground)
    expect(lightColor(light)).toBe(light.default)
  })

  it("returns identical results for repeated derivations", function () {
    expect(mixColor("#ef8a4c", "#2b211a", 0.05)).toBe(mixColor("#ef8a4c", "#2b211a", 0.05))
    expect(mixColor("var(--x)", "#000000", 0.1)).toBe("color-mix(in oklab, var(--x), #000000 10%)")
  })

  it("exposes memoized scales from the active Appearance", function () {
    const wrapper = ({ children }: { children: React.ReactNode }) => <UIProvider preferences={{ theme: "light", animations: false }}>{children}</UIProvider>
    const scale = renderHook(({ value }) => useColor(value), { initialProps: { value: "primary" }, wrapper })
    const first = scale.result.current
    expect(first.base).toBe(light.primary)
    scale.rerender({ value: "primary" })
    expect(scale.result.current).toBe(first)

    const text = renderHook(() => useContrastingColor("primary"), { wrapper })
    expect(text.result.current).toBe(readableColor(light.primary, light))

    const numbers = renderHook(({ value }) => useScale(value), { initialProps: { value: 12 } })
    expect(numbers.result.current).toEqual({ xsmall: 3, small: 6, medium: 12, large: 18, xlarge: 24 })
  })

  it("resolves each value against only the base it needs", function () {
    expect(resolveSpacing("small", 12)).toBe(6)
    expect(resolveSpacing(8, 12)).toBe(8)
    expect(resolveSpacing("1rem", 12)).toBe("1rem")
    expect(resolveRadius("small", 10)).toBe(5)
    expect(resolveRadius("full", 10)).toBe("9999px")
    expect(resolveRadius("1rem", 10)).toBe("1rem")
    expect(resolveColor("primary", light)).toBe(light.primary)
    expect(resolveColor("#123456", light)).toBe("#123456")
  })
})
