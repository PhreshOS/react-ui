import { LucideProvider } from "lucide-react"
import { useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import { mergeAppearance, type AppearanceUpdate } from "./appearance.js"
import { DirectionContext, fixedDirectionSource, type Direction } from "./direction.js"
import type { Preferences, PreferencesUpdate } from "./preferences.js"
import { AppearanceContext, fixedPreferencesSource, PreferencesContext, useAppearance, usePreferences } from "./visual.js"

const directionBoundaryStyle = { display: "contents" } satisfies CSSProperties

export interface UIProviderProps {
  readonly appearance?: AppearanceUpdate
  readonly children: ReactNode
  /** Establishes the concrete direction inherited by the provider subtree. */
  readonly direction?: Direction
  readonly preferences?: PreferencesUpdate
}

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

  // Icons are not a supplied value: every provider gives its subtree the same
  // icon treatment. An icon follows its text size and color, with a constant
  // 1.5px stroke; a `size` or `strokeWidth` on the icon still wins.
  return <LucideProvider size={iconSize} strokeWidth={1.5} nonScalingStroke>{subtree}</LucideProvider>
}

// Lucide types its default size as a number, but passes it to the SVG size
// attributes, which take any CSS length.
const iconSize = "1em" as unknown as number

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
  const source = useMemo(() => fixedPreferencesSource(Object.freeze({ theme, animations })), [theme, animations])
  return <PreferencesContext.Provider value={source}>{children}</PreferencesContext.Provider>
}

function InheritedPreferencesBoundary({ children, update }: Readonly<{ children: ReactNode, update: PreferencesUpdate }>) {
  const inherited = usePreferences()
  const theme = update.theme ?? inherited.theme
  const animations = update.animations ?? inherited.animations
  const source = useMemo(() => fixedPreferencesSource(Object.freeze({ theme, animations })), [theme, animations])
  return <PreferencesContext.Provider value={source}>{children}</PreferencesContext.Provider>
}
