import { appearanceLimits, type AppearanceRange } from "@phreshos/core"
import { useAppearance, useThemedValue } from "./appearance-provider.js"
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
  readonly material?: MaterialOptions
}

/** Resolves material values from the current Appearance without knowing any host geometry. */
export function useMaterialOptions(values: MaterialOptions = {}) {
  const appearance = useAppearance()
  const defaults = useThemedValue(appearance.material)
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

export type ResolvedMaterial = ReturnType<typeof useMaterialOptions>

function resolve(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange, derive = scale) {
  const resolved = isScaleLevel(value) ? derive(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}
