import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { ThemeProperties } from "@phreshos/core"

const missing = Symbol("ThemeProvider")
const ThemeContext = createContext<ThemeProperties | typeof missing>(missing)

/** Provides the nearest Theme value to one React subtree. */
export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

/** Returns the complete snapshot supplied by the nearest ThemeProvider. */
export function useTheme() {
  const properties = useContext(ThemeContext)

  if (properties === missing) throw new Error("useTheme() requires a ThemeProvider")

  return properties
}

/** Internal optional read used by primitives with both raw and themed values. */
export function useThemeIfAvailable() {
  const properties = useContext(ThemeContext)
  return properties === missing ? null : properties
}

/** Properties accepted by ThemeProvider. */
export interface ThemeProviderProps {
  /** Content that receives this Theme instead of any outer Theme. */
  readonly children: ReactNode

  /** Complete Theme value for this subtree. */
  readonly theme: ThemeProperties
}
