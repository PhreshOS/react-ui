import { createContext, useContext, useSyncExternalStore } from "react"
import { defaultAppearance, type Appearance, type Theme, type ThemedValue } from "@phreshos/core"

export const AppearanceContext = createContext<Appearance>(defaultAppearance)
export const ThemeContext = createContext<Theme | null>(null)

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

/** Selects the active branch of one complete ThemedValue. */
export function useThemedValue<Value>(value: ThemedValue<Value>): Value {
  return value[useTheme()]
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
