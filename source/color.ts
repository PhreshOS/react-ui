import { useMemo } from "react"
import type { AppearanceColor, AppearanceColors } from "./appearance.js"
import ColorSpace from "colorjs.io/src/ColorSpace.js"
import { mix } from "colorjs.io/src/interpolation.js"
import parse from "colorjs.io/src/parse.js"
import serialize from "colorjs.io/src/serialize.js"
import to from "colorjs.io/src/to.js"
import toGamut from "colorjs.io/src/toGamut.js"
import sRGB from "colorjs.io/src/spaces/srgb.js"
import sRGB_Linear from "colorjs.io/src/spaces/srgb-linear.js"
import HSL from "colorjs.io/src/spaces/hsl.js"
import HWB from "colorjs.io/src/spaces/hwb.js"
import Lab from "colorjs.io/src/spaces/lab.js"
import LCH from "colorjs.io/src/spaces/lch.js"
import OKLab from "colorjs.io/src/spaces/oklab.js"
import OKLCH from "colorjs.io/src/spaces/oklch.js"
import P3 from "colorjs.io/src/spaces/p3.js"
import A98RGB from "colorjs.io/src/spaces/a98rgb.js"
import ProPhoto from "colorjs.io/src/spaces/prophoto.js"
import REC_2020 from "colorjs.io/src/spaces/rec2020.js"
import XYZ_D50 from "colorjs.io/src/spaces/xyz-d50.js"
import XYZ_D65 from "colorjs.io/src/spaces/xyz-d65.js"

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
  if (level === "base") return resolvableOpaqueColor(value) ?? value
  const opaque = resolvableOpaqueColor(value)
  if (opaque == null) return color(value)[level]
  const { weight, target } = treatments[level]
  return opaqueColor(serialize(mix(opaque, target, 1 - weight / 100, { space: "oklch" })))
}

/** Returns the complete visual treatments derived from one concrete color. */
export function useColor(value: string): ColorScale {
  return useMemo(() => color(value), [value])
}

/** Resolves a semantic color from an already selected Appearance branch. */
export function resolveColor(value: Color | undefined, colors: AppearanceColors): string {
  const resolved = value ?? defaultColor
  const semantic = parseSemanticColor(resolved, colors)
  return semantic ? color(semantic.source)[semantic.level] : resolved
}

/** Resolves opaque control paint from an already selected Appearance branch. */
export function resolveSolidColor(value: Color, colors: AppearanceColors): string {
  const semantic = parseSemanticColor(value, colors)
  return semantic ? resolveColorLevel(semantic.source, semantic.level) : resolvableOpaqueColor(value) ?? value
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

/** Chooses the perceptually opposite Appearance color for the actual painted fill. */
export function onColor(fill: string, background: string, foreground: string): string {
  const first = opaqueColor(background)
  const second = opaqueColor(foreground)
  const candidates = orderColors(first, second)
  const darker = colorLightness(candidates.darker)
  const lighter = colorLightness(candidates.lighter)
  const threshold = darker + (lighter - darker) * 2 / 3

  return colorLightness(opaqueColor(fill)) < threshold ? candidates.lighter : candidates.darker
}

/** Chooses readable content when the fill can be evaluated, otherwise preserves Appearance foreground. */
export function contrastingColor(value: Color, colors: AppearanceColors): string {
  try {
    return onColor(resolveSolidColor(value, colors), colors.background, colors.foreground)
  } catch {
    return colors.foreground
  }
}

/** Solid controls start at base; interaction shades preserve its text choice. */
export function solidColors(base: string, background: string, foreground: string) {
  const fill = resolveColorLevel(base, "base")
  const content = resolvableOnColor(fill, background, foreground) ?? foreground
  const paint = (background: string) => ({ background, color: content })
  const concrete = resolvableOpaqueColor(fill)

  if (concrete == null) return {
    rest: paint(fill),
    hover: paint(cssInteractionColor(fill, foreground, 0.045)),
    pressed: paint(cssInteractionColor(fill, foreground, 0.085))
  }

  return {
    rest: paint(concrete),
    hover: paint(colorShade(concrete, 0.045)),
    pressed: paint(colorShade(concrete, 0.085))
  }
}

/** Low-emphasis interaction paints derived from the same component-owned base. */
export function subtleColors(base: string, background: string, foreground: string) {
  const fill = resolveColorLevel(base, "base")
  const canvas = resolvableOpaqueColor(background) ?? background
  const concrete = resolvableOpaqueColor(fill)
  const paint = (weight: number) => {
    const mixed = concrete == null
      ? `color-mix(in oklch, ${canvas} ${Math.round((1 - weight) * 10_000) / 100}%, ${fill})`
      : opaqueColor(serialize(mix(canvas, concrete, weight, { space: "oklch" })))
    return { background: mixed, color: resolvableOnColor(mixed, background, foreground) ?? foreground }
  }

  return {
    rest: paint(0.25),
    hover: paint(0.5),
    pressed: paint(0.65)
  }
}

function resolvableOpaqueColor(value: string): string | null {
  try {
    return opaqueColor(value)
  } catch {
    return null
  }
}

function resolvableOnColor(fill: string, background: string, foreground: string): string | null {
  try {
    return onColor(fill, background, foreground)
  } catch {
    return null
  }
}

function cssInteractionColor(base: string, target: string, amount: number) {
  return `color-mix(in oklch, ${base} ${Math.round((1 - amount) * 10_000) / 100}%, ${target})`
}

function parseSemanticColor(value: string, colors: AppearanceColors): { source: string, level: ColorLevel } | null {
  const separator = value.indexOf(":")
  if (separator < 0 || value.indexOf(":", separator + 1) >= 0) return null
  const name = value.slice(0, separator)
  const level = value.slice(separator + 1)
  const source = Reflect.get(colors, name)
  if (typeof source !== "string" || !isColorLevel(level)) return null
  return { source, level }
}
