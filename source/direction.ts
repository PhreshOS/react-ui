import { createContext, useContext, useSyncExternalStore } from "react"

/** The two concrete directions supported by React UI behavior. */
export type Direction = "ltr" | "rtl"

interface DirectionSource {
  readonly getSnapshot: () => Direction
  readonly getServerSnapshot: () => Direction
  readonly subscribe: (change: () => void) => () => void
}

/** Resolves a concrete element override before falling back to its React UI environment. */
export function resolveDirection(value: string | undefined, fallback: Direction): Direction {
  return value === "ltr" || value === "rtl" ? value : fallback
}

/** Returns the nearest guaranteed React UI direction, or the document direction. */
export function useDirection(): Direction {
  const source = useContext(DirectionContext)
  return useSyncExternalStore(source.subscribe, source.getSnapshot, source.getServerSnapshot)
}

/** Reactively reads the explicit direction of the document's HTML element. */
export function useDocumentDirection(): Direction {
  return useSyncExternalStore(
    documentDirectionSource.subscribe,
    documentDirectionSource.getSnapshot,
    documentDirectionSource.getServerSnapshot
  )
}

/** Creates a stable source for one explicitly established direction boundary. */
export function fixedDirectionSource(direction: Direction): DirectionSource {
  return {
    getSnapshot: () => direction,
    getServerSnapshot: () => direction,
    subscribe: () => () => undefined
  }
}

const subscribers = new Set<() => void>()
let observer: MutationObserver | undefined

function subscribeDocumentDirection(change: () => void) {
  subscribers.add(change)
  if (subscribers.size === 1 && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => {
      for (const subscriber of subscribers) subscriber()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] })
  }

  return () => {
    subscribers.delete(change)
    if (subscribers.size === 0) {
      observer?.disconnect()
      observer = undefined
    }
  }
}

function documentDirection(): Direction {
  if (typeof document === "undefined") return serverDirection()
  return document.documentElement.getAttribute("dir")?.toLowerCase() === "rtl" ? "rtl" : "ltr"
}

function serverDirection(): Direction {
  return "ltr"
}

const documentDirectionSource: DirectionSource = {
  getSnapshot: documentDirection,
  getServerSnapshot: serverDirection,
  subscribe: subscribeDocumentDirection
}

export const DirectionContext = createContext<DirectionSource>(documentDirectionSource)
