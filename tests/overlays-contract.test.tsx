import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button, ContextMenu, defaultAppearance, DropdownMenu, Menu, Popover, Select, Tooltip, UIProvider } from "../source/main.js"
import { paintDeclarations } from "./support/paint.js"

afterEach(cleanup)

describe("DropdownMenu", function () {
  it("composes its trigger, positioned Surface, and Menu without merging their contracts", async function () {
    const action = vi.fn()
    render(<DropdownMenu>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content data-testid="menu-surface">
        <Menu aria-label="Actions">
          <Menu.Item id="rename" onAction={action}>Rename</Menu.Item>
        </Menu>
      </DropdownMenu.Content>
    </DropdownMenu>)

    await userEvent.setup().click(screen.getByRole("button", { name: "Actions" }))
    const menu = screen.getByRole("menu", { name: "Actions" })
    const positionedContent = screen.getByTestId("menu-surface")
    const materialHost = positionedContent.querySelector(".phreshos-surface")
    expect(menu.parentElement).toBe(materialHost)
    expect(materialHost).not.toBe(positionedContent)
    expect(positionedContent.classList.contains("phreshos-surface")).toBe(false)

    await userEvent.setup().click(screen.getByRole("menuitem", { name: "Rename" }))
    expect(action).toHaveBeenCalledOnce()
    expect(screen.queryByRole("menu")).toBeNull()
  })
})

describe("Window focus", function () {
  it("closes an open list or menu when its window loses focus, as a native one does", async function () {
    const user = userEvent.setup()
    render(<>
      <Select label="Theme"><Select.Item id="light">Light</Select.Item><Select.Item id="dark">Dark</Select.Item></Select>
      <DropdownMenu>
        <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content><Menu aria-label="Actions"><Menu.Item id="rename">Rename</Menu.Item></Menu></DropdownMenu.Content>
      </DropdownMenu>
    </>)

    await user.click(screen.getByRole("button", { name: /Theme/ }))
    expect(screen.getByRole("listbox")).toBeTruthy()
    act(() => { window.dispatchEvent(new FocusEvent("blur")) })
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())

    await user.click(screen.getByRole("button", { name: "Actions" }))
    expect(screen.getByRole("menu", { name: "Actions" })).toBeTruthy()
    act(() => { window.dispatchEvent(new FocusEvent("blur")) })
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
  })
})

describe("Floating layers", function () {
  it("frost what lies under them by default, and take another material when given one", async function () {
    const user = userEvent.setup()
    const blurred = { ...defaultAppearance, material: { ...defaultAppearance.material, light: { ...defaultAppearance.material.light, backdropBlur: 8 } } }
    render(<UIProvider appearance={blurred} preferences={{ theme: "light", animations: false }}>
      <Popover><Popover.Trigger>Details</Popover.Trigger><Popover.Content data-testid="frosted"><Popover.Dialog aria-label="Details">Text</Popover.Dialog></Popover.Content></Popover>
      <Popover><Popover.Trigger>Plain</Popover.Trigger><Popover.Content data-testid="plain" material="translucent"><Popover.Dialog aria-label="Plain">Text</Popover.Dialog></Popover.Content></Popover>
    </UIProvider>)
    await user.click(screen.getByRole("button", { name: "Details" }))
    const frosted = screen.getByTestId("frosted").querySelector<HTMLElement>(".phreshos-surface")!
    expect(paintDeclarations(frosted)["--phreshos-surface-frost"]).toBe("blur(8px)")
    await user.keyboard("[Escape]")
    await user.click(screen.getByRole("button", { name: "Plain" }))
    const plain = screen.getByTestId("plain").querySelector<HTMLElement>(".phreshos-surface")!
    expect(paintDeclarations(plain)["--phreshos-surface-frost"]).toBe("none")
  })
})

describe("Popover", function () {
  it("keeps positioned content and dialog semantics independently configurable", async function () {
    render(<Popover>
      <Popover.Trigger>Details</Popover.Trigger>
      <Popover.Content data-testid="popover-surface">
        <Popover.Dialog aria-label="Details">
          <Popover.Title>Properties</Popover.Title>
          <Popover.Close>Done</Popover.Close>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>)

    await userEvent.setup().click(screen.getByRole("button", { name: "Details" }))
    expect(screen.getByRole("dialog", { name: "Details" })).toBeTruthy()
    const positionedContent = screen.getByTestId("popover-surface")
    const materialHost = positionedContent.querySelector<HTMLElement>(".phreshos-surface")
    expect(materialHost).not.toBeNull()
    expect(positionedContent.classList.contains("phreshos-surface")).toBe(false)
    expect(materialHost?.style.fontSize).toBe("")
    const title = screen.getByRole("heading", { name: "Properties" })
    expect(title.style.margin).toBe("0px")
    expect(title.style.fontFamily).toBe("inherit")
    expect(title.style.fontSize).toBe("0.8125em")
    expect(title.style.lineHeight).toBe("1.45")

    await userEvent.setup().click(screen.getByRole("button", { name: "Done" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("Tooltip", function () {
  it("describes its trigger on focus", async function () {
    const user = userEvent.setup()
    render(<Tooltip delay={0} closeDelay={0}>
      <Tooltip.Trigger>Save</Tooltip.Trigger>
      <Tooltip.Content>Save this document</Tooltip.Content>
    </Tooltip>)

    await user.tab()

    expect((await screen.findByRole("tooltip")).textContent).toBe("Save this document")
    expect(screen.getByRole("button", { name: "Save" }).getAttribute("aria-describedby")).toBeTruthy()
  })

  it("describes any Button inside it, one with its own context menu too, from a container of its own", async function () {
    const user = userEvent.setup()
    const container = document.createElement("div")
    document.body.append(container)
    render(<Tooltip delay={0} closeDelay={0}>
      <ContextMenu>
        <ContextMenu.Trigger><Button>Notes</Button></ContextMenu.Trigger>
        <ContextMenu.Content><Menu aria-label="Notes"><Menu.Item id="close">Close</Menu.Item></Menu></ContextMenu.Content>
      </ContextMenu>
      <Tooltip.Content portalContainer={container}>Notes, minimized</Tooltip.Content>
    </Tooltip>)

    await user.tab()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip.textContent).toBe("Notes, minimized")
    expect(container.contains(tooltip)).toBe(true)

    await user.pointer({ keys: "[MouseRight]", target: screen.getByRole("button", { name: "Notes" }) })
    expect(await screen.findByRole("menuitem", { name: "Close" })).toBeTruthy()
    container.remove()
  })
})
