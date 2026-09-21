import { useMemo } from "react"
import type { KeyboardEventHandler, ReactNode } from "react"
import { useLocale } from "react-aria/I18nProvider"
import type { Direction } from "./direction.js"

const ariaDirectionBoundary = "data-phreshos-ui-aria-direction"

const redirectedEvents = new WeakSet<Event>()

/** Aligns React Aria's directional keyboard behavior with the React UI direction contract. */
export function useAriaDirectionBridge(
  direction: Direction
): KeyboardEventHandler<HTMLElement> | undefined {
  const { direction: ariaDirection } = useLocale()

  return useMemo(() => {
    if (direction === ariaDirection) return undefined

    return event => {
      if (redirectedEvents.has(event.nativeEvent)) return
      if (event.defaultPrevented || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return

      const target = event.target
      if (!(target instanceof Element) || target.closest(`[${ariaDirectionBoundary}]`) !== event.currentTarget) return
      const editable = target.closest("[contenteditable=true]")
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (editable && editable.getAttribute("role") !== "spinbutton")) return

      event.preventDefault()
      event.stopPropagation()

      // React Aria currently derives keyboard direction from locale. Redirect only
      // the directional key so language and every other locale behavior stay intact.
      const redirected = new KeyboardEvent(event.nativeEvent.type, {
        key: event.key === "ArrowLeft" ? "ArrowRight" : "ArrowLeft",
        code: event.code,
        location: event.location,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
        bubbles: true,
        cancelable: true,
        composed: true
      })
      redirectedEvents.add(redirected)
      target.dispatchEvent(redirected)
    }
  }, [ariaDirection, direction])
}

/** Owns the non-layout DOM boundary needed to intercept React Aria keyboard behavior. */
export function AriaDirectionBoundary({ children, direction }: Readonly<{
  children: ReactNode
  direction: Direction
}>) {
  const onKeyDownCapture = useAriaDirectionBridge(direction)

  return <div
    dir={direction}
    data-phreshos-ui-aria-direction=""
    onKeyDownCapture={onKeyDownCapture}
    style={{ display: "contents" }}
  >{children}</div>
}
