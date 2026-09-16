import { createContext, useContext, useSyncExternalStore } from "react"

/** The two concrete directions supported by React UI behavior. */
export type Direction = "ltr" | "rtl"

export const DirectionContext = createContext<Direction | null>(null)

/** Resolves a concrete element override before falling back to its React UI environment. */
export function resolveDirection(value: string | undefined, fallback: Direction): Direction {
  return value === "ltr" || value === "rtl" ? value : fallback
}

/** Returns the nearest guaranteed React UI direction, or the document direction. */
export function useDirection(): Direction {
  const direction = useContext(DirectionContext)
  const documentDirection = useDocumentDirection()
  return direction ?? documentDirection
}

/** Reactively reads the explicit direction of the document's HTML element. */
export function useDocumentDirection(): Direction {
  return useSyncExternalStore(subscribeDocumentDirection, documentDirection, serverDirection)
}

function subscribeDocumentDirection(change: () => void) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return () => undefined

  const observer = new MutationObserver(change)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] })
  return () => observer.disconnect()
}

function documentDirection(): Direction {
  if (typeof document === "undefined") return serverDirection()
  return document.documentElement.getAttribute("dir")?.toLowerCase() === "rtl" ? "rtl" : "ltr"
}

function serverDirection(): Direction {
  return "ltr"
}
