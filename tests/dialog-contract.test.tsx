import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AlertDialog, Dialog, UIProvider, defaultAppearance } from "../source/main.js"
import { resolveColorLevel } from "../source/color.js"

afterEach(cleanup)

function Example({ onOpenChange }: Readonly<{ onOpenChange?(open: boolean): void }>) {
  return <Dialog onOpenChange={onOpenChange}>
    <Dialog.Trigger>Open settings</Dialog.Trigger>
    <Dialog.Backdrop data-testid="dialog-backdrop" isDismissable>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Workspace settings</Dialog.Title>
          <Dialog.Description>Change the active workspace.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body><label>Workspace name <input autoFocus /></label></Dialog.Body>
        <Dialog.Footer>
          <Dialog>
            <Dialog.Trigger>Open advanced</Dialog.Trigger>
            <Dialog.Backdrop isDismissable>
              <Dialog.Content>
                <Dialog.Title>Advanced settings</Dialog.Title>
                <Dialog.Close>Close advanced</Dialog.Close>
              </Dialog.Content>
            </Dialog.Backdrop>
          </Dialog>
          <Dialog.Close>Close settings</Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Backdrop>
  </Dialog>
}

describe("Dialog", function () {
  it("derives the backdrop paint from its color", function () {
    const content = (color: "primary:base" | "danger:base") => <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
      <Dialog isOpen>
        <Dialog.Backdrop color={color} data-testid="dialog-backdrop">
          <Dialog.Content aria-label="Example">Content</Dialog.Content>
        </Dialog.Backdrop>
      </Dialog>
    </UIProvider>
    const view = render(content("primary:base"))
    const backdrop = screen.getByTestId("dialog-backdrop")
    const primary = backdrop.style.background

    view.rerender(content("danger:base"))

    expect(backdrop.style.background).not.toBe(primary)
  })

  it("opens as an accessible modal dialog and focuses its content", async function () {
    render(<Example />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Open settings" }))

    expect(screen.getByRole("dialog", { name: "Workspace settings" })).toBeTruthy()
    expect(screen.getByRole("textbox", { name: "Workspace name" })).toBe(document.activeElement)
    const title = screen.getByRole("heading", { name: "Workspace settings" })
    const description = screen.getByText("Change the active workspace.")
    expect(description.getAttribute("slot")).toBe("description")
    expect(title.style.fontSize).toBe("0.8125em")
    expect(description.style.fontSize).toBe("0.8125em")
    const content = screen.getByRole("dialog", { name: "Workspace settings" }).parentElement
    expect(content?.style.fontSize).toBe("")
  })

  it("closes with Escape and restores focus to its trigger", async function () {
    const user = userEvent.setup()
    render(<Example />)
    const trigger = screen.getByRole("button", { name: "Open settings" })

    await user.click(trigger)
    await user.keyboard("[Escape]")

    expect(screen.queryByRole("dialog", { name: "Workspace settings" })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("keeps the parent open when Escape closes a nested dialog", async function () {
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByRole("button", { name: "Open advanced" }))
    await user.keyboard("[Escape]")

    expect(screen.queryByRole("dialog", { name: "Advanced settings" })).toBeNull()
    expect(screen.getByRole("dialog", { name: "Workspace settings" })).toBeTruthy()
  })

  it("reports user-driven state changes and dismisses from its backdrop", async function () {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<Example onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByTestId("dialog-backdrop"))

    expect(screen.queryByRole("dialog", { name: "Workspace settings" })).toBeNull()
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("removes portalled content when its owner unmounts", async function () {
    const rendered = render(<Example />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Open settings" }))

    rendered.unmount()

    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("AlertDialog", function () {
  it("requires an explicit decision by default", async function () {
    const user = userEvent.setup()
    render(<AlertDialog>
      <AlertDialog.Trigger>Delete workspace</AlertDialog.Trigger>
      <AlertDialog.Backdrop data-testid="alert-backdrop">
        <AlertDialog.Content>
          <AlertDialog.Title>Delete permanently?</AlertDialog.Title>
          <AlertDialog.Close>Cancel</AlertDialog.Close>
          <AlertDialog.Close color="danger:base">Delete</AlertDialog.Close>
        </AlertDialog.Content>
      </AlertDialog.Backdrop>
    </AlertDialog>)

    await user.click(screen.getByRole("button", { name: "Delete workspace" }))
    expect(screen.getByRole("alertdialog", { name: "Delete permanently?" })).toBeTruthy()
    expect(materialColor(screen.getByRole("button", { name: "Cancel" }))).toBe(css(resolveColorLevel(defaultAppearance.colors.light.default, "base")))
    expect(materialColor(screen.getByRole("button", { name: "Delete" }))).toBe(css(resolveColorLevel(defaultAppearance.colors.light.danger, "base")))

    await user.keyboard("[Escape]")
    await user.click(screen.getByTestId("alert-backdrop"))
    expect(screen.getByRole("alertdialog", { name: "Delete permanently?" })).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })
})

function materialColor(element: HTMLElement) {
  return element.querySelector<HTMLElement>("[data-material-base]")?.style.background
}

function css(value: string) {
  const element = document.createElement("div")
  element.style.background = value
  return element.style.background
}
