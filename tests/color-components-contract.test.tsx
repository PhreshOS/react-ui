import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, it, vi } from "vitest"
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  UIProvider,
  defaultAppearance
} from "../source/main.js"

afterEach(cleanup)

function renderUI(children: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>{children}</UIProvider>)
}

it("shows an Appearance role or any CSS color as a control-sized swatch", function () {
  renderUI(<><ColorSwatch data-testid="role" color="primary" /><ColorSwatch data-testid="css" color="#123456" size="small" /></>)
  expect(screen.getByTestId("role").style.backgroundColor).toBe(hexToRgb(defaultAppearance.colors.light.primary))
  expect(screen.getByTestId("css").style.backgroundColor).toBe("rgb(18, 52, 86)")
  expect(screen.getByTestId("css").style.height).toBe("28px")
})

it("chooses one swatch and reports its hex value", async function () {
  const onChange = vi.fn()
  renderUI(<ColorSwatchPicker aria-label="Accent" defaultValue="#ff0000" onChange={onChange}>
    <ColorSwatchPicker.Item value="#ff0000" />
    <ColorSwatchPicker.Item value="#00ff00" />
  </ColorSwatchPicker>)

  const options = screen.getAllByRole("option")
  expect(options[0]!.getAttribute("aria-selected")).toBe("true")
  await userEvent.setup().click(options[1]!)
  expect(onChange).toHaveBeenLastCalledWith("#00FF00")
})

it("moves one channel with the keyboard and reports a hex value", async function () {
  const onChange = vi.fn()
  renderUI(<ColorSlider label="Hue" channel="hue" defaultValue="hsl(0, 100%, 50%)" onChange={onChange} />)

  const slider = screen.getByRole("slider")
  slider.focus()
  await userEvent.setup().keyboard("{ArrowRight}")
  expect(onChange).toHaveBeenCalled()
  expect(onChange.mock.lastCall![0]).toMatch(/^#[0-9A-F]{6}$/)
  expect(screen.getByText("Hue")).toBeTruthy()
})

it("moves two channels on an area and reports a hex value", async function () {
  const onChange = vi.fn()
  renderUI(<ColorArea aria-label="Color" defaultValue="hsb(200, 50%, 50%)" onChange={onChange} />)

  const [x] = screen.getAllByRole("slider")
  x!.focus()
  await userEvent.setup().keyboard("{ArrowRight}")
  expect(onChange.mock.lastCall![0]).toMatch(/^#[0-9A-F]{6}$/)
})

it("reads a typed hex color and reports an emptied field as null", async function () {
  const onChange = vi.fn()
  renderUI(<ColorField label="Accent" defaultValue="#112233" onChange={onChange} />)
  const input = screen.getByRole("textbox", { name: "Accent" })
  const user = userEvent.setup()

  await user.clear(input)
  await user.tab()
  expect(onChange).toHaveBeenLastCalledWith(null)

  await user.type(input, "#abcdef")
  await user.tab()
  expect(onChange).toHaveBeenLastCalledWith("#ABCDEF")
})

it("edits one color from every component inside its popover", async function () {
  const onChange = vi.fn()
  renderUI(<ColorPicker defaultValue="#ff0000" onChange={onChange}>
    <ColorPicker.Trigger aria-label="Pick a color" />
    <ColorPicker.Content>
      <ColorSlider channel="hue" colorSpace="hsl" label="Hue" />
      <ColorField aria-label="Hex" />
    </ColorPicker.Content>
  </ColorPicker>)
  const user = userEvent.setup()

  await user.click(screen.getByRole("button", { name: "Pick a color" }))
  const hex = await screen.findByRole("textbox", { name: "Hex" })
  expect((hex as HTMLInputElement).value).toBe("#FF0000")

  screen.getByRole("slider").focus()
  await user.keyboard("{ArrowRight}")
  await waitFor(() => expect(onChange).toHaveBeenCalled())
  expect(onChange.mock.lastCall![0]).toMatch(/^#[0-9A-F]{6}$/)
  expect(onChange.mock.lastCall![0]).not.toBe("#FF0000")
})

function hexToRgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}
