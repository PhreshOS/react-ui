import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading,
  Modal,
  ModalOverlay
} from "react-aria-components"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ComponentType } from "react"

type DialogProperties = Readonly<{
  onOpenChange?(open: boolean): void
}>

const candidates: readonly [string, ComponentType<DialogProperties>][] = [
  ["React Aria", ReactAriaDialog],
  ["Base UI", BaseUiDialog]
]

afterEach(cleanup)

describe.each(candidates)("%s Dialog", function (_name, Candidate) {
  it("opens as an accessible modal dialog", async function () {
    render(<Candidate />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Open settings" }))

    expect(screen.getByRole("dialog", { name: "Workspace settings" })).toBeTruthy()
    expect(screen.getByRole("textbox", { name: "Workspace name" })).toBe(document.activeElement)
  })

  it("closes with Escape and restores focus to its trigger", async function () {
    const user = userEvent.setup()

    render(<Candidate />)

    const trigger = screen.getByRole("button", { name: "Open settings" })

    await user.click(trigger)
    await user.keyboard("[Escape]")

    expect(screen.queryByRole("dialog", { name: "Workspace settings" })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("keeps the parent open when Escape closes a nested dialog", async function () {
    const user = userEvent.setup()

    render(<Candidate />)

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByRole("button", { name: "Open advanced" }))

    expect(screen.getByRole("dialog", { name: "Advanced settings" })).toBeTruthy()

    await user.keyboard("[Escape]")

    expect(screen.queryByRole("dialog", { name: "Advanced settings" })).toBeNull()
    expect(screen.getByRole("dialog", { name: "Workspace settings" })).toBeTruthy()
  })

  it("reports user-driven open-state changes", async function () {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(<Candidate onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByRole("button", { name: "Close settings" }))

    expect(onOpenChange).toHaveBeenNthCalledWith(1, true)
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false)
  })

  it("dismisses when its backdrop is pressed", async function () {
    const user = userEvent.setup()

    render(<Candidate />)

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByTestId("dialog-backdrop"))

    expect(screen.queryByRole("dialog", { name: "Workspace settings" })).toBeNull()
  })

  it("removes its portalled content when its owner unmounts", async function () {
    const rendered = render(<Candidate />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Open settings" }))

    rendered.unmount()

    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

function ReactAriaDialog({ onOpenChange }: DialogProperties) {
  return <AriaDialogTrigger onOpenChange={onOpenChange}>
    <AriaButton>Open settings</AriaButton>
    <ModalOverlay data-testid="dialog-backdrop" isDismissable>
      <Modal>
        <AriaDialog>
          {({ close }) => <>
            <Heading slot="title">Workspace settings</Heading>
            <label>Workspace name <input autoFocus /></label>
            <AriaDialogTrigger>
              <AriaButton>Open advanced</AriaButton>
              <ModalOverlay isDismissable>
                <Modal>
                  <AriaDialog>
                    <Heading slot="title">Advanced settings</Heading>
                    <AriaButton slot="close">Close advanced</AriaButton>
                  </AriaDialog>
                </Modal>
              </ModalOverlay>
            </AriaDialogTrigger>
            <AriaButton onPress={close}>Close settings</AriaButton>
          </>}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  </AriaDialogTrigger>
}

function BaseUiDialog({ onOpenChange }: DialogProperties) {
  return <BaseDialog.Root onOpenChange={open => onOpenChange?.(open)}>
    <BaseDialog.Trigger>Open settings</BaseDialog.Trigger>
    <BaseDialog.Portal>
      <BaseDialog.Backdrop data-testid="dialog-backdrop" />
      <BaseDialog.Viewport>
        <BaseDialog.Popup>
          <BaseDialog.Title>Workspace settings</BaseDialog.Title>
          <label>Workspace name <input autoFocus /></label>
          <BaseDialog.Root>
            <BaseDialog.Trigger>Open advanced</BaseDialog.Trigger>
            <BaseDialog.Portal>
              <BaseDialog.Backdrop />
              <BaseDialog.Viewport>
                <BaseDialog.Popup>
                  <BaseDialog.Title>Advanced settings</BaseDialog.Title>
                  <BaseDialog.Close>Close advanced</BaseDialog.Close>
                </BaseDialog.Popup>
              </BaseDialog.Viewport>
            </BaseDialog.Portal>
          </BaseDialog.Root>
          <BaseDialog.Close>Close settings</BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  </BaseDialog.Root>
}
