import { appearanceLimits, type AppearanceRange } from "../foundation/appearance.js"
import { isScaleLevel, scale, scaleMultiplier, type ScaleLevel } from "../foundation/scale.js"

/** Optional values of visual substance, expressed directly or relative to Appearance. */
export interface MaterialOptions {
  readonly opacity?: ScaleLevel | number
  readonly backdrop?: ScaleLevel | number
  readonly grain?: ScaleLevel | number
  readonly grainAmount?: ScaleLevel | number
  readonly distortion?: ScaleLevel | number
  readonly saturation?: ScaleLevel | number
}

/** React UI's progressively complete browser rendering strategies for a resolved Material. */
export type MaterialMode = "none" | "basic" | "extended" | "full"

/** Grouped material customization exposed by components built on Surface. */
export interface MaterialOverrides {
  /** Omission uses basic rendering. An options object uses full rendering with those overrides. */
  readonly material?: MaterialMode | MaterialOptions
}

/** Resolves overrides against an already selected material branch. */
export function resolveMaterialOptions(values: MaterialOptions, defaults: Readonly<{
  opacity: number
  backdrop: number
  grain: number
  grainAmount: number
  distortion: number
  saturation: number
}>) {
  const limits = appearanceLimits.material

  return {
    opacity: resolve(values.opacity, defaults.opacity, limits.opacity),
    backdrop: resolve(values.backdrop, defaults.backdrop, limits.backdrop),
    grain: resolve(values.grain, defaults.grain, limits.grain),
    grainAmount: resolve(values.grainAmount, defaults.grainAmount, limits.grainAmount),
    distortion: resolve(values.distortion, defaults.distortion, limits.distortion),
    saturation: resolve(values.saturation, defaults.saturation, limits.saturation, scaleMultiplier)
  }
}

function resolve(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange, derive = scale) {
  const resolved = isScaleLevel(value) ? derive(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}
