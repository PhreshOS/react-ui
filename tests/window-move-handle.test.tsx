import { act, renderHook } from "@testing-library/react"
import type { BeginPresentationMoveGesture, PresentationMoveGesture } from "@phreshos/core"
import { describe, expect, it, vi } from "vitest"
import useWindowMoveHandle from "../source/use-window-move-handle.js"

describe("Window move handle", function () {
  function setup() {
    let markReady: () => void = () => undefined
    const ready = new Promise<void>(resolve => { markReady = resolve })
    const gesture = { ready, finished: new Promise<void>(() => undefined), move: vi.fn(), end: vi.fn(), cancel: vi.fn() } satisfies PresentationMoveGesture
    const begin = vi.fn(() => gesture) satisfies BeginPresentationMoveGesture
    const captured = new Set<number>()
    const currentTarget = {
      setPointerCapture(pointer: number) { captured.add(pointer) },
      hasPointerCapture(pointer: number) { return captured.has(pointer) },
      releasePointerCapture(pointer: number) { captured.delete(pointer) }
    }
    const event = (x: number, y: number) => ({ isPrimary: true, button: 0, pointerId: 4, clientX: x, clientY: y, currentTarget }) as never
    const hook = renderHook(() => useWindowMoveHandle(begin))
    return { gesture, begin, captured, event, hook, markReady, ready }
  }

  it("holds the pointer for the whole move and reports where it goes and where it is let go", async function () {
    const { gesture, begin, captured, event, hook, markReady, ready } = setup()

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    act(() => hook.result.current.onPointerMove(event(11, 21)))
    expect(begin).not.toHaveBeenCalled()

    act(() => hook.result.current.onPointerMove(event(30, 40)))
    expect(begin).toHaveBeenCalledWith({ origin: { x: 10, y: 20 }, point: { x: 30, y: 40 } })

    await act(async () => { markReady(); await ready })
    expect(captured.size).toBe(1)

    act(() => hook.result.current.onPointerMove(event(50, 60)))
    expect(gesture.move).toHaveBeenCalledWith({ x: 50, y: 60 })

    act(() => hook.result.current.onPointerUp(event(70, 80)))
    expect(gesture.end).toHaveBeenCalledWith({ x: 70, y: 80 })
    expect(captured.size).toBe(0)

    hook.unmount()
    expect(gesture.cancel).not.toHaveBeenCalled()
  })

  it("abandons the move when the pointer is lost before it is let go", function () {
    const { gesture, captured, event, hook } = setup()

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    act(() => hook.result.current.onPointerMove(event(30, 40)))
    act(() => hook.result.current.onLostPointerCapture(event(30, 40)))

    expect(gesture.cancel).toHaveBeenCalledOnce()
    expect(gesture.end).not.toHaveBeenCalled()
    expect(captured.size).toBe(0)
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
