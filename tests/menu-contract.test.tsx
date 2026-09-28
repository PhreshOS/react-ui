import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  DropdownMenu,
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

function Wallpaper({ onAction, onPlace }: Readonly<{ onAction?(value: string): void, onPlace?(value: string): void }>) {
  return <DropdownMenu>
    <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <Menu aria-label="Actions" onAction={onAction}>
        <Menu.Item id="open">Open</Menu.Item>
        <Menu.Submenu>
          <Menu.Item id="wallpaper">Set as wallpaper</Menu.Item>
          <Menu.Submenu.Content>
            <Menu aria-label="Where" onAction={onPlace}>
              <Menu.Item id="desktop">Desktop</Menu.Item>
              <Menu.Item id="sign-in">Sign-in screen</Menu.Item>
            </Menu>
          </Menu.Submenu.Content>
        </Menu.Submenu>
      </Menu>
    </DropdownMenu.Content>
  </DropdownMenu>
}

it("opens a Submenu from its Item, and reports the chosen value to the Submenu's Menu", async function () {
  const user = userEvent.setup()
  const onAction = vi.fn()
  const onPlace = vi.fn()

  render(<Wallpaper onAction={onAction} onPlace={onPlace} />)

  await user.click(screen.getByRole("button", { name: "Actions" }))
  const item = screen.getByRole("menuitem", { name: "Set as wallpaper" })

  // The Item says it opens a Submenu and marks it with a chevron.
  expect(item.getAttribute("aria-haspopup")).toBe("menu")
  expect(item.querySelector("svg")).not.toBeNull()

  await user.click(item)
  await user.click(await screen.findByRole("menuitem", { name: "Sign-in screen" }))

  expect(onPlace).toHaveBeenCalledWith("sign-in")
  expect(onAction).not.toHaveBeenCalled()
  // Choosing in a Submenu closes every Menu.
  expect(screen.queryByRole("menu")).toBeNull()
})

it("opens a Submenu from the keyboard and returns to its Item", async function () {
  const user = userEvent.setup()

  render(<Wallpaper />)

  await user.click(screen.getByRole("button", { name: "Actions" }))
  await user.keyboard("{ArrowDown}{ArrowDown}")
  expect(document.activeElement?.textContent).toContain("Set as wallpaper")

  await user.keyboard("{ArrowRight}")
  expect(await screen.findByRole("menuitem", { name: "Desktop" })).toBeTruthy()

  await user.keyboard("{ArrowLeft}")
  expect(screen.queryByRole("menuitem", { name: "Desktop" })).toBeNull()
  expect(document.activeElement?.textContent).toContain("Set as wallpaper")
})
