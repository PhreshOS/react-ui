import type { ReactNode } from "react"
import { type Appearance, type DesktopPreferences as Preferences } from "@phreshos/core"
import MotionStyle from "./motion-style.js"
import { AppearanceContext, PreferencesContext, useAppearance, usePreferences } from "./appearance-context.js"

export { useAppearance, useBrowserPreferences, usePreferences, useThemedValue } from "./appearance-context.js"

/** Optionally overrides Appearance and complete visual Preferences for a React subtree. */
export function AppearanceProvider({ appearance, children, preferences }: AppearanceProviderProps) {
  const inheritedAppearance = useAppearance()
  const inheritedPreferences = usePreferences()
  const resolvedAppearance = appearance ?? inheritedAppearance
  const resolvedPreferences = preferences ?? inheritedPreferences

  return <AppearanceContext.Provider value={resolvedAppearance}>
    <PreferencesContext.Provider value={resolvedPreferences}>
      <MotionStyle />
      {children}
    </PreferencesContext.Provider>
  </AppearanceContext.Provider>
}

export interface AppearanceProviderProps {
  readonly appearance?: Appearance
  readonly children: ReactNode
  readonly preferences?: Preferences
}
