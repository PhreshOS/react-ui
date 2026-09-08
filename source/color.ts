import { useMemo } from "react"
import { ColorSpace, parse, sRGB, sRGB_Linear, HSL, HWB, Lab, LCH, OKLab, OKLCH, P3, A98RGB, ProPhoto, REC_2020, XYZ_D50, XYZ_D65 } from "colorjs.io/fn"

// Register the CSS color spaces, without bundling unrelated color-model APIs.
for (const space of [sRGB, sRGB_Linear, HSL, HWB, Lab, LCH, OKLab, OKLCH, P3, A98RGB, ProPhoto, REC_2020, XYZ_D50, XYZ_D65]) ColorSpace.register(space)

/** A visual treatment derived from one concrete CSS color. */
export type ColorLevel = "subtle" | "soft" | "base" | "strong" | "intense"

/** Every visual treatment derived from one concrete CSS color. */
export type ColorScale = Readonly<Record<ColorLevel, string>>

/** Derives visual treatments while preserving the concrete value at `base`. */
export function color(value: string): ColorScale {
  return Object.freeze({
    subtle: `color-mix(in oklch, ${value} 25%, white)`,
    soft: `color-mix(in oklch, ${value} 60%, white)`,
    base: value,
    strong: `color-mix(in oklch, ${value} 82%, black)`,
    intense: `color-mix(in oklch, ${value} 68%, black)`
  })
}

/** Returns the complete visual treatments derived from one concrete color. */
export function useColor(value: string): ColorScale {
  return useMemo(() => color(value), [value])
}

/** Applies material opacity without restricting the source CSS color syntax. */
export function colorOpacity(value: string, opacity: number): string {
  const percentage = Math.round(opacity * 10_000) / 100

  return `color-mix(in srgb, ${value} ${percentage}%, transparent)`
}

/** Reads perceptual lightness from a resolved CSS color. */
export function colorLightness(value: string): number {
  // A missing CSS channel (`none`) contributes zero outside interpolation.
  return OKLCH.from(parse(value))[0] ?? 0
}

/** Orders resolved CSS colors by perceptual lightness, never by their role. */
export function orderColors(first: string, second: string) {
  const difference = colorLightness(first) - colorLightness(second)
  return difference > 0 || (difference === 0 && first >= second)
    ? { lighter: first, darker: second }
    : { lighter: second, darker: first }
}
