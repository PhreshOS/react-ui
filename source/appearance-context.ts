import { createContext, useContext, useMemo, useSyncExternalStore } from "react"
import { defaultAppearance, type Appearance, type ThemedValue } from "./appearance.js"
import type { Preferences } from "./preferences.js"

export const AppearanceContext = createContext<Appearance>(defaultAppearance)
export const PreferencesContext = createContext<Preferences | null>(null)

/** Returns the nearest unresolved appearance, or React UI's default. */
export function useAppearance(): Appearance {
  return useContext(AppearanceContext)
}

/** Returns the nearest complete Preferences, or reactively follows the browser. */
export function usePreferences(): Preferences {
  const preferences = useContext(PreferencesContext)
  const browserPreferences = useBrowserPreferences()
  return preferences ?? browserPreferences
}

/** Reactively reads the browser's complete visual preferences. */
export function useBrowserPreferences(): Preferences {
  const theme = useMediaPreference(darkThemeQuery) ? "dark" : "light"
  const animations = !useMediaPreference(reducedMotionQuery)
  return useMemo(() => ({ theme, animations }), [animations, theme])
}

/** Selects the active branch of one complete ThemedValue. */
export function useThemedValue<Value>(value: ThemedValue<Value>): Value {
  return value[usePreferences().theme]
}

function useMediaPreference(query: string): boolean {
  return useSyncExternalStore(
    change => subscribeMediaPreference(query, change),
    () => browserMediaPreference(query),
    () => false
  )
}

function subscribeMediaPreference(query: string, change: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined
  const preference = window.matchMedia(query)
  preference.addEventListener("change", change)
  return () => preference.removeEventListener("change", change)
}

function browserMediaPreference(query: string): boolean {
  return Boolean(typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(query).matches)
}

const darkThemeQuery = "(prefers-color-scheme: dark)"
const reducedMotionQuery = "(prefers-reduced-motion: reduce)"
