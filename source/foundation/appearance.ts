import {
  appearanceLimits as coreAppearanceLimits,
  defaultAppearance as systemDefaultAppearance,
  type Appearance as SystemAppearance,
  type AppearanceColors,
  type AppearanceMaterial,
  type AppearanceShadow,
  type AppearanceTransaction,
  type ThemedValue
} from "@phreshos/core"

export type {
  AppearanceColor,
  AppearanceColors,
  AppearanceMaterial,
  AppearanceRange,
  AppearanceShadow,
  AppearanceTransaction,
  Easing,
  ThemedValue
} from "@phreshos/core"

/** The System Appearance fields consumed by React UI. */
export type Appearance = Pick<SystemAppearance, "colors" | "spacing" | "radius" | "shadow" | "material" | "transaction">

type Themed<Value> = Readonly<{
  light?: Readonly<Partial<Value>>
  dark?: Readonly<Partial<Value>>
}>

type AppearanceUpdateFields = Readonly<{
  colors?: Themed<AppearanceColors>
  spacing?: number
  radius?: number
  shadow?: Themed<AppearanceShadow>
  material?: Themed<AppearanceMaterial>
  transaction?: Readonly<Partial<AppearanceTransaction>>
}>

/** At least one partial visual field merged recursively with the nearest UIProvider. */
export type AppearanceUpdate = {
  [Field in keyof AppearanceUpdateFields]-?: Readonly<
    Required<Pick<AppearanceUpdateFields, Field>> & Omit<AppearanceUpdateFields, Field>
  >
}[keyof AppearanceUpdateFields]

/** Bounds for the visual Appearance fields consumed by React UI. */
export const appearanceLimits = Object.freeze({
  spacing: coreAppearanceLimits.spacing,
  radius: coreAppearanceLimits.radius,
  shadow: coreAppearanceLimits.shadow,
  material: coreAppearanceLimits.material
})

/** The visual portion of the System's default Appearance. */
export const defaultAppearance: Appearance = Object.freeze({
  colors: systemDefaultAppearance.colors,
  spacing: systemDefaultAppearance.spacing,
  radius: systemDefaultAppearance.radius,
  shadow: systemDefaultAppearance.shadow,
  material: systemDefaultAppearance.material,
  transaction: systemDefaultAppearance.transaction
})

/** Applies one partial update; omitted leaves continue to inherit. */
export function mergeAppearance(appearance: Appearance, update: AppearanceUpdate): Appearance {
  return Object.freeze({
    colors: mergeThemed(appearance.colors, update.colors),
    spacing: update.spacing ?? appearance.spacing,
    radius: update.radius ?? appearance.radius,
    shadow: mergeThemed(appearance.shadow, update.shadow),
    material: mergeThemed(appearance.material, update.material),
    transaction: update.transaction === undefined
      ? appearance.transaction
      : Object.freeze({ ...appearance.transaction, ...update.transaction })
  })
}

function mergeThemed<Value extends object>(current: ThemedValue<Value>, update: Themed<Value> | undefined): ThemedValue<Value> {
  if (update === undefined) return current
  return Object.freeze({
    light: update.light === undefined ? current.light : Object.freeze({ ...current.light, ...update.light }),
    dark: update.dark === undefined ? current.dark : Object.freeze({ ...current.dark, ...update.dark })
  })
}
