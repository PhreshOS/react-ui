import type { ReactNode } from "react"
import { type Appearance, type DesktopPreferences as Preferences } from "@phreshos/core"
import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react/direction-provider"
import MotionStyle from "./motion-style.js"
import { AppearanceContext, PreferencesContext, useAppearance, usePreferences } from "./appearance-context.js"
import { DirectionContext, useDirection, type Direction } from "./direction.js"

export { useAppearance, useBrowserPreferences, usePreferences, useThemedValue } from "./appearance-context.js"
export { useDirection, useDocumentDirection } from "./direction.js"

/** Supplies Appearance, complete visual Preferences, and direction to a React UI subtree. */
export function AppearanceProvider({ appearance, children, direction, preferences }: AppearanceProviderProps) {
  const inheritedAppearance = useAppearance()
  const inheritedDirection = useDirection()
  const inheritedPreferences = usePreferences()
  const resolvedAppearance = appearance ?? inheritedAppearance
  const resolvedDirection = direction ?? inheritedDirection
  const resolvedPreferences = preferences ?? inheritedPreferences

  return <DirectionContext.Provider value={resolvedDirection}>
    <BaseDirectionProvider direction={resolvedDirection}>
      <AppearanceContext.Provider value={resolvedAppearance}>
        <PreferencesContext.Provider value={resolvedPreferences}>
          <MotionStyle />
          {children}
        </PreferencesContext.Provider>
      </AppearanceContext.Provider>
    </BaseDirectionProvider>
  </DirectionContext.Provider>
}

export interface AppearanceProviderProps {
  readonly appearance?: Appearance
  readonly children: ReactNode
  /** Overrides the document direction for every React UI component in this subtree. */
  readonly direction?: Direction
  readonly preferences?: Preferences
}
