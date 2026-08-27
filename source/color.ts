import { useMemo } from "react"

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
