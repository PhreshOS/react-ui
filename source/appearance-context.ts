import { createContext, useContext, useMemo, useSyncExternalStore } from "react"
import { defaultAppearance, type Appearance, type ThemedValue } from "./appearance.js"
import type { Preferences } from "./preferences.js"

export const AppearanceContext = createContext<Appearance>(defaultAppearance)

export interface PreferencesSource {
  readonly getSnapshot: () => Preferences
  readonly getServerSnapshot: () => Preferences
  readonly subscribe: (change: () => void) => () => void
}

/** Returns the nearest unresolved appearance, or React UI's default. */
export function useAppearance(): Appearance {
  return useContext(AppearanceContext)
}

/** Returns the nearest complete Preferences, or reactively follows the browser. */
export function usePreferences(): Preferences {
  const source = useContext(PreferencesContext)
  return useSyncExternalStore(source.subscribe, source.getSnapshot, source.getServerSnapshot)
}

/** Reactively reads the browser's complete visual preferences. */
export function useBrowserPreferences(): Preferences {
  return useSyncExternalStore(
    browserPreferencesSource.subscribe,
    browserPreferencesSource.getSnapshot,
    browserPreferencesSource.getServerSnapshot
  )
}

/** Selects the active branch of one complete ThemedValue. */
export function useThemedValue<Value>(value: ThemedValue<Value>): Value {
  return value[usePreferences().theme]
}

/** Resolves one coherent Appearance snapshot for internal component derivation. */
export function useResolvedAppearance() {
  const appearance = useAppearance()
  const preferences = usePreferences()
  return useMemo(() => ({
    appearance,
    preferences,
    colors: appearance.colors[preferences.theme],
    material: appearance.material[preferences.theme],
    shadow: appearance.shadow[preferences.theme],
    transaction: appearance.transaction
  }), [appearance, preferences])
}

/** Creates a stable source for a complete explicitly supplied Preferences value. */
export function fixedPreferencesSource(preferences: Preferences): PreferencesSource {
  return {
    getSnapshot: () => preferences,
    getServerSnapshot: () => preferences,
    subscribe: emptySubscription
  }
}

const defaultPreferences: Preferences = Object.freeze({ theme: "light", animations: true })
const subscribers = new Set<() => void>()
let darkPreference: MediaQueryList | undefined
let reducedMotionPreference: MediaQueryList | undefined
let browserSnapshot = defaultPreferences

function readBrowserPreferences(): Preferences {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return defaultPreferences
  darkPreference ??= window.matchMedia(darkThemeQuery)
  reducedMotionPreference ??= window.matchMedia(reducedMotionQuery)
  const theme = darkPreference.matches ? "dark" : "light"
  const animations = !reducedMotionPreference.matches
  if (browserSnapshot.theme !== theme || browserSnapshot.animations !== animations) {
    browserSnapshot = Object.freeze({ theme, animations })
  }
  return browserSnapshot
}

function subscribeBrowserPreferences(change: () => void) {
  subscribers.add(change)
  readBrowserPreferences()

  if (subscribers.size === 1) {
    darkPreference?.addEventListener("change", publishBrowserPreferences)
    reducedMotionPreference?.addEventListener("change", publishBrowserPreferences)
  }

  return () => {
    subscribers.delete(change)
    if (subscribers.size !== 0) return
    darkPreference?.removeEventListener("change", publishBrowserPreferences)
    reducedMotionPreference?.removeEventListener("change", publishBrowserPreferences)
    darkPreference = undefined
    reducedMotionPreference = undefined
  }
}

function publishBrowserPreferences() {
  readBrowserPreferences()
  for (const subscriber of subscribers) subscriber()
}

function emptySubscription() {
  return () => undefined
}

const browserPreferencesSource: PreferencesSource = {
  getSnapshot: readBrowserPreferences,
  getServerSnapshot: () => defaultPreferences,
  subscribe: subscribeBrowserPreferences
}

export const PreferencesContext = createContext<PreferencesSource>(browserPreferencesSource)

const darkThemeQuery = "(prefers-color-scheme: dark)"
const reducedMotionQuery = "(prefers-reduced-motion: reduce)"
