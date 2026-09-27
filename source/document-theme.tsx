import { useLayoutEffect } from "react"
import { usePreferences } from "./foundation/visual.js"

/**
 * Keeps the document's color scheme on the Theme of the nearest UIProvider,
 * or on the browser's without one. It writes the Theme into the document's
 * `<meta name="color-scheme">`, creating the element when the document has
 * none, before the browser paints, and follows every change. It renders
 * nothing; place it once, where the Theme that owns the page is provided.
 *
 * A page embedded in a frame needs its color scheme to match the frame's, or
 * the browser paints the frame opaque instead of letting what is behind it
 * show.
 */
export function DocumentTheme(): null {
  const { theme } = usePreferences()

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

  return null
}
