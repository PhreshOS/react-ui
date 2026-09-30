import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { expect, it } from "vitest"
import { UIProvider, defaultAppearance, timing, useTiming } from "../source/main.js"

it("grows the motion across a distance with the distance, gently and within bounds", () => {
  const near = timing("view", { distance: 120 })
  const oneView = timing("view", { distance: 1440 })
  const twoViews = timing("view", { distance: 2880 })

  expect(near.duration).toBe(Math.round(187 + 8.5 * Math.sqrt(120)))
  expect(twoViews.duration).toBeGreaterThan(oneView.duration)
  // Twice as far does not take twice as long.
  expect(twoViews.duration).toBeLessThan(oneView.duration * 1.5)
  expect(timing("view", { distance: 20_000 }).duration).toBe(850)
  expect(timing("view", { distance: 1 }).duration).toBe(255)
  // The view moves as a body on a spring that arrives without passing its place.
  expect(oneView.easing).toEqual({ spring: { bounce: 0 } })
})

it("moves a Window as a lighter body than the view", () => {
  for (const distance of [40, 400, 1440, 5000]) {
    expect(timing("window", { distance }).duration).toBeLessThan(timing("view", { distance }).duration)
  }
  expect(timing("window", { distance: 1 }).duration).toBe(110)
  expect(timing("window", { distance: 20_000 }).duration).toBe(553)
  expect(timing("window", { distance: 300 }).duration).toBe(Math.round(72 + 3.4 * Math.sqrt(300)))
  // A Window answers a hand: it sets off at once.
  expect(timing("window", { distance: 400 }).easing).toEqual([0.22, 1, 0.36, 1])
})

it("starts softly what leaves sight, in the same time", () => {
  expect(timing("window", { distance: 4000, leaving: true }).easing).toEqual([0.65, 0, 0.35, 1])
  expect(timing("window", { distance: 4000, leaving: true }).duration).toBe(timing("window", { distance: 4000 }).duration)
})

it("keeps one change in place per tempo, and only the few tempos in use", () => {
  expect(timing("change", { tempo: 1.5 })).toBe(timing("change", { tempo: 1.5 }))
  const first = timing("change", { tempo: 1.25 })
  for (let tempo = 0.4; tempo < 4; tempo += 0.05) timing("change", { tempo })
  // Still right when it has to be made again.
  expect(timing("change", { tempo: 1.25 })).toEqual(first)
})

it("stretches only time with the tempo, never the shape", () => {
  expect(timing("change")).toEqual({ duration: 102, easing: "ease-out" })
  expect(timing("change", { tempo: 2 })).toEqual({ duration: 204, easing: "ease-out" })
  const slow = timing("view", { distance: 1440, tempo: 2 })
  expect(Math.abs(slow.duration - timing("view", { distance: 1440 }).duration * 2)).toBeLessThanOrEqual(1)
  expect(slow.easing).toEqual(timing("view", { distance: 1440 }).easing)
})

it("derives from the nearest Appearance's tempo, and takes no time with animations off", () => {
  const within = (animations: boolean) => ({ children }: { children: ReactNode }) =>
    <UIProvider appearance={{ ...defaultAppearance, tempo: 2 }} preferences={{ theme: "light", animations }}>{children}</UIProvider>

  const moving = renderHook(() => useTiming(), { wrapper: within(true) }).result.current
  expect(moving("window", { distance: 300 }).duration).toBe(timing("window", { distance: 300, tempo: 2 }).duration)

  const still = renderHook(() => useTiming(), { wrapper: within(false) }).result.current
  expect(still("view", { distance: 1440 }).duration).toBe(0)
})
