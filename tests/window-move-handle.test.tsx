import { act, renderHook } from "@testing-library/react"
import type { BeginWindowMoveGesture, WindowMoveGesture } from "@phreshos/core"
import { describe, expect, it, vi } from "vitest"
import useWindowMoveHandle from "../source/use-window-move-handle.js"

describe("Window move handle", function () {
  it("retains capture until the supplied host is ready for the handoff", async function () {
    let markReady: () => void = () => undefined
    const ready = new Promise<void>(resolve => { markReady = resolve })
    const gesture = { ready, finished: new Promise<void>(() => undefined), cancel: vi.fn() } satisfies WindowMoveGesture
    const begin = vi.fn(() => gesture) satisfies BeginWindowMoveGesture
    const captured = new Set<number>()
    const currentTarget = {
      setPointerCapture(pointer: number) { captured.add(pointer) },
      hasPointerCapture(pointer: number) { return captured.has(pointer) },
      releasePointerCapture(pointer: number) { captured.delete(pointer) }
    }
    const event = (x: number, y: number) => ({
      isPrimary: true,
      button: 0,
      pointerId: 4,
      clientX: x,
      clientY: y,
      currentTarget
    }) as never
    const hook = renderHook(() => useWindowMoveHandle(begin))

    act(() => hook.result.current.onPointerDown(event(10, 20)))
    act(() => hook.result.current.onPointerMove(event(11, 21)))
    expect(begin).not.toHaveBeenCalled()

    act(() => hook.result.current.onPointerMove(event(30, 40)))
    expect(begin).toHaveBeenCalledWith({ origin: { x: 10, y: 20 }, point: { x: 30, y: 40 } })
    expect(captured.size).toBe(1)

    await act(async () => { markReady(); await ready })
    expect(captured.size).toBe(0)

    hook.unmount()
    expect(gesture.cancel).toHaveBeenCalledOnce()
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
