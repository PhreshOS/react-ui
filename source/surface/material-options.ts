import { appearanceLimits, type AppearanceRange } from "../foundation/appearance.js"
import { isScaleLevel, scale, scaleMultiplier, type ScaleLevel } from "../foundation/scale.js"

/** Optional values of visual substance, expressed directly or relative to Appearance. */
export interface MaterialOptions {
  /** Which mode these values apply to: `frosted` by default. */
  readonly mode?: MaterialMode
  readonly grain?: ScaleLevel | number
  readonly opacity?: ScaleLevel | number
  readonly backdropBlur?: ScaleLevel | number
  readonly backdropSaturation?: ScaleLevel | number
  readonly refraction?: ScaleLevel | number
}

/**
 * How much of the Appearance material a Surface draws, named by what it draws: `none` no material;
 * `opaque` the grain and the edge, solid whatever the Appearance opacity; `translucent` also the
 * Appearance opacity; `frosted` also the backdrop blur and saturation behind it.
 */
export type MaterialMode = "none" | "opaque" | "translucent" | "frosted"

/** Something floating above the interface, such as a menu or a dialog, frosts what lies under it. */
export const floatingMaterial: MaterialMode = "frosted"

/** Grouped material customization exposed by components built on Surface. */
export interface MaterialOverrides {
  /** Omission is `translucent`. An options object is its `mode`, `frosted` by default, with those overrides. */
  readonly material?: MaterialMode | MaterialOptions
}

/** Resolves overrides against an already selected material branch. */
export function resolveMaterialOptions(values: MaterialOptions, defaults: Readonly<{
  grain: number
  opacity: number
  backdropBlur: number
  backdropSaturation: number
  refraction: number
}>) {
  const limits = appearanceLimits.material

  return {
    grain: resolve(values.grain, defaults.grain, limits.grain),
    opacity: resolve(values.opacity, defaults.opacity, limits.opacity),
    backdropBlur: resolve(values.backdropBlur, defaults.backdropBlur, limits.backdropBlur),
    backdropSaturation: resolve(values.backdropSaturation, defaults.backdropSaturation, limits.backdropSaturation, scaleMultiplier),
    refraction: resolve(values.refraction, defaults.refraction, limits.refraction)
  }
}

function resolve(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange, derive = scale) {
  const resolved = isScaleLevel(value) ? derive(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}
