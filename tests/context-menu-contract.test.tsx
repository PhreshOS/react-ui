import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Button as AriaButton,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover
} from "react-aria-components"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ComponentType } from "react"

type ContextMenuProperties = Readonly<{
  onAction(): void
  onOpenChange?(open: boolean): void
}>

const candidates: readonly [string, ComponentType<ContextMenuProperties>][] = [
  ["React Aria", function Candidate({ onAction, onOpenChange }) {
    return <AriaMenuTrigger trigger="contextMenu" onOpenChange={onOpenChange}>
      <AriaButton>Workspace tile</AriaButton>
      <AriaPopover>
        <AriaMenu aria-label="Workspace actions">
          <AriaMenuItem onAction={onAction}>Open</AriaMenuItem>
          <AriaMenuItem isDisabled onAction={onAction}>Delete</AriaMenuItem>
        </AriaMenu>
      </AriaPopover>
    </AriaMenuTrigger>
  }],
  ["Base UI", function Candidate({ onAction, onOpenChange }) {
    return <BaseContextMenu.Root onOpenChange={open => onOpenChange?.(open)}>
      <BaseContextMenu.Trigger tabIndex={0}>Workspace tile</BaseContextMenu.Trigger>
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner>
          <BaseContextMenu.Popup aria-label="Workspace tile">
            <BaseContextMenu.Item onClick={onAction}>Open</BaseContextMenu.Item>
            <BaseContextMenu.Item disabled onClick={onAction}>Delete</BaseContextMenu.Item>
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  }]
]

afterEach(cleanup)

describe.each(candidates)("%s Context Menu", function (_name, Candidate) {
  it("opens on right click without activating the trigger", function () {
    render(<Candidate onAction={() => undefined} />)

    fireEvent.contextMenu(screen.getByText("Workspace tile"), { clientX: 40, clientY: 40 })

    expect(screen.getByRole("menu", { name: "Workspace tile" })).toBeTruthy()
  })

  it("opens when a focused trigger receives a keyboard-originated context-menu event", function () {
    render(<Candidate onAction={() => undefined} />)

    const trigger = screen.getByText("Workspace tile")
    trigger.focus()
    fireEvent.contextMenu(trigger, { button: 0, detail: 0 })

    expect(screen.getByRole("menu", { name: "Workspace tile" })).toBeTruthy()
  })

  it("reports item activation and closes", async function () {
    const onAction = vi.fn()
    const onOpenChange = vi.fn()

    render(<Candidate onAction={onAction} onOpenChange={onOpenChange} />)

    fireEvent.contextMenu(screen.getByText("Workspace tile"))
    await userEvent.setup().click(screen.getByRole("menuitem", { name: "Open" }))

    expect(onAction).toHaveBeenCalledOnce()
    expect(screen.queryByRole("menu")).toBeNull()
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("does not activate disabled items", async function () {
    const onAction = vi.fn()

    render(<Candidate onAction={onAction} />)

    fireEvent.contextMenu(screen.getByText("Workspace tile"))
    await userEvent.setup().click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(onAction).not.toHaveBeenCalled()
  })

  it("closes with Escape and restores focus", async function () {
    const user = userEvent.setup()

    render(<Candidate onAction={() => undefined} />)

    const trigger = screen.getByText("Workspace tile")
    trigger.focus()
    fireEvent.contextMenu(trigger)
    await user.keyboard("[Escape]")

    expect(screen.queryByRole("menu")).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("removes portalled content when its owner unmounts", function () {
    const rendered = render(<Candidate onAction={() => undefined} />)

    fireEvent.contextMenu(screen.getByText("Workspace tile"))
    rendered.unmount()

    expect(screen.queryByRole("menu")).toBeNull()
  })
})
