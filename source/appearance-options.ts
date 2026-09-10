import { appearanceLimits, type AppearanceRange } from "@phreshos/core"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { color as colorScale, isColorLevel, type ColorLevel } from "./color.js"
import type { RadiusProps } from "./radius.js"
import { isScaleLevel, scale, scaleMultiplier, type ScaleLevel } from "./scale.js"

/** Optional visual values, expressed directly or relative to Appearance. */
export interface AppearanceOptions extends RadiusProps {
  readonly color?: ColorLevel | (string & {})
  readonly opacity?: ScaleLevel | number
  readonly backdrop?: ScaleLevel | number
  readonly grain?: ScaleLevel | number
  readonly grainAmount?: ScaleLevel | number
  readonly distortion?: ScaleLevel | number
  readonly saturation?: ScaleLevel | number
}

/** Resolves shared values. Their current Core storage does not define their ownership. */
export function useAppearanceOptions(values: AppearanceOptions) {
  const appearance = useAppearance()
  const background = useResolveTheme(appearance.background)
  const foreground = useResolveTheme(appearance.foreground)
  const radius = useResolveTheme(appearance.radius)
  const defaults = useResolveTheme(appearance.surface)
  const limits = appearanceLimits.surface
  const color = values.color ?? "base"
  const corners = values.radius ?? "medium"

  return {
    color: isColorLevel(color) ? colorScale(background)[color] : color,
    foreground,
    radius: isScaleLevel(corners) ? scale(radius, corners) : corners,
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
