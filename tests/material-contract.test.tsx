import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, forwardRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import { defaultAppearance } from "../source/main.js"
import {
  UIProvider, Surface, Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Grid,
  type MaterialMode, type MaterialOptions, type ShadowOptions, type SurfaceHost, type SurfaceProps,
  type ButtonProps, type InputProps, type CheckboxProps, type SwitchProps, type RadioGroupItemProps, type SelectProps
} from "../source/main.js"

afterEach(cleanup)

it("uses reusable grain resources instead of per-Surface DOM path fields", () => {
  const { container } = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {Array.from({ length: 10 }, (_, index) => <Button key={index}>Action {index}</Button>)}
  </UIProvider>)
  const grains = [...container.querySelectorAll<HTMLElement>("[data-material-grain]")]

  expect(grains).toHaveLength(10)
  expect(container.querySelector("path[data-material-grain-tone]")).toBeNull()
  expect(new Set(grains.map(grain => grain.style.backgroundImage)).size).toBeLessThanOrEqual(4)
})

it("interprets grain amount as monotonic texture density", () => {
  const view = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Surface data-testid="surface" material={{ grain: 0.5, grainAmount: 0.1 }} />
  </UIProvider>)
  const density = () => grainCoordinates(view.container.querySelector<HTMLElement>("[data-material-grain]")!)
  const sparse = density()

  view.rerender(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Surface data-testid="surface" material={{ grain: 0.5, grainAmount: 0.5 }} />
  </UIProvider>)
  const medium = density()

  view.rerender(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Surface data-testid="surface" material={{ grain: 0.5, grainAmount: 1 }} />
  </UIProvider>)
  const dense = density()

  expect(sparse.size).toBeGreaterThan(0)
  expect(medium.size).toBeGreaterThan(sparse.size)
  expect(dense.size).toBe(64 * 64)
  expect([...sparse].every(point => medium.has(point))).toBe(true)
  expect([...medium].every(point => dense.has(point))).toBe(true)
})

function grainCoordinates(element: HTMLElement) {
  const source = decodeURIComponent(element.style.backgroundImage)
  return new Set([...source.matchAll(/M(\d+) (\d+)h1v1h-1z/g)]
    .map(([, x, y]) => `${x}:${y}`))
}

it("groups material customization uniformly across Surface and controls", () => {
  const NotAHost = (_: Readonly<{ value: string }>) => <div />

  expectTypeOf<typeof Grid extends SurfaceHost ? true : false>().toEqualTypeOf<true>()
  expectTypeOf<typeof NotAHost extends SurfaceHost ? true : false>().toEqualTypeOf<false>()
  expectTypeOf<"color" extends keyof MaterialOptions ? true : false>().toEqualTypeOf<false>()
  expectTypeOf<"material" extends keyof SurfaceProps ? true : false>().toEqualTypeOf<true>()
  expectTypeOf<"opacity" extends keyof SurfaceProps ? true : false>().toEqualTypeOf<false>()
  expectTypeOf<MaterialMode>().toEqualTypeOf<"none" | "basic" | "extended" | "full">()
  expectTypeOf<SurfaceProps["material"]>().toEqualTypeOf<MaterialMode | MaterialOptions | undefined>()
  expectTypeOf<SurfaceProps["shadow"]>().toEqualTypeOf<boolean | ShadowOptions | undefined>()
  expectTypeOf<ButtonProps["material"]>().toEqualTypeOf<MaterialMode | MaterialOptions | undefined>()
  expectTypeOf<InputProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<CheckboxProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<SwitchProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<RadioGroupItemProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<SelectProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<InputProps["shadow"]>().toEqualTypeOf<ButtonProps["shadow"]>()
  expectTypeOf<CheckboxProps["shadow"]>().toEqualTypeOf<ButtonProps["shadow"]>()
  expectTypeOf<SwitchProps["shadow"]>().toEqualTypeOf<ButtonProps["shadow"]>()
  expectTypeOf<RadioGroupItemProps["shadow"]>().toEqualTypeOf<ButtonProps["shadow"]>()
  expectTypeOf<SelectProps["shadow"]>().toEqualTypeOf<ButtonProps["shadow"]>()
})

it.each(["button", "input", "textarea", "select", "checkbox", "switch", "radio"] as const)("exposes the shared material mode and shadow switch on %s", kind => {
  const example = kind === "button" ? <Button material="none" shadow={false}>Action</Button>
    : kind === "input" ? <Input label="Value" material="none" shadow={false} />
    : kind === "textarea" ? <Textarea label="Value" material="none" shadow={false} />
    : kind === "select" ? <Select label="Value" material="none" shadow={false} options={[{ value: "one", label: "One" }]} />
    : kind === "checkbox" ? <Checkbox label="Value" material="none" shadow={false} />
    : kind === "switch" ? <Switch label="Value" material="none" shadow={false} />
    : <RadioGroup label="Values" material="none" shadow={false}><RadioGroup.Item label="Value" value="one" /></RadioGroup>
  const { container } = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>{example}</UIProvider>)
  const host = [...container.querySelectorAll<HTMLElement>("*")]
    .find(element => element.style.boxShadow === "none")

  expect(host).not.toBeNull()
  expect(host?.style.boxShadow).toBe("none")
  expect(host?.style.background).not.toBe("transparent")
  expect(host?.querySelector("[data-material]")).toBeNull()
  expect(host?.querySelector("[data-surface-edge]")).toBeNull()
})

