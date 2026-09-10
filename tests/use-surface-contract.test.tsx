import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, type Ref } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import { standardAppearance } from "@phreshos/core"
import {
  AppearanceProvider, Surface, Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Radio,
  useSurface, type SurfaceOptions, type SurfaceResult, type AppearanceOptions,
  type ButtonProps, type InputProps, type CheckboxProps, type SwitchProps, type RadioProps, type SelectProps
} from "../source/main.js"

afterEach(cleanup)

function Custom({ options, forwardedRef }: { options?: SurfaceOptions, forwardedRef?: Ref<HTMLButtonElement> }) {
  const surface = useSurface(options, forwardedRef)
  return <button type="button" data-testid="custom" ref={surface.ref} style={surface.style}>
    {surface.material}Custom
  </button>
}

it("exposes one options contract across the hook and material-bearing controls", () => {
  expectTypeOf<SurfaceOptions>().toEqualTypeOf<AppearanceOptions>()
  expectTypeOf<ReturnType<typeof useSurface>>().toEqualTypeOf<SurfaceResult>()
  expectTypeOf<ButtonProps["surface"]>().toEqualTypeOf<SurfaceOptions | undefined>()
  expectTypeOf<InputProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<CheckboxProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<SwitchProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<RadioProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<SelectProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()

})

it("requires Appearance and creates no container of its own", () => {
  expect(() => render(<Custom />)).toThrow("useAppearance() requires an AppearanceProvider")
  const ref = createRef<HTMLButtonElement>()
  const { container, unmount } = render(<AppearanceProvider appearance={standardAppearance} theme="light"><Custom forwardedRef={ref} /></AppearanceProvider>)
  const button = screen.getByTestId("custom")
  expect(button.parentElement).toBe(container)
  expect(ref.current).toBe(button)
  expect(button.style.boxShadow).toBe("")
  expect(button.style.padding).toBe("")
  expect(button.style.borderRadius).toBe("10px")
  unmount()
  expect(ref.current).toBeNull()
})

it("forwards ref cleanup without replacing the native element on option changes", () => {
  const dispose = vi.fn()
  const ref = vi.fn(() => dispose)
  const view = render(<AppearanceProvider appearance={standardAppearance} theme="light"><Custom forwardedRef={ref} /></AppearanceProvider>)
  const host = screen.getByTestId("custom")
  view.rerender(<AppearanceProvider appearance={standardAppearance} theme="dark"><Custom forwardedRef={ref} options={{ color: "#123456", radius: 18 }} /></AppearanceProvider>)
  expect(screen.getByTestId("custom")).toBe(host)
  expect(ref).toHaveBeenCalledTimes(1)
  expect(host.style.borderRadius).toBe("18px")
  expect(dispose).not.toHaveBeenCalled()
  view.unmount()
  expect(dispose).toHaveBeenCalledTimes(1)
})

it("renders the same material through the hook and Surface, with isolated filter identities", () => {
  const options: SurfaceOptions = { color: "soft", radius: "large", opacity: 0.4, backdrop: 8, grain: 0.2, grainAmount: 0.3, distortion: 4, saturation: 1.1 }
  render(<AppearanceProvider appearance={standardAppearance} theme="light">
    <Custom options={options} /><Surface data-testid="surface" {...options}>Surface</Surface>
  </AppearanceProvider>)
  const custom = screen.getByTestId("custom")
  const surface = screen.getByTestId("surface")
  for (const selector of ["[data-surface-base]", "[data-surface-border]", "[data-surface-backdrop='frost']"]) {
    expect(custom.querySelector(selector)?.getAttribute("style")).toBe(surface.querySelector(selector)?.getAttribute("style"))
  }
  expect(custom.querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.4")
  expect(custom.style.borderRadius).toBe(surface.style.borderRadius)
  const ids = [...document.querySelectorAll("filter, pattern")].map(element => element.id)
  expect(new Set(ids).size).toBe(ids.length)
})

it.each(["button", "input", "textarea", "select", "checkbox", "switch", "radio"] as const)("applies explicit surface options to %s without leaking props or changing behavior", async kind => {
  const surface: SurfaceOptions = { color: "#345678", radius: 7, opacity: 0.45, backdrop: 0 }
  const action = vi.fn()
  const example = kind === "button" ? <Button color="primary" surface={surface} onPress={action}>Action</Button>
    : kind === "input" ? <Input label="Value" surface={surface} onChange={action} />
    : kind === "textarea" ? <Textarea label="Value" surface={surface} onChange={action} />
    : kind === "select" ? <Select label="Value" surface={surface} options={[{ value: "one", label: "One" }]} onChange={action} />
    : kind === "checkbox" ? <Checkbox label="Value" surface={surface} onChange={action} />
    : kind === "switch" ? <Switch label="Value" surface={surface} onChange={action} />
    : <RadioGroup label="Values" surface={surface} onChange={action}><Radio label="Value" value="one" /></RadioGroup>
  const { container } = render(<AppearanceProvider appearance={standardAppearance} theme="light">{example}</AppearanceProvider>)
  const base = container.querySelector<SVGRectElement>("[data-surface-base]")
  const host = container.querySelector("[data-surface-border]")?.parentElement
  expect(base?.style.fill).toBe("rgb(52, 86, 120)")
  expect(host?.style.borderRadius).toBe("7px")
  expect(container.querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.45")
  expect(container.querySelector("[data-surface-backdrop]")).toBeNull()
  expect(container.querySelector("[surface]")).toBeNull()
  const user = userEvent.setup()
  if (kind === "input" || kind === "textarea") await user.type(screen.getByRole("textbox"), "A")
  else if (kind === "select") {
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByRole("option", { name: "One" }))
  } else await user.click(screen.getByRole(kind))
  expect(action).toHaveBeenCalled()
  expect(base?.style.fill).toBe("rgb(52, 86, 120)")
})

it("lets a Radio override its group's material and preserves defaults for undefined options", () => {
  render(<AppearanceProvider appearance={standardAppearance} theme="light">
    <RadioGroup label="Choices" surface={{ opacity: 0.6 }}>
      <Radio label="One" value="one" />
      <Radio label="Two" value="two" surface={{ opacity: 0.3 }} />
    </RadioGroup>
    <Button data-testid="button" color="danger" radius="small" surface={{ color: undefined, radius: undefined }}>Action</Button>
  </AppearanceProvider>)
  expect([...document.querySelectorAll("[data-surface-paint]")].slice(0, 2).map(element => element.getAttribute("opacity"))).toEqual(["0.6", "0.3"])
  expect(screen.getByTestId("button").style.borderRadius).toBe("5px")
  expect(screen.getByTestId("button").querySelector<SVGRectElement>("[data-surface-base]")?.style.fill).toBe("rgb(220, 38, 38)")
})
