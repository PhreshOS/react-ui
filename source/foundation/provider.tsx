import { LucideProvider } from "lucide-react"
import { createContext, useLayoutEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { RouterProvider } from "react-aria-components"
import type { CSSProperties, ReactNode } from "react"
import { mergeAppearance, type AppearanceUpdate } from "./appearance.js"
import { DirectionContext, fixedDirectionSource, type Direction } from "./direction.js"
import type { Preferences, PreferencesUpdate, Theme } from "./preferences.js"
import { AppearanceContext, cssEasing, fixedPreferencesSource, PreferencesContext, useAppearance, usePreferences } from "./visual.js"

const directionBoundaryStyle = { display: "contents" } satisfies CSSProperties

export interface UIProviderProps {
  readonly appearance?: AppearanceUpdate
  readonly children: ReactNode
  /** Establishes the concrete direction inherited by the provider subtree. */
  readonly direction?: Direction
  /**
   * Follows a link inside the app, such as a Button `href`, with the app's own
   * router instead of a page load. Links to other sites, links with a `target`,
   * and modified clicks are left to the browser.
   */
  readonly navigate?: (href: string) => void
  readonly preferences?: PreferencesUpdate
}

/** Establishes only the explicitly supplied UI values for a React subtree. */
export function UIProvider({ appearance, children, direction, navigate, preferences }: UIProviderProps) {
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

  if (navigate !== undefined) subtree = <RouterProvider navigate={navigate}>{subtree}</RouterProvider>

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
  return <ShownPreferences theme={theme} animations={animations}>{children}</ShownPreferences>
}

function InheritedPreferencesBoundary({ children, update }: Readonly<{ children: ReactNode, update: PreferencesUpdate }>) {
  const inherited = usePreferences()
  return <ShownPreferences theme={update.theme ?? inherited.theme} animations={update.animations ?? inherited.animations}>{children}</ShownPreferences>
}

/**
 * Whether the Theme of the nearest boundary is the page's own. `DocumentTheme` says so; a Theme
 * that owns the page moves the whole page from one Theme to the other.
 */
export const DocumentThemeOwner = createContext<{ current: boolean } | null>(null)

/** The Theme a page moves between, marked while it does, with its timing. */
export const themeTransition = "data-phreshos-theme-transition"
export const themeTransitionDuration = "--phreshos-theme-transition-duration"
export const themeTransitionEasing = "--phreshos-theme-transition-easing"

type ViewTransitionDocument = Document & Readonly<{
  startViewTransition?: (update: () => void) => Readonly<{ finished: Promise<unknown> }>
}>

/** How many page transitions have started, so only the latest one ends the mark. */
let transitions = 0

/**
 * Provides the Theme the subtree shows. A new Theme is shown at once, unless it is the page's own
 * and moves with animations: then the page is taken as it looks, shown in the new Theme, and the
 * two views cross with the Appearance transaction, as the Desktop does around the page.
 */
function ShownPreferences({ animations, children, theme }: Readonly<Preferences & { children: ReactNode }>) {
  const [shown, setShown] = useState<Theme>(theme)
  const owner = useRef({ current: false }).current
  const { transaction } = useAppearance()

  useLayoutEffect(() => {
    if (shown === theme) return
    const page = document as ViewTransitionDocument
    if (!owner.current || !animations || typeof page.startViewTransition !== "function") {
      setShown(theme)
      return
    }
    const root = document.documentElement
    const transition = ++transitions
    root.setAttribute(themeTransition, "")
    root.style.setProperty(themeTransitionDuration, `${transaction.duration}ms`)
    root.style.setProperty(themeTransitionEasing, cssEasing(transaction.easing))
    const view = page.startViewTransition.call(page, () => flushSync(() => setShown(theme)))
    const end = () => {
      if (transition !== transitions) return
      root.removeAttribute(themeTransition)
      root.style.removeProperty(themeTransitionDuration)
      root.style.removeProperty(themeTransitionEasing)
    }
    view.finished.then(end, end)
  }, [theme, shown, animations, owner, transaction])

  const source = useMemo(() => fixedPreferencesSource(Object.freeze({ theme: shown, animations })), [shown, animations])
  return <DocumentThemeOwner.Provider value={owner}>
    <PreferencesContext.Provider value={source}>{children}</PreferencesContext.Provider>
  </DocumentThemeOwner.Provider>
}
