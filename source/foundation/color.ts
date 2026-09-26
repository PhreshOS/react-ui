import { useMemo } from "react"
import ColorSpace from "colorjs.io/src/ColorSpace.js"
import contrastAPCA from "colorjs.io/src/contrast/APCA.js"
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
import type { AppearanceColor, AppearanceColors } from "./appearance.js"
import { useVisual } from "./visual.js"

// Register the CSS color spaces without bundling unrelated color-model APIs.
for (const space of [sRGB, sRGB_Linear, HSL, HWB, Lab, LCH, OKLab, OKLCH, P3, A98RGB, ProPhoto, REC_2020, XYZ_D50, XYZ_D65]) ColorSpace.register(space)

/** A treatment derived from one base color relative to the canvas and content. */
export type ColorLevel = "subtle" | "soft" | "base" | "strong" | "intense"

/** Every treatment derived from one base color. */
export type ColorScale = Readonly<Record<ColorLevel, string>>

/** An Appearance color, an Appearance color at one level, or a direct CSS color. */
export type Color = AppearanceColor | `${AppearanceColor}:${ColorLevel}` | (string & {})

/**
 * Levels move a color toward the canvas (`subtle`, `soft`) or toward the
 * content color (`strong`, `intense`). Direction therefore follows the colors
 * themselves, so every level keeps its meaning in any Theme.
 */
const levels = {
  subtle: { toward: "background", amount: 0.84 },
  soft: { toward: "background", amount: 0.62 },
  strong: { toward: "foreground", amount: 0.22 },
  intense: { toward: "foreground", amount: 0.42 }
} as const

/*
 * Every derivation below is pure and repeats constantly across components and
 * renders. Results are cached by their inputs so a theme change or a hover
 * costs a lookup instead of a color-space conversion.
 */
const concreteCache = new Map<string, string | null>()
const luminanceCache = new Map<string, number | null>()
const mixCache = new Map<string, string>()
const resolvedCache = new WeakMap<AppearanceColors, Map<string, string>>()
const readableCache = new WeakMap<AppearanceColors, Map<string, string>>()
const cacheLimit = 2_048

function remember<Value>(cache: Map<string, Value>, key: string, value: Value) {
  if (cache.size >= cacheLimit) cache.delete(cache.keys().next().value!)
  cache.set(key, value)
  return value
}

/** Returns an opaque sRGB serialization, or `null` when the value is not a concrete CSS color. */
export function concreteColor(value: string): string | null {
  const cached = concreteCache.get(value)
  if (cached !== undefined) return cached
  let result: string | null
  try {
    result = serialize(toGamut(to({ ...parse(value), alpha: 1 }, "srgb")), { format: "hex" })
  } catch {
    result = null
  }
  return remember(concreteCache, value, result)
}

/** WCAG relative luminance of a concrete color, or `null` when it cannot be evaluated. */
export function luminance(value: string): number | null {
  const cached = luminanceCache.get(value)
  if (cached !== undefined) return cached
  const concrete = concreteColor(value)
  let result: number | null = null
  if (concrete !== null) {
    const [red, green, blue] = to(parse(concrete), "srgb-linear").coords.map(channel => channel ?? 0)
    result = 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
  }
  return remember(luminanceCache, value, result)
}

