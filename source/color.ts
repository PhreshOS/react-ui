import { useMemo } from "react"
import type { AppearanceColor } from "@phreshos/core"
import { ColorSpace, mix, parse, serialize, to, toGamut, contrastWCAG21, sRGB, sRGB_Linear, HSL, HWB, Lab, LCH, OKLab, OKLCH, P3, A98RGB, ProPhoto, REC_2020, XYZ_D50, XYZ_D65 } from "colorjs.io/fn"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"

// Register the CSS color spaces, without bundling unrelated color-model APIs.
for (const space of [sRGB, sRGB_Linear, HSL, HWB, Lab, LCH, OKLab, OKLCH, P3, A98RGB, ProPhoto, REC_2020, XYZ_D50, XYZ_D65]) ColorSpace.register(space)

/** A visual treatment derived from one concrete CSS color. */
export type ColorLevel = "subtle" | "soft" | "base" | "strong" | "intense"

/** Every visual treatment derived from one concrete CSS color. */
export type ColorScale = Readonly<Record<ColorLevel, string>>

/** One Appearance color and resting level, or a direct CSS color. */
export type Color = `${AppearanceColor}:${ColorLevel}` | (string & {})

export const defaultColor = "background:base" satisfies Color

const treatments = {
  subtle: { weight: 25, target: "white" },
  soft: { weight: 60, target: "white" },
  strong: { weight: 82, target: "black" },
  intense: { weight: 68, target: "black" }
} as const

/** Distinguishes derived color levels from direct CSS colors. */
export function isColorLevel(value: string | undefined): value is ColorLevel {
  return value === "subtle" || value === "soft" || value === "base" || value === "strong" || value === "intense"
}

/** Derives visual treatments while preserving the concrete value at `base`. */
export function color(value: string): ColorScale {
  const shade = (level: keyof typeof treatments) => {
    const { weight, target } = treatments[level]
    return `color-mix(in oklch, ${value} ${weight}%, ${target})`
  }
  return Object.freeze({
    subtle: shade("subtle"),
    soft: shade("soft"),
    base: value,
    strong: shade("strong"),
    intense: shade("intense")
  })
}

/** Resolves the same named treatment for solid paint and contrast calculations. */
export function resolveColorLevel(value: string, level: ColorLevel): string {
  if (level === "base") return opaqueColor(value)
  const { weight, target } = treatments[level]
  return opaqueColor(serialize(mix(opaqueColor(value), target, 1 - weight / 100, { space: "oklch" })))
}

/** Returns the complete visual treatments derived from one concrete color. */
export function useColor(value: string): ColorScale {
  return useMemo(() => color(value), [value])
}

/** Resolves a semantic Appearance color or preserves a direct CSS color. */
export function useResolveColor(value: Color = defaultColor): string {
  const appearance = useAppearance()
  const semantic = parseSemanticColor(value)
  const source = useResolveTheme(appearance.colors[semantic?.name ?? "background"])

  return semantic ? color(source)[semantic.level] : value
}

/** Resolves a color to concrete opaque paint for solid interactive states. */
export function useResolveSolidColor(value: Color): string {
  const appearance = useAppearance()
  const semantic = parseSemanticColor(value)
  const source = useResolveTheme(appearance.colors[semantic?.name ?? "background"])

  return semantic ? resolveColorLevel(source, semantic.level) : opaqueColor(value)
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

/** Solid controls use opaque, gamut-mapped colors for both paint and contrast. */
export function opaqueColor(value: string): string {
  return serialize(toGamut(to({ ...parse(value), alpha: 1 }, "srgb")), { format: "rgb", precision: 6 })
}

/** Changes only perceptual lightness; theme names never determine direction. */
export function colorShade(value: string, amount: number): string {
  const result = to(value, "oklch")
  const lightness = result.coords[0] ?? 0
  result.coords[0] = Math.max(0, Math.min(1, lightness + (lightness > 0.6 ? -amount : amount)))
  return opaqueColor(serialize(result))
}

/** Chooses only from the two Appearance colors, against the actual painted fill. */
export function onColor(fill: string, background: string, foreground: string): string {
  const first = opaqueColor(background)
  const second = opaqueColor(foreground)
  return contrastWCAG21(fill, first) > contrastWCAG21(fill, second) ? first : second
}

/** Solid controls start at base; interaction shades preserve its text choice. */
export function solidColors(base: string, background: string, foreground: string) {
  const fill = resolveColorLevel(base, "base")
  const color = onColor(fill, background, foreground)
  const paint = (background: string) => ({ background, color })
  return {
    rest: paint(fill),
    hover: paint(colorShade(fill, 0.045)),
    pressed: paint(colorShade(fill, 0.085))
  }
}

function parseSemanticColor(value: string): { name: AppearanceColor, level: ColorLevel } | null {
  const separator = value.indexOf(":")
  if (separator < 0 || value.indexOf(":", separator + 1) >= 0) return null
  const name = value.slice(0, separator)
  const level = value.slice(separator + 1)
  if (!isAppearanceColor(name) || !isColorLevel(level)) return null
  return { name, level }
}

function isAppearanceColor(value: string): value is AppearanceColor {
  return value === "background" || value === "foreground" || value === "primary" || value === "secondary"
    || value === "success" || value === "warning" || value === "danger" || value === "info"
}
