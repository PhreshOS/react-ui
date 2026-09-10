import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import { defaultAppearance } from "@phreshos/core"
import {
  AppearanceProvider, Material, Surface, Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Radio,
  type MaterialProps, type SurfaceElement, type SurfaceOptions,
  type ButtonProps, type InputProps, type CheckboxProps, type SwitchProps, type RadioProps, type SelectProps
} from "../source/main.js"

afterEach(cleanup)

it("defines Material as visual options and Surface as a non-void native host", () => {
  expectTypeOf<SurfaceOptions>().toExtend<MaterialProps>()
  expectTypeOf<"radius" extends keyof MaterialProps ? true : false>().toEqualTypeOf<false>()
  expectTypeOf<"button">().toExtend<SurfaceElement>()
  expectTypeOf<"input">().not.toExtend<SurfaceElement>()
  expectTypeOf<ButtonProps["surface"]>().toEqualTypeOf<SurfaceOptions | undefined>()
  expectTypeOf<InputProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<CheckboxProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<SwitchProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<RadioProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
  expectTypeOf<SelectProps["surface"]>().toEqualTypeOf<ButtonProps["surface"]>()
})

it("renders Surface directly as its selected native element", () => {
  const ref = createRef<HTMLButtonElement>()
  const { container } = render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <Surface as="button" ref={ref} type="button" data-testid="surface">Action</Surface>
  </AppearanceProvider>)
  const button = screen.getByRole("button")

  expect(ref.current).toBe(button)
  expect(button.parentElement).toBe(container)
  expect(button.querySelector("[data-material]")).not.toBeNull()
  expect(screen.getByText("Action")).toBe(button)
})

it("renders Material independently inside caller-owned geometry", () => {
  render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <div data-testid="geometry" style={{ position: "relative", isolation: "isolate", width: 80, height: 60, borderRadius: 12 }}>
      <Material color="#345678" opacity={0.45} backdrop={0} />
    </div>
  </AppearanceProvider>)
  const geometry = screen.getByTestId("geometry")
  const material = geometry.querySelector<HTMLElement>("[data-material]")

  expect(material?.parentElement).toBe(geometry)
  expect(material?.style.position).toBe("absolute")
  expect(material?.style.inset).toBe("0px")
  expect(material?.style.borderRadius).toBe("inherit")
  expect(material?.querySelector<SVGRectElement>("[data-material-base]")?.style.fill).toBe("rgb(52, 86, 120)")
  expect(material?.querySelector("[data-surface-edge]")).toBeNull()
})

it.each(["button", "input", "textarea", "select", "checkbox", "switch", "radio"] as const)("applies explicit Surface options to %s without leaking props or changing behavior", async kind => {
  const surface: SurfaceOptions = { color: "#345678", radius: 7, opacity: 0.45, backdrop: 0 }
  const action = vi.fn()
  const example = kind === "button" ? <Button color="primary" surface={surface} onPress={action}>Action</Button>
    : kind === "input" ? <Input label="Value" surface={surface} onChange={action} />
    : kind === "textarea" ? <Textarea label="Value" surface={surface} onChange={action} />
    : kind === "select" ? <Select label="Value" surface={surface} options={[{ value: "one", label: "One" }]} onChange={action} />
    : kind === "checkbox" ? <Checkbox label="Value" surface={surface} onChange={action} />
    : kind === "switch" ? <Switch label="Value" surface={surface} onChange={action} />
    : <RadioGroup label="Values" surface={surface} onChange={action}><Radio label="Value" value="one" /></RadioGroup>
  const { container } = render(<AppearanceProvider appearance={defaultAppearance} theme="light">{example}</AppearanceProvider>)
  const base = container.querySelector<SVGRectElement>("[data-material-base]")
  const host = container.querySelector("[data-material]")?.parentElement

  expect(base?.style.fill).toBe("rgb(52, 86, 120)")
  expect(host?.style.borderRadius).toBe("7px")
  expect(container.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.45")
  expect(container.querySelector("[data-material-backdrop]")).toBeNull()
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

it("lets a Radio override its group's material and preserves undefined defaults", () => {
  render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <RadioGroup label="Choices" surface={{ opacity: 0.6 }}>
      <Radio label="One" value="one" />
      <Radio label="Two" value="two" surface={{ opacity: 0.3 }} />
    </RadioGroup>
    <Button data-testid="button" color="danger" radius="small" surface={{ color: undefined, radius: undefined }}>Action</Button>
  </AppearanceProvider>)

  expect([...document.querySelectorAll("[data-material-fill]")].slice(0, 2).map(element => element.getAttribute("opacity"))).toEqual(["0.6", "0.3"])
  expect(screen.getByTestId("button").style.borderRadius).toBe("5px")
  expect(screen.getByTestId("button").querySelector<SVGRectElement>("[data-material-base]")?.style.fill).toBe("rgb(220, 38, 38)")
})
