import type { CSSProperties, ReactNode } from "react"
import { type Appearance, type DesktopPreferences as Preferences } from "@phreshos/core"
import MotionStyle from "./motion-style.js"
import { AppearanceContext, PreferencesContext, useAppearance, usePreferences } from "./appearance-context.js"
import { DirectionContext, useDocumentDirection, type Direction } from "./direction.js"

export { useAppearance, useBrowserPreferences, usePreferences, useThemedValue } from "./appearance-context.js"
export { useDirection, useDocumentDirection } from "./direction.js"

const directionBoundaryStyle = { display: "contents" } satisfies CSSProperties

/** Supplies the complete shared environment of a React UI subtree. */
export function UIProvider({ appearance, children, direction, preferences }: UIProviderProps) {
  const inheritedAppearance = useAppearance()
  const inheritedPreferences = usePreferences()
  const documentDirection = useDocumentDirection()
  const resolvedAppearance = appearance ?? inheritedAppearance
  const resolvedDirection = direction ?? documentDirection
  const resolvedPreferences = preferences ?? inheritedPreferences

  return <DirectionContext.Provider value={resolvedDirection}>
    <div dir={resolvedDirection} style={directionBoundaryStyle}>
      <AppearanceContext.Provider value={resolvedAppearance}>
        <PreferencesContext.Provider value={resolvedPreferences}>
          <MotionStyle />
          {children}
        </PreferencesContext.Provider>
      </AppearanceContext.Provider>
    </div>
  </DirectionContext.Provider>
}

export interface UIProviderProps {
  readonly appearance?: Appearance
  readonly children: ReactNode
  /** Establishes the concrete direction inherited by the provider subtree. */
  readonly direction?: Direction
  readonly preferences?: Preferences
}
