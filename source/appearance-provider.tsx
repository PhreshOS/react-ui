import { createContext, useContext, useSyncExternalStore } from "react"
import type { ReactNode } from "react"
import { defaultAppearance, type Appearance, type Theme, type ThemedValue } from "@phreshos/core"
import DocumentScrollbars from "./document-scrollbars.js"
import MotionStyle from "./motion-style.js"

const AppearanceContext = createContext<Appearance>(defaultAppearance)
const ThemeContext = createContext<Theme | null>(null)

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

/** Returns the nearest unresolved Appearance, or Core's complete default. */
export function useAppearance(): Appearance {
  return useContext(AppearanceContext)
}

/** Returns the nearest explicit Theme, or reactively follows the browser. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext)
  const browserTheme = useBrowserTheme()
  return theme ?? browserTheme
}

/** Resolves one themed value only where it is consumed. */
export function useResolveTheme<Value, DarkValue extends Value = never>(value: ThemedValue<Value, DarkValue>): Exclude<Value, undefined> {
  const theme = useTheme()
  return (theme === "dark" && "dark" in value ? value.dark : value.light) as Exclude<Value, undefined>
}

export interface AppearanceProviderProps {
  readonly appearance?: Appearance
  readonly children: ReactNode
  readonly theme?: Theme
}

function useBrowserTheme(): Theme {
  return useSyncExternalStore(subscribeBrowserTheme, browserTheme, serverTheme)
}

function subscribeBrowserTheme(change: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined
  const preference = window.matchMedia(darkThemeQuery)
  preference.addEventListener("change", change)
  return () => preference.removeEventListener("change", change)
}

function browserTheme(): Theme {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(darkThemeQuery).matches
    ? "dark"
    : "light"
}

function serverTheme(): Theme { return "light" }

const darkThemeQuery = "(prefers-color-scheme: dark)"
