import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Button,
  Toolbar,
  UIProvider,
  defaultAppearance,
  type ToolbarProps
} from "../source/main.js"

afterEach(cleanup)

it("exposes the orientation and Appearance-derived layout contract", function () {
  expectTypeOf<ToolbarProps["orientation"]>().toEqualTypeOf<"horizontal" | "vertical" | undefined>()

  renderToolbar(<Toolbar aria-label="Document actions" gap="large">
    <Button>Save</Button>
    <Toolbar.Separator />
    <Button>Share</Button>
  </Toolbar>)

  const toolbar = screen.getByRole("toolbar", { name: "Document actions" })
  const separator = screen.getByRole("separator")

  expect(toolbar.getAttribute("aria-orientation")).toBe("horizontal")
  expect(toolbar.style.gap).toBe("18px")
  expect(separator.getAttribute("aria-orientation")).toBe("vertical")
  expect(separator.style.width).toBe("1px")
})

it("moves focus between controls with orientation-aware arrow keys", async function () {
  const user = userEvent.setup()

  renderToolbar(<Toolbar aria-label="History">
    <Toolbar.Group aria-label="History actions">
      <Button>Undo</Button>
      <Button disabled>Redo</Button>
    </Toolbar.Group>
    <Toolbar.Separator />
    <Button>Save</Button>
  </Toolbar>)

  const undo = screen.getByRole("button", { name: "Undo" })
  const save = screen.getByRole("button", { name: "Save" })

  undo.focus()
  await user.keyboard("[ArrowRight]")
  expect(document.activeElement).toBe(save)

  await user.keyboard("[ArrowLeft]")
  expect(document.activeElement).toBe(undo)
})

it("uses vertical navigation and a horizontal separator", async function () {
  const user = userEvent.setup()

  renderToolbar(<Toolbar aria-label="Formatting" orientation="vertical">
    <Button>Bold</Button>
    <Toolbar.Separator />
    <Button>Italic</Button>
  </Toolbar>)

  const bold = screen.getByRole("button", { name: "Bold" })
  const italic = screen.getByRole("button", { name: "Italic" })
  const separator = screen.getByRole("separator")

  expect(separator.style.height).toBe("1px")
  expect(separator.style.width).toBe("50%")

  bold.focus()
  await user.keyboard("[ArrowDown]")
  expect(document.activeElement).toBe(italic)
})

it("uses the resolved React UI direction for horizontal navigation", async function () {
  const user = userEvent.setup()

  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
    <Toolbar aria-label="Direction">
      <Button>First</Button>
      <Button>Second</Button>
      <Button>Third</Button>
    </Toolbar>
  </UIProvider>)

  const second = screen.getByRole("button", { name: "Second" })
  second.focus()

  await user.keyboard("[ArrowRight]")
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "First" }))

  second.focus()
  await user.keyboard("[ArrowLeft]")
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Third" }))
})

it("leaves actions owned by their controls", async function () {
  const save = vi.fn()

  renderToolbar(<Toolbar aria-label="Document actions">
    <Button onPress={save}>Save</Button>
  </Toolbar>)

  await userEvent.setup().click(screen.getByRole("button", { name: "Save" }))
  expect(save).toHaveBeenCalledOnce()
})

it("derives its separator from the Toolbar color", function () {
  const content = (color: "primary" | "danger") => <Toolbar aria-label="Actions" color={color}>
    <Button>First</Button>
    <Toolbar.Separator />
    <Button>Second</Button>
  </Toolbar>
  const view = renderToolbar(content("primary"))
  const separator = screen.getByRole("separator")
  const primary = separator.style.background

  view.rerender(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {content("danger")}
  </UIProvider>)

  expect(separator.style.background).not.toBe(primary)
})

function renderToolbar(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}
