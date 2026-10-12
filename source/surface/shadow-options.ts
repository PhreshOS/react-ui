import { appearanceLimits } from "../foundation/appearance.js"
import { isScaleLevel, scale, type ScaleLevel } from "../foundation/scale.js"

/** Shadow customization exposed by components built on Surface. */
export interface ShadowOverrides {
  /**
   * How strong the shadow is: omission or true is the Appearance's, false is none, and a level or
   * a number is that strength. It falls evenly on every side, at one fixed blur.
   */
  readonly shadow?: boolean | ScaleLevel | number
}

/** Every shadow falls at this blur; only its strength changes. */
const shadowBlur = 10

/** A Surface's shadow strength, from its own value and the Appearance's. */
export function shadowStrength(value: true | ScaleLevel | number, base: number) {
  const resolved = value === true ? base : isScaleLevel(value) ? scale(base, value) : value
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(appearanceLimits.shadow.maximum, Math.max(appearanceLimits.shadow.minimum, finite))
}

/** Serializes one neutral-black shadow, centered on its Surface. */
export function shadowStyle(strength: number) {
  return strength === 0 ? "none" : `0 0 ${shadowBlur}px 0 rgba(0, 0, 0, ${strength})`
}

/** Something floating above the interface, such as a menu or a dialog, casts the shadow a level stronger. */
export const floatingShadow = "large"
