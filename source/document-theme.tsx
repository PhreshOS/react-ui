import { useContext, useLayoutEffect, useRef, type ReactElement } from "react"
import { DocumentThemeOwner, themeTransition, themeTransitionDuration, themeTransitionEasing } from "./foundation/provider.js"
import { usePreferences } from "./foundation/visual.js"

/** Marks the document while its Theme changes, so what it paints changes in one step. */
const changing = "data-phreshos-theme-change"

/**
 * While the Theme changes, nothing in the document eases toward the new colors: the Desktop that
 * holds the page moves from one Theme to the other as a whole, and a page easing on its own would
 * keep changing after the Desktop has finished. Pseudo-elements carry Surface paint, so they
 * change at once too.
 */
const instantThemeRule = `
html[${changing}] *,
html[${changing}] *::before,
html[${changing}] *::after {
  transition-delay: 0s !important;
  transition-duration: 0s !important;
}
html[${themeTransition}]::view-transition-old(root),
html[${themeTransition}]::view-transition-new(root) {
  animation-duration: var(${themeTransitionDuration});
  animation-timing-function: var(${themeTransitionEasing});
}
`

/**
 * Keeps the document's color scheme on the Theme of the nearest UIProvider,
 * or on the browser's without one. It writes the Theme into the document's
 * `<meta name="color-scheme">`, creating the element when the document has
 * none, before the browser paints, and follows every change. It renders
 * nothing in place; place it once, where the Theme that owns the page is
 * provided.
 *
 * A page embedded in a frame needs its color scheme to match the frame's, or
 * the browser paints the frame opaque instead of letting what is behind it
 * show.
 *
 * It also makes the Theme the page's own: when it changes, the page crosses
 * from how it looked to how it looks in the new Theme, with the Appearance
 * transaction, as the Desktop around it does. Nothing in the page eases on its
 * own meanwhile, so the page changes in one step, inside that crossing.
 */
export function DocumentTheme(): ReactElement {
  const { theme } = usePreferences()
  const shown = useRef(theme)
  const owner = useContext(DocumentThemeOwner)

  useLayoutEffect(() => {
    if (!owner) return
    owner.current = true
    return () => { owner.current = false }
  }, [owner])

  useLayoutEffect(() => {
    if (shown.current === theme) return
    shown.current = theme
    // Set before the browser paints the new colors, and kept until they have been painted.
    const root = document.documentElement
    root.setAttribute(changing, "")
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => root.removeAttribute(changing)) })
    return () => {
      cancelAnimationFrame(frame)
      root.removeAttribute(changing)
    }
  }, [theme])

  useLayoutEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="color-scheme" i]')
    const meta = existing ?? document.head.appendChild(Object.assign(document.createElement("meta"), { name: "color-scheme" }))
    const previous = meta.content
    meta.content = theme

    return () => {
      if (existing) meta.content = previous
      else meta.remove()
    }
  }, [theme])

  return <style href="phreshos-document-theme" precedence="phreshos">{instantThemeRule}</style>
}
