import { appearanceLimits, type AppearanceRange } from "@phreshos/core"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { color as colorScale, isColorLevel, type ColorLevel } from "./color.js"
import { isScaleLevel, scale, scaleMultiplier, type ScaleLevel } from "./scale.js"

/** Optional values of visual substance, expressed directly or relative to Appearance. */
export interface MaterialOptions {
  readonly color?: ColorLevel | (string & {})
  readonly opacity?: ScaleLevel | number
  readonly backdrop?: ScaleLevel | number
  readonly grain?: ScaleLevel | number
  readonly grainAmount?: ScaleLevel | number
  readonly distortion?: ScaleLevel | number
  readonly saturation?: ScaleLevel | number
}

/** Resolves Material values from the current Appearance without knowing any host geometry. */
export function useMaterialOptions(values: MaterialOptions = {}) {
  const appearance = useAppearance()
  const background = useResolveTheme(appearance.background)
  const foreground = useResolveTheme(appearance.foreground)
  const defaults = useResolveTheme(appearance.material)
  const limits = appearanceLimits.material
  const color = values.color ?? "base"

  return {
    color: isColorLevel(color) ? colorScale(background)[color] : color,
    foreground,
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
