import { describe, expect, it } from "vitest"
import { orderColors } from "../source/color.js"

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
