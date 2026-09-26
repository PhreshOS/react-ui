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
  expectTypeOf<MenuItemProps["id"]>().toEqualTypeOf<string>()
  expectTypeOf<MenuSingleSelectionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<MenuMultipleSelectionProps["value"]>().toEqualTypeOf<readonly string[] | "all" | undefined>()
  expectTypeOf<MenuProps["onAction"]>().toEqualTypeOf<((value: string) => void) | undefined>()
  expectTypeOf<"disabledValues">().not.toExtend<keyof MenuProps>()
})

it("reports selected values and actions as string identities", async function () {
  const onChange = vi.fn()
  const onAction = vi.fn()

  render(<Menu
    aria-label="View"
    selectionMode="single"
    defaultValue="comfortable"
    onChange={onChange}
    onAction={onAction}
  >
    <Menu.Item id="comfortable">Comfortable</Menu.Item>
    <Menu.Item id="compact">Compact</Menu.Item>
  </Menu>)

  await userEvent.setup().click(screen.getByRole("menuitemradio", { name: "Compact" }))

  expect(onChange).toHaveBeenLastCalledWith("compact")
  expect(onAction).toHaveBeenLastCalledWith("compact")
})

it("keeps command menus selection-free by default", async function () {
  const onAction = vi.fn()
  render(<Menu aria-label="Actions" onAction={onAction}>
    <Menu.Item id="open">Open</Menu.Item>
  </Menu>)

  await userEvent.setup().click(screen.getByRole("menuitem", { name: "Open" }))
  expect(onAction).toHaveBeenLastCalledWith("open")
})
