import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Menu,
  type MenuItemProps,
  type MenuMultipleSelectionProps,
  type MenuProps,
  type MenuSingleSelectionProps
} from "../source/main.js"

afterEach(cleanup)

it("uses the shared string selection contract", function () {
  expectTypeOf<MenuItemProps["id"]>().toEqualTypeOf<string | undefined>()
  expectTypeOf<MenuSingleSelectionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<MenuMultipleSelectionProps["value"]>().toEqualTypeOf<readonly string[] | "all" | undefined>()
  expectTypeOf<MenuProps["disabledValues"]>().toEqualTypeOf<readonly string[] | undefined>()
})

it("reports selected values and actions as string identities", async function () {
  const onChange = vi.fn()
  const onItemAction = vi.fn()

  render(<Menu
    aria-label="View"
    selectionMode="single"
    defaultValue="comfortable"
    onChange={onChange}
    onItemAction={onItemAction}
  >
    <Menu.Item id="comfortable">Comfortable</Menu.Item>
    <Menu.Item id="compact">Compact</Menu.Item>
  </Menu>)

  await userEvent.setup().click(screen.getByRole("menuitemradio", { name: "Compact" }))

  expect(onChange).toHaveBeenLastCalledWith("compact")
  expect(onItemAction).toHaveBeenLastCalledWith("compact")
})

it("keeps command menus selection-free by default", async function () {
  const onItemAction = vi.fn()
  render(<Menu aria-label="Actions" onItemAction={onItemAction}>
    <Menu.Item id="open">Open</Menu.Item>
  </Menu>)

  await userEvent.setup().click(screen.getByRole("menuitem", { name: "Open" }))
  expect(onItemAction).toHaveBeenLastCalledWith("open")
})
