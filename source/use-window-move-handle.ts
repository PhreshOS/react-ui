import type { BeginPresentationMoveGesture, PresentationMoveGesture, PresentationMovePoint } from "@phreshos/core"
import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type PointerEventHandler } from "react"

export interface WindowMoveHandle {
  onPointerDown: PointerEventHandler<HTMLElement>
  onPointerMove: PointerEventHandler<HTMLElement>
  onPointerUp: PointerEventHandler<HTMLElement>
  onPointerCancel: PointerEventHandler<HTMLElement>
  onLostPointerCapture: PointerEventHandler<HTMLElement>
}

/**
 * Turns one DOM element into a move handle for any compatible host gesture. The element holds the
 * pointer until the press becomes a move, then lets it go, so the host may take it; the document
 * reports whatever of the pointer still reaches it, where the hand takes it and where it is let go.
 */
export default function useWindowMoveHandle(
  beginMoveGesture?: BeginPresentationMoveGesture,
  onError?: (error: unknown) => void
): WindowMoveHandle {
  const active = useRef<ActiveMove | null>(null)
  const beginHandler = useRef(beginMoveGesture)
  const errorHandler = useRef(onError)
  beginHandler.current = beginMoveGesture
  errorHandler.current = onError

  useEffect(() => () => {
    const move = active.current
    if (!move) return
    close(move)
    move.gesture?.cancel()
  }, [])

  return useMemo(() => {
    const point = (event: PointerEvent | ReactPointerEvent<HTMLElement>) => ({ x: event.clientX, y: event.clientY })
    const fail = (error: unknown) => {
      if (errorHandler.current) errorHandler.current(error)
      else if (typeof globalThis.reportError === "function") globalThis.reportError(error)
      else setTimeout(() => { throw error })
    }

    // Once the move began, the pointer may leave the element: the document hears what still reaches it.
    function follow(move: ActiveMove, gesture: PresentationMoveGesture) {
      const document = move.element.ownerDocument
      const moved = (event: PointerEvent) => {
        if (event.pointerId !== move.pointer || active.current !== move) return
        // The window moving under a still pointer brings a pointer move the hand did not make; reported,
        // it would move the window again, and again, for places nobody chose.
        if (event.movementX === 0 && event.movementY === 0) return
        gesture.move(point(event))
      }
      const released = (event: PointerEvent) => {
        if (event.pointerId !== move.pointer || active.current !== move) return
        close(move)
        if (event.type === "pointerup") gesture.end()
        else gesture.cancel()
      }
      document.addEventListener("pointermove", moved, true)
      document.addEventListener("pointerup", released, true)
      document.addEventListener("pointercancel", released, true)
      move.unfollow = () => {
        document.removeEventListener("pointermove", moved, true)
        document.removeEventListener("pointerup", released, true)
        document.removeEventListener("pointercancel", released, true)
      }
    }

    return {
      onPointerDown(event) {
        if (!beginHandler.current || !event.isPrimary || event.button !== 0 || active.current) return
        active.current = { pointer: event.pointerId, element: event.currentTarget, origin: point(event), gesture: null, unfollow: null }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove(event) {
        const move = active.current
        const begin = beginHandler.current
        if (!move || move.gesture || move.pointer !== event.pointerId) return
        if (event.movementX === 0 && event.movementY === 0) return
        const current = point(event)
        // A press becomes a move once it travels a little; until then it may still be a click.
        if (!begin || Math.hypot(current.x - move.origin.x, current.y - move.origin.y) < 4) return
        try {
          const gesture = begin(move.origin)
          move.gesture = gesture
          gesture.move(current)
          follow(move, gesture)
          // The host may take the pointer from here; until it does, the document still hears it.
          if (move.element.hasPointerCapture(move.pointer)) move.element.releasePointerCapture(move.pointer)
          void gesture.finished.then(() => close(move), error => {
            close(move)
            fail(error)
          })
        }
        catch (error) {
          close(move)
          fail(error)
        }
      },
      onPointerUp(event) {
        // A press that never became a move.
        const move = active.current
        if (!move || move.gesture || move.pointer !== event.pointerId) return
        close(move)
      },
      onPointerCancel(event) {
        const move = active.current
        if (!move || move.gesture || move.pointer !== event.pointerId) return
        close(move)
      },
      onLostPointerCapture(event) {
        // Before the press became a move, losing the pointer abandons it; after, the handle let it go.
        const move = active.current
        if (!move || move.gesture || move.pointer !== event.pointerId) return
        close(move)
      }
    }
  }, [])

  // The move ends here, whatever ended it: the element lets the pointer go and forgets the move.
  function close(move: ActiveMove) {
    if (active.current === move) active.current = null
    move.unfollow?.()
    move.unfollow = null
    if (move.element.hasPointerCapture(move.pointer)) move.element.releasePointerCapture(move.pointer)
  }
}

interface ActiveMove {
  pointer: number
  element: HTMLElement
  origin: PresentationMovePoint
  gesture: PresentationMoveGesture | null
  unfollow: (() => void) | null
}
