import { appearanceLimits, type AppearanceRange } from "./appearance.js"
import { isScaleLevel, scale, scaleMultiplier, type ScaleLevel } from "./scale.js"

/** Optional values of visual substance, expressed directly or relative to Appearance. */
export interface MaterialOptions {
  readonly opacity?: ScaleLevel | number
  readonly backdrop?: ScaleLevel | number
  readonly grain?: ScaleLevel | number
  readonly grainAmount?: ScaleLevel | number
  readonly distortion?: ScaleLevel | number
  readonly saturation?: ScaleLevel | number
}

/** Grouped material customization exposed by components built on Surface. */
export interface MaterialOverrides {
  /** Omission or true uses Appearance defaults; false uses the resolved color as a normal background. */
  readonly material?: boolean | MaterialOptions
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

export type ResolvedMaterial = ReturnType<typeof resolveMaterialOptions>

function resolve(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange, derive = scale) {
  const resolved = isScaleLevel(value) ? derive(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}
