import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import { defaultAppearance } from "@phreshos/core"
import {
  AppearanceProvider, Surface, Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Radio,
  type MaterialOptions, type SurfaceProps,
  type ButtonProps, type InputProps, type CheckboxProps, type SwitchProps, type RadioProps, type SelectProps
} from "../source/main.js"

afterEach(cleanup)

it("keeps Surface material properties flat while controls group their customization", () => {
  expectTypeOf<"color" extends keyof MaterialOptions ? true : false>().toEqualTypeOf<false>()
  expectTypeOf<"material" extends keyof SurfaceProps ? true : false>().toEqualTypeOf<false>()
  expectTypeOf<SurfaceProps["opacity"]>().toEqualTypeOf<MaterialOptions["opacity"]>()
  expectTypeOf<ButtonProps["material"]>().toEqualTypeOf<MaterialOptions | undefined>()
  expectTypeOf<InputProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<CheckboxProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<SwitchProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<RadioProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
  expectTypeOf<SelectProps["material"]>().toEqualTypeOf<ButtonProps["material"]>()
})

it("renders a div by default and preserves the selected host contract", () => {
  const div = createRef<HTMLDivElement>()
  const button = createRef<HTMLButtonElement>()
  const { container } = render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <Surface ref={div} data-testid="surface">Content</Surface>
    <Surface as="button" ref={button} data-testid="button" type="button">Action</Surface>
  </AppearanceProvider>)
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

it("accepts flattened material properties without another rendered entity", () => {
  render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <Surface data-testid="geometry" color="#345678" opacity={0.45} backdrop={0}
      style={{ width: 80, height: 60 }} />
  </AppearanceProvider>)
  const geometry = screen.getByTestId("geometry")
  const material = geometry.querySelector<HTMLElement>("[data-material]")

  expect(material?.parentElement).toBe(geometry)
  expect(material?.style.position).toBe("absolute")
  expect(material?.style.inset).toBe("0px")
  expect(material?.style.borderRadius).toBe("inherit")
  expect(material?.querySelector<SVGRectElement>("[data-material-base]")?.style.fill).toBe("rgb(52, 86, 120)")
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
    : <RadioGroup label="Values" color="#345678" material={material} onChange={action}><Radio label="Value" value="one" /></RadioGroup>
  const { container } = render(<AppearanceProvider appearance={defaultAppearance} theme="light">{example}</AppearanceProvider>)
  const base = container.querySelector<SVGRectElement>("[data-material-base]")

  expect(base).not.toBeNull()
  expect(container.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.45")
  expect(container.querySelector("[data-material-backdrop]")).toBeNull()
  expect(container.querySelector("[material]")).toBeNull()

  const user = userEvent.setup()
  if (kind === "input" || kind === "textarea") await user.type(screen.getByRole("textbox"), "A")
  else if (kind === "select") {
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByRole("option", { name: "One" }))
  } else await user.click(screen.getByRole(kind))

  expect(action).toHaveBeenCalled()
})

it("lets a Radio override its group's material independently from color and radius", () => {
  render(<AppearanceProvider appearance={defaultAppearance} theme="light">
    <RadioGroup label="Choices" material={{ opacity: 0.6 }}>
      <Radio label="One" value="one" />
      <Radio label="Two" value="two" material={{ opacity: 0.3 }} />
    </RadioGroup>
    <Button data-testid="button" color="danger:base" radius="small" material={{ opacity: 0.4 }}>Action</Button>
  </AppearanceProvider>)

  expect([...document.querySelectorAll("[data-material-fill]")].slice(0, 2).map(element => element.getAttribute("opacity"))).toEqual(["0.6", "0.3"])
  expect(screen.getByTestId("button").style.borderRadius).toBe("5px")
  expect(screen.getByTestId("button").querySelector<SVGRectElement>("[data-material-base]")?.style.fill).toBe("rgb(220, 38, 38)")
})
