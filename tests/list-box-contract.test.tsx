import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  ListBox,
  UIProvider,
  defaultAppearance,
  type ListBoxItemProps,
  type ListBoxMultipleSelectionProps,
  type ListBoxSingleSelectionProps
} from "../source/main.js"
import { colorOpacity, opaqueColor, solidColors } from "../source/color.js"

afterEach(cleanup)

it("uses string identities and value callbacks instead of primitive-specific selection names", function () {
  expectTypeOf<ListBoxItemProps["id"]>().toEqualTypeOf<string>()
  expectTypeOf<ListBoxSingleSelectionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<ListBoxSingleSelectionProps["onChange"]>().toEqualTypeOf<((value: string | null) => void) | undefined>()
  expectTypeOf<ListBoxMultipleSelectionProps["value"]>().toEqualTypeOf<readonly string[] | "all" | undefined>()
  expectTypeOf<ListBoxMultipleSelectionProps["onChange"]>().toEqualTypeOf<((value: readonly string[] | "all") => void) | undefined>()
})

it("selects one value by default with pointer, keyboard, and typeahead behavior", async function () {
  const onChange = vi.fn()
  const user = userEvent.setup()

  renderListBox(<ListBox aria-label="Projects" defaultValue="alpha" onChange={onChange}>
    <ListBox.Item id="alpha">Alpha</ListBox.Item>
    <ListBox.Item id="blocked" disabled>Blocked</ListBox.Item>
    <ListBox.Item id="charlie">Charlie</ListBox.Item>
  </ListBox>)

  const alpha = screen.getByRole("option", { name: "Alpha" })
  const blocked = screen.getByRole("option", { name: "Blocked" })
  const charlie = screen.getByRole("option", { name: "Charlie" })

  expect(alpha.getAttribute("aria-selected")).toBe("true")
  expect(blocked.getAttribute("aria-disabled")).toBe("true")
  await user.click(blocked)
  expect(onChange).not.toHaveBeenCalled()

  alpha.focus()
  await user.keyboard("[ArrowDown]")
  expect(document.activeElement).toBe(charlie)
  await user.keyboard("[Enter]")
  expect(onChange).toHaveBeenLastCalledWith("charlie")

  await user.keyboard("a")
  expect(document.activeElement).toBe(alpha)
})

it("uses the React UI direction for horizontal collection navigation", async function () {
  const user = userEvent.setup()
  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
    <ListBox aria-label="Pages" orientation="horizontal" defaultValue="one">
      <ListBox.Item id="one">One</ListBox.Item>
      <ListBox.Item id="two">Two</ListBox.Item>
    </ListBox>
  </UIProvider>)

  const one = screen.getByRole("option", { name: "One" })
  const two = screen.getByRole("option", { name: "Two" })
  one.focus()
  await user.keyboard("[ArrowLeft]")
  expect(document.activeElement).toBe(two)
})

it("supports multiple controlled values without exposing React Aria key sets", async function () {
  const onChange = vi.fn()

  renderListBox(<ListBox
    aria-label="Tools"
    selectionMode="multiple"
    value={["editor"]}
    onChange={onChange}
  >
    <ListBox.Item id="editor">Editor</ListBox.Item>
    <ListBox.Item id="terminal">Terminal</ListBox.Item>
  </ListBox>)

  expect(screen.getByRole("option", { name: "Editor" }).getAttribute("aria-selected")).toBe("true")
  await userEvent.setup().click(screen.getByRole("option", { name: "Terminal" }))
  expect(onChange).toHaveBeenLastCalledWith(["editor", "terminal"])
  expect(screen.getByRole("option", { name: "Terminal" }).getAttribute("aria-selected")).toBe("false")
})

it("composes grouped options without turning sections into tree branches", function () {
  renderListBox(<ListBox aria-label="Destinations">
    <ListBox.Section id="local">
      <ListBox.Header>Local</ListBox.Header>
      <ListBox.Item id="documents">Documents</ListBox.Item>
      <ListBox.Item id="downloads">Downloads</ListBox.Item>
    </ListBox.Section>
    <ListBox.Section id="remote">
      <ListBox.Header>Remote</ListBox.Header>
      <ListBox.Item id="server">Server</ListBox.Item>
    </ListBox.Section>
  </ListBox>)

  expect(screen.getAllByRole("group")).toHaveLength(2)
  expect(screen.getByText("Local")).toBeTruthy()
  expect(screen.getByRole("option", { name: "Server" })).toBeTruthy()
  expect(screen.queryByRole("tree")).toBeNull()
  expect(screen.queryByRole("treeitem")).toBeNull()
})

it("supports dynamic collections while keeping identities explicit", function () {
  const items = [
    { id: "one", label: "One" },
    { id: "two", label: "Two" }
  ]

  renderListBox(<ListBox aria-label="Numbers" items={items}>
    {item => <ListBox.Item id={item.id} textValue={item.label}>{item.label}</ListBox.Item>}
  </ListBox>)

  expect(screen.getAllByRole("option").map(option => option.textContent?.replace("✓", ""))).toEqual(["One", "Two"])
})

it("shares Select option paint and keeps pointer hover separate from keyboard focus", async function () {
  const user = userEvent.setup()
  renderListBox(<ListBox aria-label="Colors" color="secondary:base" defaultValue="one">
    <ListBox.Item id="one">One</ListBox.Item>
    <ListBox.Item id="two">Two</ListBox.Item>
  </ListBox>)

  const selected = screen.getByRole("option", { name: "One" })
  const available = screen.getByRole("option", { name: "Two" })
  const palette = solidColors(
    defaultAppearance.colors.light.secondary,
    defaultAppearance.colors.light.background,
    defaultAppearance.colors.light.foreground
  )

  expect(selected.style.background).toBe(css(palette.rest.background))
  expect(available.style.background).toBe("transparent")

  await user.hover(available)
  expect(available.getAttribute("data-focused")).toBeNull()
  expect(available.style.background).not.toBe("transparent")
  expect(available.style.outline).toBe("none")

  selected.focus()
  await user.keyboard("[ArrowDown]")
  expect(available.style.outline).toBe(`1px solid ${colorOpacity(opaqueColor(defaultAppearance.colors.light.secondary), 0.2)}`)
})

function renderListBox(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}

function css(value: string) {
  const element = document.createElement("div")
  element.style.background = value
  return element.style.background
}
