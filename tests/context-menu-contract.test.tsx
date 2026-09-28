import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button, ContextMenu, Menu } from "../source/main.js"
import { surfaceFill } from "./support/paint.js"

afterEach(cleanup)

function Example({ onAction, onOpenChange }: Readonly<{
  onAction(): void
  onOpenChange?(open: boolean): void
}>) {
  return <ContextMenu onOpenChange={onOpenChange}>
    <ContextMenu.Trigger><button>Workspace tile</button></ContextMenu.Trigger>
    <ContextMenu.Content>
      <Menu aria-label="Workspace actions">
        <Menu.Item id="open" onAction={onAction}>Open</Menu.Item>
        <Menu.Item id="delete" disabled onAction={onAction}>Delete</Menu.Item>
      </Menu>
    </ContextMenu.Content>
  </ContextMenu>
}

describe("ContextMenu", function () {
  it("positions content inside an explicitly owned coordinate container", function () {
    const container = document.createElement("div")
    document.body.append(container)

    render(<ContextMenu>
      <ContextMenu.Trigger><button>Scaled tile</button></ContextMenu.Trigger>
      <ContextMenu.Content portalContainer={container}>
        <Menu aria-label="Scaled actions"><Menu.Item id="open">Open</Menu.Item></Menu>
      </ContextMenu.Content>
    </ContextMenu>)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Scaled tile" }))
    expect(container.contains(screen.getByRole("menu", { name: "Scaled tile" }))).toBe(true)
    cleanup()
    container.remove()
  })

  it("opens on a context request without activating the trigger", function () {
    const action = vi.fn()
    render(<Example onAction={action} />)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }), { clientX: 40, clientY: 40 })

    expect(screen.getByRole("menu", { name: "Workspace tile" })).toBeTruthy()
    expect(action).not.toHaveBeenCalled()
  })

  it("keeps the menu's press state on the trigger, not on what it holds", function () {
    render(<ContextMenu>
      <ContextMenu.Trigger>
        <div role="grid" tabIndex={0} aria-label="Entries">
          <Button>First row</Button>
          <Button>Second row</Button>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <Menu aria-label="Entry actions"><Menu.Item id="open">Open</Menu.Item></Menu>
      </ContextMenu.Content>
    </ContextMenu>)

    fireEvent.contextMenu(screen.getByRole("button", { name: "First row" }))

    expect(screen.getByRole("menu")).toBeTruthy()
    expect(screen.getByRole("button", { name: "First row" }).hasAttribute("data-pressed")).toBe(false)
    expect(screen.getByRole("button", { name: "Second row" }).hasAttribute("data-pressed")).toBe(false)
  })

  it("opens a Submenu from an Item of the context menu", async function () {
    const onPlace = vi.fn()
    render(<ContextMenu>
      <ContextMenu.Trigger><button>Picture</button></ContextMenu.Trigger>
      <ContextMenu.Content>
        <Menu aria-label="Picture actions">
          <Menu.Submenu>
            <Menu.Item id="wallpaper">Set as wallpaper</Menu.Item>
            <Menu.Submenu.Content>
              <Menu aria-label="Where" onAction={onPlace}><Menu.Item id="desktop">Desktop</Menu.Item></Menu>
            </Menu.Submenu.Content>
          </Menu.Submenu>
        </Menu>
      </ContextMenu.Content>
    </ContextMenu>)

    const user = userEvent.setup()
    fireEvent.contextMenu(screen.getByRole("button", { name: "Picture" }))
    await user.click(screen.getByRole("menuitem", { name: "Set as wallpaper" }))
    await user.click(await screen.findByRole("menuitem", { name: "Desktop" }))

    expect(onPlace).toHaveBeenCalledWith("desktop")
  })

  it("reports item activation and closes", async function () {
    const action = vi.fn()
    const onOpenChange = vi.fn()
    render(<Example onAction={action} onOpenChange={onOpenChange} />)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))
    await userEvent.setup().click(screen.getByRole("menuitem", { name: "Open" }))

    expect(action).toHaveBeenCalledOnce()
    expect(screen.queryByRole("menu")).toBeNull()
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("does not activate disabled items", async function () {
    const action = vi.fn()
    render(<Example onAction={action} />)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))
    await userEvent.setup().click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(action).not.toHaveBeenCalled()
  })

  it("does not retain hover paint after a focused item is left", async function () {
    const user = userEvent.setup()
    render(<Example onAction={() => undefined} />)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))
    const item = screen.getByRole("menuitem", { name: "Open" })
    item.focus()

    await user.hover(item)
    expect(surfaceFill(item)).not.toBe("transparent")

    await user.unhover(item)
    expect(surfaceFill(item)).toBe("transparent")
  })

  it("closes with Escape and restores focus", async function () {
    const user = userEvent.setup()
    render(<Example onAction={() => undefined} />)
    const trigger = screen.getByRole("button", { name: "Workspace tile" })
    trigger.focus()

    fireEvent.contextMenu(trigger)
    await user.keyboard("[Escape]")

    expect(screen.queryByRole("menu")).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("dismisses when pressing outside", function () {
    render(<>
      <Example onAction={() => undefined} />
      <button>Outside</button>
    </>)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }))

    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("leaves other context-menu targets available and reopens on them", function () {
    render(<>
      <Example onAction={() => undefined} />
      <ContextMenu>
        <ContextMenu.Trigger><button>Second tile</button></ContextMenu.Trigger>
        <ContextMenu.Content>
          <Menu aria-label="Second actions"><Menu.Item id="inspect">Inspect</Menu.Item></Menu>
        </ContextMenu.Content>
      </ContextMenu>
    </>)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))

    const second = screen.getByRole("button", { name: "Second tile" })
    expect(second.closest("[inert]")).toBeNull()

    fireEvent.pointerDown(second, { button: 2 })
    fireEvent.contextMenu(second)
    expect(screen.getByRole("menu", { name: "Second tile" })).toBeTruthy()
    expect(screen.queryByRole("menu", { name: "Workspace tile" })).toBeNull()
  })

  it("removes portalled content when its owner unmounts", function () {
    const rendered = render(<Example onAction={() => undefined} />)
    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))

    rendered.unmount()

    expect(screen.queryByRole("menu")).toBeNull()
  })
})