it("lets any ref-forwarding host that preserves style and children carry the Surface", () => {
  const OutsideLayout = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div"> & Readonly<{ direction?: "row" | "column" }>>(
    function OutsideLayout({ direction = "row", style, ...properties }, ref) {
      return <div {...properties} ref={ref} style={{ ...style, display: "flex", flexDirection: direction }} />
    }
  )
  const grid = createRef<HTMLDivElement>()
  const outside = createRef<HTMLDivElement>()

  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
    <Surface as={Grid} ref={grid} data-testid="grid" dir="rtl" columns={2}>Grid content</Surface>
    <Surface as={OutsideLayout} ref={outside} data-testid="outside" dir="rtl" direction="column">Outside content</Surface>
  </UIProvider>)

  expect(grid.current).toBe(screen.getByTestId("grid"))
  expect(grid.current?.style.display).toBe("grid")
  expect(grid.current?.dir).toBe("rtl")
  expect(grid.current?.querySelector(":scope > [data-material]")).not.toBeNull()
  expect(outside.current).toBe(screen.getByTestId("outside"))
  expect(outside.current?.style.display).toBe("flex")
  expect(outside.current?.style.flexDirection).toBe("column")
  expect(outside.current?.dir).toBe("rtl")
  expect(outside.current?.querySelector(":scope > [data-material]")).not.toBeNull()
})

it("renders a div by default and preserves the selected host contract", () => {
  const div = createRef<HTMLDivElement>()
  const button = createRef<HTMLButtonElement>()
  const { container } = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Surface ref={div} data-testid="surface">Content</Surface>
    <Surface as="button" ref={button} data-testid="button" type="button">Action</Surface>
  </UIProvider>)
  const surface = screen.getByTestId("surface")

  expect(div.current).toBe(surface)
  expect(surface.tagName).toBe("DIV")
  expect(surface.parentElement).toBe(container)
  expect(surface.querySelector("[data-material]")).not.toBeNull()
  expect(screen.getByText("Content")).toBe(surface)
  expect(button.current).toBe(screen.getByTestId("button"))
  expect(button.current?.tagName).toBe("BUTTON")
  expect(button.current?.type).toBe("button")
})

it("accepts grouped material properties without another rendered entity", () => {
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Surface data-testid="geometry" color="#345678" material={{ opacity: 0.45, backdrop: 0 }}
      style={{ width: 80, height: 60 }} />
  </UIProvider>)
  const geometry = screen.getByTestId("geometry")
  const material = geometry.querySelector<HTMLElement>("[data-material]")

  expect(geometry.hasAttribute("material")).toBe(false)
  expect(material?.parentElement).toBe(geometry)
  expect(material?.style.position).toBe("absolute")
  expect(material?.style.inset).toBe("0px")
  expect(material?.style.borderRadius).toBe("inherit")
  expect(material?.querySelector<HTMLElement>("[data-material-base]")?.style.background).toBe("rgb(52, 86, 120)")
  expect(geometry.querySelector("[data-surface-edge]")).not.toBeNull()
})

it.each(["button", "input", "textarea", "select", "checkbox", "switch", "radio"] as const)("applies the shared material configuration to %s without leaking props or changing behavior", async kind => {
  const material: MaterialOptions = { opacity: 0.45, backdrop: 0 }
  const action = vi.fn()
  const example = kind === "button" ? <Button color="#345678" material={material} onPress={action}>Action</Button>
    : kind === "input" ? <Input label="Value" color="#345678" material={material} onChange={action} />
    : kind === "textarea" ? <Textarea label="Value" color="#345678" material={material} onChange={action} />
    : kind === "select" ? <Select label="Value" color="#345678" material={material} options={[{ value: "one", label: "One" }]} onChange={action} />
    : kind === "checkbox" ? <Checkbox label="Value" color="#345678" material={material} onChange={action} />
    : kind === "switch" ? <Switch label="Value" color="#345678" material={material} onChange={action} />
    : <RadioGroup label="Values" color="#345678" material={material} onChange={action}><RadioGroup.Item label="Value" value="one" /></RadioGroup>
  const { container } = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>{example}</UIProvider>)
  const base = container.querySelector<HTMLElement>("[data-material-base]")

  expect(base).not.toBeNull()
  expect(container.querySelector<HTMLElement>("[data-material-fill]")?.style.opacity).toBe("0.45")
  expect(container.querySelector<HTMLElement>("[data-material-backdrop='frost']")?.style.backdropFilter)
    .toBe(`saturate(${defaultAppearance.material.light.saturation})`)
  expect(container.querySelector("[material]")).toBeNull()

  const user = userEvent.setup()
  if (kind === "input" || kind === "textarea") await user.type(screen.getByRole("textbox"), "A")
  else if (kind === "select") {
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByRole("option", { name: "One" }))
  } else await user.click(screen.getByRole(kind))

  expect(action).toHaveBeenCalled()
})

it("lets a RadioGroup Item override its group's material independently from color and radius", () => {
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <RadioGroup label="Choices" material={{ opacity: 0.6 }}>
      <RadioGroup.Item label="One" value="one" />
      <RadioGroup.Item label="Two" value="two" material={{ opacity: 0.3 }} />
    </RadioGroup>
    <Button data-testid="button" color="danger:base" radius="small" material={{ opacity: 0.4 }}>Action</Button>
  </UIProvider>)

  expect([...document.querySelectorAll<HTMLElement>("[data-material-fill]")].slice(0, 2).map(element => element.style.opacity)).toEqual(["0.6", "0.3"])
  expect(screen.getByTestId("button").style.borderRadius).toBe("5px")
  expect(screen.getByTestId("button").querySelector<HTMLElement>("[data-material-base]")?.style.background).toBe("rgb(220, 38, 38)")
})
