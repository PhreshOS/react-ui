import { describe, expect, it } from "vitest"
import { grainImage, grainSize } from "../source/surface/grain.js"

describe("Grain", function () {
  const bytes = (url: string) => Uint8Array.from(atob(url.match(/base64,([^"]+)/)![1]!), letter => letter.charCodeAt(0))

  it("is a PNG of the grain's size, with a transparent clear pixel and the opacity on every tone", function () {
    const png = bytes(grainImage(3, 0.5, 0.2))
    const view = new DataView(png.buffer)
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    expect(view.getUint32(16)).toBe(grainSize)
    expect(view.getUint32(20)).toBe(grainSize)
    const transparency = new TextDecoder().decode(png).indexOf("tRNS")
    const alphas = [...png.subarray(transparency + 4, transparency + 4 + view.getUint32(transparency - 4))]
    expect(alphas[0]).toBe(0)
    expect(new Set(alphas.slice(1))).toEqual(new Set([51]))
  })

  it("is the same image for the same seed, density, and opacity, wherever it is made", function () {
    expect(grainImage(5, 0.9, 0.03)).toBe(grainImage(5, 0.9, 0.03))
    expect(grainImage(5, 0.9, 0.03)).not.toBe(grainImage(6, 0.9, 0.03))
  })
})
