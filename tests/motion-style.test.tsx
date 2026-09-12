import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import { defaultAppearance } from "@phreshos/core"
import { AppearanceProvider, Button, Input, Surface, Select } from "../source/main.js"
import { overlayMotionClass, useControlTransition } from "../source/motion-style.js"

afterEach(() => { cleanup(); vi.restoreAllMocks() })

it("consumes Appearance timing and limits transitions to explicit visual properties", () => {
  const appearance = { ...defaultAppearance, transaction: { duration: 240, easing: "ease-in-out" as const } }
  let motion: ReturnType<typeof useControlTransition> | undefined
  render(<AppearanceProvider appearance={appearance} theme="light">
    <ReadMotion onRead={value => { motion = value }} />
    <Surface data-testid="surface">Content</Surface><Button>Action</Button><Input label="Name" />
  </AppearanceProvider>)
  const host = screen.getByTestId("surface")
  for (const element of [host, screen.getByRole("button"), screen.getByRole("textbox")]) {
    expect(element.style.transitionProperty).toBe("background-color, color, border-color, border-radius")
    expect(element.style.transitionDuration).toBe("240ms")
    expect(element.style.transitionTimingFunction).toBe("ease-in-out")
  }
  for (const selector of ["[data-material-fill]", "[data-material-base]", "[data-surface-palette-base]", "[data-surface-edge]"]) {
    const layer = host.querySelector<HTMLElement | SVGElement>(selector)
    expect(layer?.style.transitionProperty).toBe("fill, stroke, opacity")
    expect(layer?.style.transitionDuration).toBe(host.style.transitionDuration)
  }
  expect(host.style.transitionProperty).not.toMatch(/opacity|filter|transform|width|height|all/)
  expect(host.querySelector<HTMLElement>("[data-material-backdrop]")?.style.transitionProperty).toBe("")
  expect(motion).toEqual({ type: "tween", duration: 0.24, ease: "easeInOut" })
})

it("hoists one scoped stylesheet for nested providers and declares reduced-motion behavior", () => {
  render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <AppearanceProvider appearance={defaultAppearance} theme="dark"><Surface /></AppearanceProvider>
  </AppearanceProvider>)
  const sheets = [...document.head.querySelectorAll("style")].filter(style => style.textContent?.includes("@keyframes phreshos-ui-overlay-enter"))
  expect(sheets).toHaveLength(1)
  const css = sheets[0]?.textContent
  expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  expect(css).toContain("--phreshos-ui-motion-duration: 0ms")
  expect(css).toContain("animation: none")
  expect(css).toContain("[data-entering]")
  expect(css).toContain("[data-exiting]")
  expect(css).toContain("pointer-events: none")
  expect(css).toContain("--phreshos-ui-motion-duration: 120ms")
  expect(css).toContain("--phreshos-ui-motion-easing: ease-out")
  expect(css).toContain("var(--phreshos-ui-motion-easing) both")
  expect(css).toContain("var(--phreshos-ui-motion-easing) reverse both")
  expect(css).toContain("from { opacity: 0; translate:")
  expect(css).toContain("to { opacity: 1; translate: 0 0;")
  expect(css).not.toContain("filter:")
  expect(css).not.toContain("transition: all")
})

function ReadMotion({ onRead }: Readonly<{ onRead: (value: ReturnType<typeof useControlTransition>) => void }>) {
  onRead(useControlTransition())
  return null
}

it("uses the shared overlay style without changing Select selection, dismissal, or focus return", async () => {
  const onChange = vi.fn()
  render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <Select label="Choice" options={[{ value: "one", label: "One" }, { value: "two", label: "Two" }]} onChange={onChange} />
  </AppearanceProvider>)
  const user = userEvent.setup()
  const trigger = screen.getByRole("button")
  await user.click(trigger)
  const menu = await screen.findByRole("listbox")
  expect(menu.closest(`.${overlayMotionClass}`)).not.toBeNull()
  await user.click(screen.getByRole("option", { name: "Two" }))
  expect(onChange).toHaveBeenLastCalledWith("two")
  expect(screen.queryByRole("listbox")).toBeNull()
  await waitFor(() => expect(document.activeElement).toBe(trigger))
  await user.click(trigger)
  await user.keyboard("[Escape]")
  expect(screen.queryByRole("listbox")).toBeNull()
  await waitFor(() => expect(document.activeElement).toBe(trigger))
})

it("refreshes derived edge colors when the Surface palette finishes animating", () => {
  const original = window.getComputedStyle.bind(window)
  let animatedFill = "rgb(17, 34, 51)"
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const computed = original(element, pseudo)
    return element.hasAttribute("data-surface-palette-base") ? new Proxy(computed, {
      get: (target, property) => property === "fill" ? animatedFill : Reflect.get(target, property, target)
    }) : computed
  })
  render(<AppearanceProvider appearance={defaultAppearance} theme="light"><Surface data-testid="surface" color="#ffeecc" /></AppearanceProvider>)
  const host = screen.getByTestId("surface")
  const border = host.querySelector<HTMLElement>("[data-surface-edge]")
  const base = host.querySelector("[data-surface-palette-base]")!
  expect(border?.style.background).toContain("rgb(17, 34, 51)")
  animatedFill = "rgb(255, 238, 204)"
  const complete = new Event("transitionend", { bubbles: true })
  Object.defineProperty(complete, "propertyName", { value: "fill" })
  act(() => fireEvent(base, complete))
  expect(border?.style.background).toContain("rgb(255, 238, 204)")
  expect(border?.style.background).not.toContain("rgb(17, 34, 51)")
})
