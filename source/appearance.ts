import {
  appearanceLimits,
  defaultAppearance as systemDefaultAppearance,
  type Appearance as SystemAppearance,
  type AppearanceColor,
  type AppearanceColors,
  type AppearanceMaterial,
  type AppearanceRange,
  type AppearanceShadow,
  type AppearanceTransaction,
  type Easing,
  type ThemedValue
} from "@phreshos/core"

/** Complete visual input consumed by React UI. */
export type Appearance = Pick<
  SystemAppearance,
  "colors" | "spacing" | "radius" | "shadow" | "material" | "transaction"
>

export {
  appearanceLimits,
  type AppearanceColor,
  type AppearanceColors,
  type AppearanceMaterial,
  type AppearanceRange,
  type AppearanceShadow,
  type AppearanceTransaction,
  type Easing,
  type ThemedValue
}

/** React UI's default visual input, derived from the System default. */
export const defaultAppearance: Appearance = Object.freeze({
  colors: systemDefaultAppearance.colors,
  spacing: systemDefaultAppearance.spacing,
  radius: systemDefaultAppearance.radius,
  shadow: systemDefaultAppearance.shadow,
  material: systemDefaultAppearance.material,
  transaction: systemDefaultAppearance.transaction
})
