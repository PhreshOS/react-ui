import { act, renderHook } from "@testing-library/react"
import type { BeginPresentationMoveGesture, PresentationMoveGesture } from "@phreshos/core"
import { describe, expect, it, vi } from "vitest"
import useWindowMoveHandle from "../source/use-window-move-handle.js"

describe("Window move handle", function () {
  function setup() {
    const gesture = { finished: new Promise<void>(() => undefined), move: vi.fn(), end: vi.fn(), cancel: vi.fn() } satisfies PresentationMoveGesture
    const begin = vi.fn(() => gesture) satisfies BeginPresentationMoveGesture
    const captured = new Set<number>()
    const currentTarget = {
      ownerDocument: document,
      setPointerCapture(pointer: number) { captured.add(pointer) },
      hasPointerCapture(pointer: number) { return captured.has(pointer) },
      releasePointerCapture(pointer: number) { captured.delete(pointer) }
    }
    // Where the pointer is in the document, and how far the hand moved it since the last event.
    const event = (x: number, y: number, movementX = 1, movementY = 1) => ({ isPrimary: true, button: 0, pointerId: 4, clientX: x, clientY: y, movementX, movementY, currentTarget }) as never
    // What the document hears once the element let the pointer go.
    const heard = (type: string, x: number, y: number, movementX = 1, movementY = 1) => {
      const native = new Event(type)
      Object.assign(native, { pointerId: 4, clientX: x, clientY: y, movementX, movementY })
      act(() => { document.dispatchEvent(native) })
    }
    const hook = renderHook(() => useWindowMoveHandle(begin))
    return { gesture, begin, captured, event, heard, hook }
  }

  it("begins the move where it was pressed, then lets the pointer go and reports what the document still hears", function () {
    const { gesture, begin, captured, event, heard, hook } = setup()

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    expect(captured.size).toBe(1)
    act(() => hook.result.current.onPointerMove(event(11, 21)))
    expect(begin).not.toHaveBeenCalled()

    act(() => hook.result.current.onPointerMove(event(30, 40)))
    expect(begin).toHaveBeenCalledWith({ x: 10, y: 20 })
    expect(gesture.move).toHaveBeenLastCalledWith({ x: 30, y: 40 })
    // The host may take the pointer from here.
    expect(captured.size).toBe(0)

    heard("pointermove", 50, 60)
    expect(gesture.move).toHaveBeenLastCalledWith({ x: 50, y: 60 })

    heard("pointerup", 50, 60, 0, 0)
    expect(gesture.end).toHaveBeenCalledWith()

    // Nothing more is reported once it was let go.
    heard("pointermove", 70, 80)
    expect(gesture.move).toHaveBeenCalledTimes(2)
    hook.unmount()
    expect(gesture.cancel).not.toHaveBeenCalled()
  })

  it("does not report a pointer the window's own movement passed under while the hand stayed still", function () {
    const { gesture, event, heard, hook } = setup()

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    act(() => hook.result.current.onPointerMove(event(30, 40)))
    heard("pointermove", 22, 31, 0, 0)

    expect(gesture.move).toHaveBeenCalledOnce()
    expect(gesture.move).toHaveBeenCalledWith({ x: 30, y: 40 })
    hook.unmount()
  })

  it("abandons a press that loses the pointer before it became a move", function () {
    const { begin, captured, event, hook } = setup()

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    act(() => hook.result.current.onLostPointerCapture(event(10, 20)))
    act(() => hook.result.current.onPointerMove(event(30, 40)))

    expect(begin).not.toHaveBeenCalled()
    expect(captured.size).toBe(0)
  })

  it("abandons the move when its component goes away before it is let go", function () {
    const { gesture, event, heard, hook } = setup()

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    act(() => hook.result.current.onPointerMove(event(30, 40)))
    hook.unmount()
    heard("pointermove", 50, 60)

    expect(gesture.cancel).toHaveBeenCalledOnce()
    expect(gesture.move).toHaveBeenCalledOnce()
  })

  it("remains inert without a host capability", function () {
    const setPointerCapture = vi.fn()
    const hook = renderHook(() => useWindowMoveHandle())

    act(() => hook.result.current.onPointerDown({
      isPrimary: true,
      button: 0,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      currentTarget: { setPointerCapture }
    } as never))

    expect(setPointerCapture).not.toHaveBeenCalled()
  })
})
