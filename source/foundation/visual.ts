import { createContext, useContext, useSyncExternalStore } from "react"
import {
  defaultAppearance,
  type Appearance,
  type AppearanceColors,
  type AppearanceMaterial,
  type AppearanceShadow,
  type Easing,
  type ThemedValue
} from "./appearance.js"
import type { Preferences } from "./preferences.js"

/**
 * One Appearance resolved for one set of Preferences. Every component reads
 * this single object instead of deriving its own view of Appearance, so equal
 * inputs share one identity across the whole tree.
 */
export interface Visual {
  readonly appearance: Appearance
  readonly preferences: Preferences
  readonly colors: AppearanceColors
  readonly material: AppearanceMaterial
  readonly shadow: AppearanceShadow
  readonly spacing: number
  readonly radius: number
  /** Duration in milliseconds, already zero when animations are disabled. */
  readonly duration: number
  /** CSS timing function for the Appearance transaction. */
  readonly easing: string
}

const visuals = new WeakMap<Appearance, Map<string, Visual>>()

/** Resolves and memoizes one Visual per Appearance, Theme, and animation preference. */
export function resolveVisual(appearance: Appearance, preferences: Preferences): Visual {
  let resolved = visuals.get(appearance)
  if (resolved === undefined) visuals.set(appearance, resolved = new Map())
  const key = `${preferences.theme}:${preferences.animations}`
  const cached = resolved.get(key)
  if (cached !== undefined) return cached

  const duration = preferences.animations ? appearance.transaction.duration : 0
  const visual: Visual = Object.freeze({
    appearance,
    preferences,
    colors: appearance.colors[preferences.theme],
    material: appearance.material[preferences.theme],
    shadow: appearance.shadow[preferences.theme],
    spacing: appearance.spacing,
    radius: appearance.radius,
    duration,
    easing: cssEasing(appearance.transaction.easing)
  })
  resolved.set(key, visual)
  return visual
}

export const AppearanceContext = createContext<Appearance>(defaultAppearance)

export interface PreferencesSource {
  readonly getSnapshot: () => Preferences
  readonly getServerSnapshot: () => Preferences
  readonly subscribe: (change: () => void) => () => void
}

/** Returns the nearest Appearance, or React UI's default. */
export function useAppearance(): Appearance {
  return useContext(AppearanceContext)
}

/** Returns the nearest complete Preferences, or reactively follows the browser. */
export function usePreferences(): Preferences {
  const source = useContext(PreferencesContext)
  return useSyncExternalStore(source.subscribe, source.getSnapshot, source.getServerSnapshot)
}

/** Returns the shared resolved Visual for the nearest Appearance and Preferences. */
export function useVisual(): Visual {
  return resolveVisual(useAppearance(), usePreferences())
}

/** Selects the active branch of one themed value. */
export function useThemedValue<Value>(value: ThemedValue<Value>): Value {
  return value[usePreferences().theme]
}

/** Reactively reads the browser's complete visual preferences. */
export function useBrowserPreferences(): Preferences {
  return useSyncExternalStore(
    browserPreferencesSource.subscribe,
    browserPreferencesSource.getSnapshot,
    browserPreferencesSource.getServerSnapshot
  )
}

/** Creates a stable source for one explicitly supplied Preferences value. */
export function fixedPreferencesSource(preferences: Preferences): PreferencesSource {
  return {
    getSnapshot: () => preferences,
    getServerSnapshot: () => preferences,
    subscribe: () => () => undefined
  }
}

export function cssEasing(easing: Easing): string {
  return typeof easing === "string" ? easing : `cubic-bezier(${easing.join(", ")})`
}

const defaultPreferences: Preferences = Object.freeze({ theme: "light", animations: true })
const subscribers = new Set<() => void>()
let darkPreference: MediaQueryList | undefined
let reducedMotionPreference: MediaQueryList | undefined
let browserSnapshot = defaultPreferences

function readBrowserPreferences(): Preferences {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return defaultPreferences
  darkPreference ??= window.matchMedia("(prefers-color-scheme: dark)")
  reducedMotionPreference ??= window.matchMedia("(prefers-reduced-motion: reduce)")
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

const browserPreferencesSource: PreferencesSource = {
  getSnapshot: readBrowserPreferences,
  getServerSnapshot: () => defaultPreferences,
  subscribe: subscribeBrowserPreferences
}

export const PreferencesContext = createContext<PreferencesSource>(browserPreferencesSource)
