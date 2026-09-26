import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DropdownMenu, Menu, Popover, Tooltip } from "../source/main.js"

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
    expect(title.style.lineHeight).toBe("1.5")

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
})
