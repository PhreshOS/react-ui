import type { ReactNode } from "react"
import { type Appearance, type Theme } from "@phreshos/core"
import DocumentScrollbars from "./document-scrollbars.js"
import MotionStyle from "./motion-style.js"
import { AppearanceContext, ThemeContext, useAppearance, useTheme } from "./appearance-context.js"

export { useAppearance, useTheme, useThemedValue } from "./appearance-context.js"

/** Optionally overrides unresolved Appearance and effective Theme for a React subtree. */
export function AppearanceProvider({ appearance, children, theme }: AppearanceProviderProps) {
  const inheritedAppearance = useAppearance()
  const inheritedTheme = useTheme()
  const resolvedAppearance = appearance ?? inheritedAppearance
  const resolvedTheme = theme ?? inheritedTheme

  return <AppearanceContext.Provider value={resolvedAppearance}>
    <ThemeContext.Provider value={resolvedTheme}>
      <MotionStyle />
      <DocumentScrollbars appearance={resolvedAppearance} theme={resolvedTheme} />
      {children}
    </ThemeContext.Provider>
  </AppearanceContext.Provider>
}

export interface AppearanceProviderProps {
  readonly appearance?: Appearance
  readonly children: ReactNode
  readonly theme?: Theme
}
