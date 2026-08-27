import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { Appearance, Theme, ThemedValue } from "@phreshos/core"

const missing = Symbol("AppearanceProvider")
const AppearanceContext = createContext<Appearance | typeof missing>(missing)
const ThemeContext = createContext<Theme | typeof missing>(missing)

/** Provides unresolved Appearance and one effective Theme to a React subtree. */
export function AppearanceProvider({ appearance, children, theme }: AppearanceProviderProps) {
  return <AppearanceContext.Provider value={appearance}>
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  </AppearanceContext.Provider>
}

/** Returns the complete unresolved Appearance supplied by the nearest provider. */
export function useAppearance(): Appearance {
  const appearance = useContext(AppearanceContext)
  if (appearance === missing) throw new Error("useAppearance() requires an AppearanceProvider")
  return appearance
}

/** Returns the effective Theme supplied by the nearest provider. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext)
  if (theme === missing) throw new Error("useTheme() requires an AppearanceProvider")
  return theme
}

/** Resolves one themed value only where it is consumed. */
export function useResolveTheme<Value, DarkValue extends Value = never>(value: ThemedValue<Value, DarkValue>): Exclude<Value, undefined> {
  const theme = useTheme()
  return (theme === "dark" && "dark" in value ? value.dark : value.light) as Exclude<Value, undefined>
}

/** Internal optional read for primitives that also accept direct values. */
export function useAppearanceIfAvailable(): Appearance | null {
  const appearance = useContext(AppearanceContext)
  return appearance === missing ? null : appearance
}

export interface AppearanceProviderProps {
  readonly appearance: Appearance
  readonly children: ReactNode
  readonly theme: Theme
}
