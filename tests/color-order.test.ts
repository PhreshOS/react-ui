import { describe, expect, it } from "vitest"
import { colorShade, opaqueColor, onColor, orderColors, resolveColorLevel, solidColors } from "../source/color.js"
import { contrastWCAG21, parse, to } from "colorjs.io/fn"

describe("color lightness", () => {
  it.each([
    ["#eeeeee", "#111111"],
    ["rgb(200 220 240)", "hsl(210 50% 10%)"],
    ["oklch(80% .1 120)", "oklch(30% .1 250)"],
    ["color(display-p3 .9 .8 .7)", "navy"],
    ["yellow", "blue"]
  ])("orders %s and %s without assuming roles", (lighter, darker) => {
    expect(orderColors(lighter, darker)).toEqual({ lighter, darker })
    expect(orderColors(darker, lighter)).toEqual({ lighter, darker })
  })

  it("treats equal lightness deterministically", () => {
    expect(orderColors("white", "#ffffff")).toEqual(orderColors("#ffffff", "white"))
  })
})

describe("solid control colors", () => {
  it("resolves soft as the same 60% source treatment exposed by the color scale", () => {
    const result = to(resolveColorLevel("oklch(40% 0 0)", "soft"), "oklch")
    expect(result.coords[0]).toBeCloseTo(0.4 * 0.6 + 0.4, 4)
  })

  it.each(["#3465ce", "#777777", "yellow", "hsl(180 60% 35%)", "oklch(70% .12 40)", "color(display-p3 .2 .8 .1)"])("keeps the base contrast choice for every shade of %s", base => {
    for (const [background, foreground] of [["#faf0e0", "#101820"], ["#101820", "#faf0e0"]]) {
      const paints = solidColors(base, background!, foreground!)
      expect(paints.rest.background).toBe(resolveColorLevel(base, "soft"))
      const choices = [opaqueColor(background!), opaqueColor(foreground!)]
      for (const paint of Object.values(paints)) {
        expect(parse(paint.background).alpha).toBe(1)
        expect(choices).toContain(paint.color)
        expect(paint.color).toBe(paints.rest.color)
      }
      expect(contrastWCAG21(paints.rest.background, paints.rest.color)).toBe(Math.max(...choices.map(color => contrastWCAG21(paints.rest.background, color))))
      expect(new Set(Object.values(paints).map(paint => paint.background)).size).toBe(3)
    }
  })

  it("does not switch text when an interaction shade crosses the contrast threshold", () => {
    const paints = solidColors("#111111", "white", "black")
    expect(onColor(paints.pressed.background, "white", "black")).not.toBe(paints.rest.color)
    expect(paints.hover.color).toBe(paints.rest.color)
    expect(paints.pressed.color).toBe(paints.rest.color)
  })

  it("changes lightness without deliberately changing hue or chroma", () => {
    const base = "oklch(60% .08 230)"
    const before = to(base, "oklch").coords
    const after = to(colorShade(base, 0.04), "oklch").coords
    expect(after[0]).toBeCloseTo(0.64, 3)
    expect(after[1]).toBeCloseTo(before[1]!, 3)
    expect(after[2]).toBeCloseTo(before[2]!, 2)
  })

  it("chooses background for a dark fill and foreground for a pale fill when those are the contrasting candidates", () => {
    expect(onColor("navy", "white", "black")).toBe(opaqueColor("white"))
    expect(onColor("yellow", "white", "black")).toBe(opaqueColor("black"))
  })

  it("does not carry alpha from the source color into solid paint", () => {
    expect(parse(opaqueColor("rgb(30 90 160 / .2)")).alpha).toBe(1)
  })
})
