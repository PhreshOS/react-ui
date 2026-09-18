import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import { UIProvider, Button, Input, Surface, Select, defaultAppearance } from "../source/main.js"
import { controlTransition, overlayMotionClass } from "../source/motion-style.js"

afterEach(() => { cleanup(); vi.restoreAllMocks() })

it("consumes Appearance timing and limits transitions to explicit visual properties", () => {
  const appearance = { ...defaultAppearance, transaction: { duration: 240, easing: "ease-in-out" as const } }
  render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}>
    <Surface data-testid="surface">Content</Surface><Button>Action</Button><Input label="Name" />
  </UIProvider>)
  const host = screen.getByTestId("surface")
  for (const element of [host, screen.getByRole("button"), screen.getByRole("textbox")]) {
    expect(element.style.transitionProperty).toBe("background-color, color, border-color, border-radius, box-shadow")
    expect(element.style.transitionDuration).toBe("240ms")
    expect(element.style.transitionTimingFunction).toBe("ease-in-out")
  }
  const fill = host.querySelector<HTMLElement>("[data-material-fill]")
  const base = host.querySelector<HTMLElement>("[data-material-base]")
  expect(fill).toBe(base)
  expect(fill?.style.transitionProperty).toBe("background-color, opacity")
  expect(fill?.style.transitionDuration).toBe(host.style.transitionDuration)
  expect(base?.style.transitionDuration).toBe(host.style.transitionDuration)
  const edge = host.querySelector<HTMLElement>("[data-surface-edge]")
  const light = host.querySelector<HTMLElement>("[data-surface-edge-light]")
  expect(edge?.style.transitionProperty).toBe("border-color, opacity")
  expect(edge?.style.transitionDuration).toBe(host.style.transitionDuration)
  expect(light?.style.transitionProperty).toBe("opacity")
  expect(light?.style.transitionDuration).toBe(host.style.transitionDuration)
  expect(host.querySelector("[data-surface-palette]")).toBeNull()
  expect(host.style.transitionProperty).not.toMatch(/opacity|filter|transform|width|height|all/)
  expect(host.querySelector<HTMLElement>("[data-material-backdrop]")?.style.transitionProperty).toBe("")
  expect(controlTransition(appearance.transaction, true)).toEqual({ type: "tween", duration: 0.24, ease: "easeInOut" })
})

it("hoists one scoped stylesheet when an overlay owns motion", async () => {
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <UIProvider appearance={defaultAppearance} preferences={{ theme: "dark", animations: true }}>
      <Select aria-label="Choice" options={[{ value: "one", label: "One" }]} />
    </UIProvider>
  </UIProvider>)
  await userEvent.setup().click(screen.getByRole("button"))
  const sheets = [...document.head.querySelectorAll("style")].filter(style => style.textContent?.includes("@keyframes phreshos-ui-overlay-enter"))
  expect(sheets).toHaveLength(1)
  const css = sheets[0]?.textContent
  expect(css).not.toContain("prefers-reduced-motion")
  expect(css).toContain("[data-entering]")
  expect(css).toContain("[data-exiting]")
  expect(css).toContain("pointer-events: none")
  expect(css).not.toContain(":root")
  expect(css).toContain("var(--phreshos-ui-motion-easing) both")
  expect(css).toContain("var(--phreshos-ui-motion-easing) reverse both")
  expect(css).toContain("from { opacity: 0; scale: 1.05;")
  expect(css).toContain("to { opacity: 1; scale: 1;")
  expect(css).not.toContain("translate:")
  expect(css).not.toContain("filter:")
  expect(css).not.toContain("transition: all")
})

it("makes every React UI transition immediate when animations are disabled", async () => {
  const appearance = { ...defaultAppearance, transaction: { duration: 240, easing: "ease-in-out" as const } }
  render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: false }}>
    <Surface data-testid="surface" />
    <Select label="Choice" options={[{ value: "one", label: "One" }]} />
  </UIProvider>)

  expect(screen.getByTestId("surface").style.transitionDuration).toBe("0ms")
  expect(screen.getByRole("button").style.transitionDuration).toBe("0ms")
  expect(controlTransition(appearance.transaction, false)).toMatchObject({ duration: 0 })

  await userEvent.setup().click(screen.getByRole("button"))
  const overlay = (await screen.findByRole("listbox")).closest<HTMLElement>(`.${overlayMotionClass}`)
  expect(overlay?.style.getPropertyValue("--phreshos-ui-motion-duration")).toBe("0ms")
})

it("uses the shared overlay style without changing Select selection, dismissal, or focus return", async () => {
  const onChange = vi.fn()
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Select label="Choice" options={[{ value: "one", label: "One" }, { value: "two", label: "Two" }]} onChange={onChange} />
  </UIProvider>)
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

it("derives dark and illuminated edge layers directly from Material paint", () => {
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Surface data-testid="surface" color="#ffeecc" material={{ opacity: 0.25 }} />
  </UIProvider>)
  const host = screen.getByTestId("surface")
  const border = host.querySelector<HTMLElement>("[data-surface-edge]")
  const light = host.querySelector<HTMLElement>("[data-surface-edge-light]")

  expect(host.querySelector("[data-surface-palette]")).toBeNull()
  expect(border?.style.borderStyle).toBe("solid")
  expect(border?.style.borderWidth).toBe("0.8px")
  expect(border?.style.borderColor).toBe("var(--phreshos-surface-edge-dark)")
  expect(light?.style.background).toContain("linear-gradient(90deg")
  expect(light?.style.getPropertyValue("--phreshos-surface-edge-light-peak")).toContain("#ffeecc")
  expect(light?.style.getPropertyValue("--phreshos-surface-edge-light-peak")).not.toContain("black")
  expect(host.querySelector("[data-surface-edge-glow]")).toBeNull()
  expect(border?.style.opacity).toBe("0.5")
  expect(light?.style.opacity).toBe("0.5")
})
