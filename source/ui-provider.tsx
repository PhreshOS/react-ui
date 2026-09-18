import { useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import type { Appearance } from "./appearance.js"
import { AppearanceContext, fixedPreferencesSource, PreferencesContext } from "./appearance-context.js"
import { DirectionContext, fixedDirectionSource, type Direction } from "./direction.js"
import type { Preferences } from "./preferences.js"

export { useAppearance, useBrowserPreferences, usePreferences, useThemedValue } from "./appearance-context.js"
export { useDirection, useDocumentDirection } from "./direction.js"

const directionBoundaryStyle = { display: "contents" } satisfies CSSProperties

/** Establishes only the explicitly supplied UI values for a React subtree. */
export function UIProvider({ appearance, children, direction, preferences }: UIProviderProps) {
  let subtree = children
  const preferencesSource = useMemo(
    () => preferences === undefined ? undefined : fixedPreferencesSource(preferences),
    [preferences]
  )
  const directionSource = useMemo(
    () => direction === undefined ? undefined : fixedDirectionSource(direction),
    [direction]
  )

  if (preferencesSource !== undefined) {
    subtree = <PreferencesContext.Provider value={preferencesSource}>{subtree}</PreferencesContext.Provider>
  }

  if (appearance !== undefined) {
    subtree = <AppearanceContext.Provider value={appearance}>{subtree}</AppearanceContext.Provider>
  }

  if (directionSource !== undefined) {
    subtree = <DirectionContext.Provider value={directionSource}>
      <div dir={direction} style={directionBoundaryStyle}>{subtree}</div>
    </DirectionContext.Provider>
  }

  return subtree
}

export interface UIProviderProps {
  readonly appearance?: Appearance
  readonly children: ReactNode
  /** Establishes the concrete direction inherited by the provider subtree. */
  readonly direction?: Direction
  readonly preferences?: Preferences
}