/** WCAG contrast ratio between two colors, or `null` when either cannot be evaluated. */
export function contrast(first: string, second: string): number | null {
  const a = luminance(first)
  const b = luminance(second)
  if (a === null || b === null) return null
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/**
 * Mixes `amount` of `target` into `base` in OKLab, concretely when possible.
 * OKLab keeps the hue while moving toward a near-neutral canvas or text color;
 * OKLCH would rotate the hue toward the neutral's meaningless angle.
 */
export function mixColor(base: string, target: string, amount: number): string {
  if (amount <= 0) return base
  const key = `${base}|${target}|${amount}`
  const cached = mixCache.get(key)
  if (cached !== undefined) return cached
  const first = concreteColor(base)
  const second = concreteColor(target)
  const result = first !== null && second !== null
    ? concreteColor(serialize(mix(first, second, amount, { space: "oklab" })))!
    : `color-mix(in oklab, ${base}, ${target} ${Math.round(amount * 10_000) / 100}%)`
  return remember(mixCache, key, result)
}

/** Applies transparency without restricting the source CSS color syntax. */
export function colorOpacity(value: string, opacity: number): string {
  return `color-mix(in srgb, ${value} ${Math.round(opacity * 10_000) / 100}%, transparent)`
}

/** Resolves one Color against the active Appearance colors. */
export function resolveColor(value: Color, colors: AppearanceColors): string {
  let cache = resolvedCache.get(colors)
  if (cache === undefined) resolvedCache.set(colors, cache = new Map())
  const cached = cache.get(value)
  if (cached !== undefined) return cached

  const separator = value.indexOf(":")
  const name = separator < 0 ? value : value.slice(0, separator)
  const level = separator < 0 ? "base" : value.slice(separator + 1)
  const source = Object.hasOwn(colors, name) ? colors[name as AppearanceColor] : undefined
  const result = source === undefined || !isColorLevel(level)
    ? value
    : level === "base" ? source : colorLevel(source, level, colors)

  cache.set(value, result)
  return result
}

/** Derives one level from a concrete base color. */
export function colorLevel(base: string, level: ColorLevel, colors: AppearanceColors): string {
  if (level === "base") return base
  const { toward, amount } = levels[level]
  return mixColor(base, colors[toward], amount)
}

/** Every level derived from one base color. */
export function colorScale(base: string, colors: AppearanceColors): ColorScale {
  return Object.freeze({
    subtle: colorLevel(base, "subtle", colors),
    soft: colorLevel(base, "soft", colors),
    base,
    strong: colorLevel(base, "strong", colors),
    intense: colorLevel(base, "intense", colors)
  })
}

/**
 * Perceived lightness contrast (APCA Lc magnitude) of `text` drawn on `fill`,
 * or `null` when either cannot be evaluated. Unlike the WCAG 2 ratio, it is
 * polarity-aware: the WCAG ratio overrates dark text on saturated mid-tone
 * fills such as blue or green, where light text actually reads better.
 */
export function readability(fill: string, text: string): number | null {
  const background = concreteColor(fill)
  const foreground = concreteColor(text)
  if (background === null || foreground === null) return null
  return Math.abs(contrastAPCA(background, foreground))
}

/**
 * APCA grades readability in steps of 15 Lc. Contrasts closer than one step
 * read alike, so they are not a reason to leave the Appearance text color.
 */
const readabilityStep = 15

/**
 * Returns the Appearance text color, `foreground`, unless `background` reads
 * clearly better on the fill: better by at least one APCA step.
 */
export function readableColor(fill: string, colors: AppearanceColors): string {
  let cache = readableCache.get(colors)
  if (cache === undefined) readableCache.set(colors, cache = new Map())
  const cached = cache.get(fill)
  if (cached !== undefined) return cached

  const onBackground = readability(fill, colors.background)
  const onForeground = readability(fill, colors.foreground)
  const result = onBackground === null || onForeground === null
    ? colors.foreground
    : onBackground >= onForeground + readabilityStep ? colors.background : colors.foreground

  cache.set(fill, result)
  return result
}

/** Whether the canvas is darker than its content, derived from the colors themselves. */
export function darkCanvas(colors: AppearanceColors): boolean {
  const background = luminance(colors.background)
  const foreground = luminance(colors.foreground)
  return background !== null && foreground !== null && background < foreground
}

const darknessCache = new WeakMap<AppearanceColors, number>()

/**
 * How dark the canvas is, from 0 (a light canvas) to 1 (a dark canvas), read
 * from the perceptual lightness of the background itself. Treatments that
 * depend on the canvas interpolate along it instead of switching at a threshold,
 * so a mid-tone canvas receives a mid-tone treatment.
 */
export function canvasDarkness(colors: AppearanceColors): number {
  const cached = darknessCache.get(colors)
  if (cached !== undefined) return cached
  const concrete = concreteColor(colors.background)
  const lightness = concrete === null ? (darkCanvas(colors) ? 0 : 1) : to(parse(concrete), "oklch").coords[0] ?? 1
  const progress = Math.min(1, Math.max(0, (0.82 - lightness) / (0.82 - 0.28)))
  // Smoothstep keeps both ends settled and the middle continuous.
  const result = progress * progress * (3 - 2 * progress)
  darknessCache.set(colors, result)
  return result
}

const recessCache = new Map<string, string>()

/**
 * The paint of a recess in `base`: the same color moved just far enough toward
 * whichever extreme has more room to reach one constant perceptual difference.
 * Depth therefore reads the same on a light, mid-tone, or dark canvas.
 */
export function recessColor(base: string): string {
  const cached = recessCache.get(base)
  if (cached !== undefined) return cached
  const toward = (contrast(base, "#ffffff") ?? 1) > (contrast(base, "#000000") ?? 1) ? "#ffffff" : "#000000"
  let result = base
  for (let amount = 0.005; amount <= 0.25; amount += 0.005) {
    result = mixColor(base, toward, Math.round(amount * 1_000) / 1_000)
    if ((contrast(base, result) ?? recessContrast) >= recessContrast) break
  }
  return remember(recessCache, base, result)
}

/** The constant difference between a recess and the paint it sinks into. */
const recessContrast = 1.085

/** The lighter Appearance content candidate: the paint of anything lit from above, such as a thumb. */
export function lightColor(colors: AppearanceColors): string {
  return darkCanvas(colors) ? colors.foreground : colors.default
}

export function isColorLevel(value: string): value is ColorLevel {
  return value === "subtle" || value === "soft" || value === "base" || value === "strong" || value === "intense"
}

/** Every level derived from one color in the active Appearance. */
export function useColor(value: Color): ColorScale {
  const { colors } = useVisual()
  return useMemo(() => colorScale(resolveColor(value, colors), colors), [value, colors])
}

/** The readable content color for one fill in the active Appearance. */
export function useContrastingColor(value: Color): string {
  const { colors } = useVisual()
  return useMemo(() => readableColor(resolveColor(value, colors), colors), [value, colors])
}
