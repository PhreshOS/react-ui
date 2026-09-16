import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ContextMenu, Menu } from "../source/main.js"

afterEach(cleanup)

function Example({ onAction, onOpenChange }: Readonly<{
  onAction(): void
  onOpenChange?(open: boolean): void
}>) {
  return <ContextMenu onOpenChange={onOpenChange}>
    <ContextMenu.Trigger><button>Workspace tile</button></ContextMenu.Trigger>
    <ContextMenu.Content>
      <Menu aria-label="Workspace actions">
        <Menu.Item onAction={onAction}>Open</Menu.Item>
        <Menu.Item disabled onAction={onAction}>Delete</Menu.Item>
      </Menu>
    </ContextMenu.Content>
  </ContextMenu>
}

describe("ContextMenu", function () {
  it("opens on a context request without activating the trigger", function () {
    const action = vi.fn()
    render(<Example onAction={action} />)

    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }), { clientX: 40, clientY: 40 })

    expect(screen.getByRole("menu", { name: "Workspace tile" })).toBeTruthy()
    expect(action).not.toHaveBeenCalled()
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

  it("removes portalled content when its owner unmounts", function () {
    const rendered = render(<Example onAction={() => undefined} />)
    fireEvent.contextMenu(screen.getByRole("button", { name: "Workspace tile" }))

    rendered.unmount()

    expect(screen.queryByRole("menu")).toBeNull()
  })
})
