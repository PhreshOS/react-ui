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
 * pointer from press to release and reports where it goes; the host carries out the move. A press
 * that begins in a document stays with it until it ends in every browser, so nothing else could
 * receive those positions.
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
    active.current?.gesture?.cancel()
    active.current = null
  }, [])

  return useMemo(() => {
    const point = (event: ReactPointerEvent<HTMLElement>) => ({ x: event.clientX, y: event.clientY })
    const matching = (event: ReactPointerEvent<HTMLElement>) => active.current?.pointer === event.pointerId
    const releaseCapture = (move: ActiveMove) => {
      if (move.element.hasPointerCapture(move.pointer)) move.element.releasePointerCapture(move.pointer)
    }
    const fail = (error: unknown) => {
      if (errorHandler.current) errorHandler.current(error)
      else if (typeof globalThis.reportError === "function") globalThis.reportError(error)
      else setTimeout(() => { throw error })
    }
    // The move ends here, whatever ended it: the element lets the pointer go and forgets the move.
    const close = (move: ActiveMove) => {
      if (active.current === move) active.current = null
      releaseCapture(move)
    }

    return {
      onPointerDown(event) {
        if (!beginHandler.current || !event.isPrimary || event.button !== 0 || active.current) return
        active.current = { pointer: event.pointerId, element: event.currentTarget, origin: point(event), gesture: null }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove(event) {
        const move = active.current
        const begin = beginHandler.current
        if (!matching(event) || !move) return
        const current = point(event)
        if (move.gesture) {
          move.gesture.move(current)
          return
        }
        // A press becomes a move once it travels a little; until then it may still be a click.
        if (!begin || Math.hypot(current.x - move.origin.x, current.y - move.origin.y) < 4) return
        try {
          const gesture = begin({ origin: move.origin, point: current })
          move.gesture = gesture
          // A failed start is reported through `ready`; its completion may reject as the same
          // failure and must not escape alone.
          void gesture.finished.catch(() => undefined)
          void gesture.ready.then(() => gesture.finished).then(() => close(move), error => {
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
        if (!matching(event)) return
        const move = active.current!
        if (move.gesture) move.gesture.end(point(event))
        close(move)
      },
      onPointerCancel(event) {
        if (!matching(event)) return
        const move = active.current!
        move.gesture?.cancel()
        close(move)
      },
      onLostPointerCapture(event) {
        // Capture held for the whole move: losing it before the release abandons the move.
        if (!matching(event)) return
        const move = active.current!
        move.gesture?.cancel()
        close(move)
      }
    }
  }, [])
}

interface ActiveMove {
  pointer: number
  element: HTMLElement
  origin: PresentationMovePoint
  gesture: PresentationMoveGesture | null
}
