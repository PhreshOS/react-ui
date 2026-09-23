import type { BeginWindowMoveGesture, WindowMoveGesture, WindowMovePoint } from "@phreshos/core"
import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type PointerEventHandler } from "react"

export interface WindowMoveHandle {
  onPointerDown: PointerEventHandler<HTMLElement>
  onPointerMove: PointerEventHandler<HTMLElement>
  onPointerUp: PointerEventHandler<HTMLElement>
  onPointerCancel: PointerEventHandler<HTMLElement>
  onLostPointerCapture: PointerEventHandler<HTMLElement>
}

/** Turns one DOM element into a move handle for any compatible host gesture. */
export default function useWindowMoveHandle(
  beginMoveGesture?: BeginWindowMoveGesture,
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
    const cancel = (event: ReactPointerEvent<HTMLElement>) => {
      if (!matching(event)) return
      const move = active.current
      active.current = null
      move?.gesture?.cancel()
      if (move) releaseCapture(move)
    }

    return {
      onPointerDown(event) {
        if (!beginHandler.current || !event.isPrimary || event.button !== 0 || active.current) return
        active.current = {
          pointer: event.pointerId,
          element: event.currentTarget,
          origin: point(event),
          gesture: null,
          handedOff: false
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove(event) {
        const move = active.current
        const begin = beginHandler.current
        if (!begin || !matching(event) || !move || move.gesture) return
        const current = point(event)
        if (Math.hypot(current.x - move.origin.x, current.y - move.origin.y) < 4) return
        try {
          // Capture proves that an intentional drag began. Releasing it lets
          // the ready host receive the continuous pointer stream without transport.
          const gesture = begin({ origin: move.origin, point: current })
          move.gesture = gesture
          // A failed handoff is reported through `ready`; its corresponding
          // completion may reject as the same failure and must not escape alone.
          void gesture.finished.catch(() => undefined)
          void gesture.ready.then(() => {
            if (active.current !== move) {
              gesture.cancel()
              return gesture.finished
            }
            move.handedOff = true
            releaseCapture(move)
            return gesture.finished
          }).then(() => {
            if (active.current === move) active.current = null
          }, error => {
            if (active.current === move) {
              active.current = null
              releaseCapture(move)
            }
            fail(error)
          })
        }
        catch (error) {
          active.current = null
          releaseCapture(move)
          fail(error)
        }
      },
      onPointerUp(event) {
        if (!matching(event)) return
        const move = active.current
        active.current = null
        move?.gesture?.cancel()
        if (move) releaseCapture(move)
      },
      onPointerCancel: cancel,
      onLostPointerCapture(event) {
        if (!matching(event)) return
        // Losing capture after handoff is expected because the host now owns
        // the pointer. Before handoff it means the local candidate was abandoned.
        const move = active.current
        if (move && !move.handedOff) {
          active.current = null
          move.gesture?.cancel()
        }
      }
    }
  }, [])
}

interface ActiveMove {
  pointer: number
  element: HTMLElement
  origin: WindowMovePoint
  gesture: WindowMoveGesture | null
  handedOff: boolean
}
