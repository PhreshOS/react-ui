import { appearanceLimits, type AppearanceRange } from "../foundation/appearance.js"
import { isScaleLevel, scale, type ScaleLevel } from "../foundation/scale.js"

/** Optional outer-shadow values expressed directly or relative to Appearance. */
export interface ShadowOptions {
  readonly x?: ScaleLevel | number
  readonly y?: ScaleLevel | number
  readonly blur?: ScaleLevel | number
  readonly spread?: ScaleLevel | number
  readonly opacity?: ScaleLevel | number
}

/** Grouped shadow customization exposed by components built on Surface. */
export interface ShadowOverrides {
  /** Omission or true uses Appearance defaults; false removes the shadow. */
  readonly shadow?: boolean | ShadowOptions
}

/** Resolves overrides against an already selected shadow branch. */
export function resolveShadowOptions(values: ShadowOptions, defaults: Readonly<{
  x: number
  y: number
  blur: number
  spread: number
  opacity: number
}>) {
  const limits = appearanceLimits.shadow

  return {
    x: resolve(values.x, defaults.x, limits.x),
    y: resolve(values.y, defaults.y, limits.y),
    blur: resolve(values.blur, defaults.blur, limits.blur),
    spread: resolve(values.spread, defaults.spread, limits.spread),
    opacity: resolve(values.opacity, defaults.opacity, limits.opacity)
  }
}

export type ResolvedShadow = ReturnType<typeof resolveShadowOptions>

/** Serializes one resolved neutral-black outer shadow. */
export function shadowStyle({ x, y, blur, spread, opacity }: ResolvedShadow) {
  return opacity === 0 ? "none" : `${x}px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`
}

function resolve(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange) {
  const resolved = isScaleLevel(value) ? scale(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}

/**
 * The outer shadow of something floating above the interface, such as an
 * overlay: the same Appearance shadow, only wider and slightly denser. It keeps
 * the Appearance offset, so a directionless Appearance stays directionless.
 */
export function floatingShadow(shadow: Readonly<{ x: number, y: number, blur: number, spread: number, opacity: number }>): ShadowOptions {
  const limits = appearanceLimits.shadow
  return {
    x: shadow.x,
    y: shadow.y,
    blur: Math.min(limits.blur.maximum, Math.max(24, shadow.blur * 3)),
    spread: shadow.spread,
    opacity: Math.min(limits.opacity.maximum, shadow.opacity * 1.6)
  }
}
