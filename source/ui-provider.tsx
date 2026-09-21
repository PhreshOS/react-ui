import { useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import type { Appearance, AppearanceUpdate } from "./appearance.js"
import { AppearanceContext, fixedPreferencesSource, PreferencesContext, useAppearance, usePreferences } from "./appearance-context.js"
import { DirectionContext, fixedDirectionSource, type Direction } from "./direction.js"
import type { Preferences, PreferencesUpdate } from "./preferences.js"

export { useAppearance, useBrowserPreferences, usePreferences, useThemedValue } from "./appearance-context.js"
export { useDirection, useDocumentDirection } from "./direction.js"

const directionBoundaryStyle = { display: "contents" } satisfies CSSProperties

/** Establishes only the explicitly supplied UI values for a React subtree. */
export function UIProvider({ appearance, children, direction, preferences }: UIProviderProps) {
  let subtree = children
  const directionSource = useMemo(
    () => direction === undefined ? undefined : fixedDirectionSource(direction),
    [direction]
  )

  if (preferences !== undefined) subtree = <PreferencesBoundary update={preferences}>{subtree}</PreferencesBoundary>

  if (appearance !== undefined) subtree = <AppearanceBoundary update={appearance}>{subtree}</AppearanceBoundary>

  if (directionSource !== undefined) {
    subtree = <DirectionContext.Provider value={directionSource}>
      <div dir={direction} style={directionBoundaryStyle}>{subtree}</div>
    </DirectionContext.Provider>
  }

  return subtree
}

export interface UIProviderProps {
  readonly appearance?: AppearanceUpdate
  readonly children: ReactNode
  /** Establishes the concrete direction inherited by the provider subtree. */
  readonly direction?: Direction
  readonly preferences?: PreferencesUpdate
}

function AppearanceBoundary({ children, update }: Readonly<{ children: ReactNode, update: AppearanceUpdate }>) {
  const inherited = useAppearance()
  const appearance = useMemo(() => mergeAppearance(inherited, update), [inherited, update])
  return <AppearanceContext.Provider value={appearance}>{children}</AppearanceContext.Provider>
}

function PreferencesBoundary({ children, update }: Readonly<{ children: ReactNode, update: PreferencesUpdate }>) {
  if (update.theme !== undefined && update.animations !== undefined) {
    // A complete boundary must not subscribe to the browser merely to obtain
    // inherited fields that it already supplies itself.
    return <CompletePreferencesBoundary theme={update.theme} animations={update.animations}>{children}</CompletePreferencesBoundary>
  }

  return <InheritedPreferencesBoundary update={update}>{children}</InheritedPreferencesBoundary>
}

function CompletePreferencesBoundary({ animations, children, theme }: Readonly<Preferences & { children: ReactNode }>) {
  const preferences = useMemo(() => Object.freeze({ theme, animations }), [theme, animations])
  const source = useMemo(() => fixedPreferencesSource(preferences), [preferences])
  return <PreferencesContext.Provider value={source}>{children}</PreferencesContext.Provider>
}

function InheritedPreferencesBoundary({ children, update }: Readonly<{ children: ReactNode, update: PreferencesUpdate }>) {
  const inherited = usePreferences()
  const preferences = useMemo(() => Object.freeze({ ...inherited, ...update }), [inherited, update])
  const source = useMemo(() => fixedPreferencesSource(preferences), [preferences])
  return <PreferencesContext.Provider value={source}>{children}</PreferencesContext.Provider>
}

function mergeAppearance(appearance: Appearance, update: AppearanceUpdate): Appearance {
  return Object.freeze({
    colors: mergeThemed(appearance.colors, update.colors),
    spacing: update.spacing ?? appearance.spacing,
    radius: update.radius ?? appearance.radius,
    shadow: mergeThemed(appearance.shadow, update.shadow),
    material: mergeThemed(appearance.material, update.material),
    transaction: Object.freeze({ ...appearance.transaction, ...update.transaction }),
  })
}

function mergeThemed<Value extends object>(current: Readonly<{ light: Value, dark: Value }>, update?: Readonly<{
  light?: Readonly<Partial<Value>>
  dark?: Readonly<Partial<Value>>
}>) {
  if (update === undefined) return current
  return Object.freeze({
    light: Object.freeze({ ...current.light, ...update.light }),
    dark: Object.freeze({ ...current.dark, ...update.dark })
  })
}
