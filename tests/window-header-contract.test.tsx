import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { UIProvider, WindowHeader, defaultAppearance } from "../source/main.js"

afterEach(cleanup)

function provider(children: ReactNode, animations = true) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations }}>{children}</UIProvider>
}

describe("WindowHeader", () => {
  it("owns the complete three-region layout without adding a Surface", () => {
    render(provider(<WindowHeader data-testid="header">
      <WindowHeader.Identity icon="/program.svg" title="Editor" data-testid="identity" />
      <WindowHeader.Center data-testid="center"><input aria-label="Search" /></WindowHeader.Center>
      <WindowHeader.Actions data-testid="actions"><WindowHeader.Action aria-label="Pin">+</WindowHeader.Action></WindowHeader.Actions>
    </WindowHeader>))

    const header = screen.getByTestId("header")
    const identity = screen.getByTestId("identity")
    const center = screen.getByTestId("center")
    const actions = screen.getByTestId("actions")

    expect(header.style.display).toBe("flex")
    expect(header.style.height).toBe("40px")
    expect(header.style.paddingInline).toBe("12px")
    expect(header.children).toHaveLength(3)
    expect(header.querySelectorAll("[data-material]")).toHaveLength(1)
    expect([identity, center, actions].map(part => part.parentElement)).toEqual([header, header, header])
    expect(identity.querySelector("img")?.getAttribute("src")).toBe("/program.svg")
    expect(identity.textContent).toBe("Editor")
    expect(center.style.flex).toBe("1 1 auto")
    expect(actions.style.marginInlineStart).toBe("auto")
    expect(screen.getByRole("button", { name: "Pin" }).style.height).toBe("27px")
  })

  it("provides standard controls and keeps their gestures separate from header dragging", async () => {
    const onGrab = vi.fn()
    const onMaximize = vi.fn()
    const onMinimize = vi.fn()
    const onClose = vi.fn()
    const onPin = vi.fn()

    render(provider(<WindowHeader onPointerDown={onGrab} onDoubleClick={onMaximize}>
      <WindowHeader.Identity icon="/program.svg" title="Editor" data-testid="identity" />
      <WindowHeader.Actions>
        <WindowHeader.Minimize onPress={onMinimize} />
        <WindowHeader.Maximize maximized onPress={onMaximize} />
        <WindowHeader.Close onPress={onClose} />
        <WindowHeader.Action aria-label="Pin" onPress={onPin}>+</WindowHeader.Action>
      </WindowHeader.Actions>
    </WindowHeader>))

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Minimize" }))
    await user.click(screen.getByRole("button", { name: "Restore" }))
    await user.click(screen.getByRole("button", { name: "Close" }))
    await user.click(screen.getByRole("button", { name: "Pin" }))
    expect([onMinimize, onMaximize, onClose, onPin].map(callback => callback.mock.calls.length)).toEqual([1, 1, 1, 1])
    expect(onGrab).not.toHaveBeenCalled()

    fireEvent.doubleClick(screen.getByRole("button", { name: "Pin" }))
    expect(onMaximize).toHaveBeenCalledOnce()
    fireEvent.pointerDown(screen.getByTestId("identity"))
    fireEvent.doubleClick(screen.getByTestId("identity"))
    expect(onGrab).toHaveBeenCalledOnce()
    expect(onMaximize).toHaveBeenCalledTimes(2)
  })

  it("applies active treatment and animation preferences to identity only", () => {
    const content = (active: boolean) => provider(<WindowHeader active={active}>
      <WindowHeader.Identity title="Editor" data-testid="identity" />
      <WindowHeader.Actions><WindowHeader.Close disabled /></WindowHeader.Actions>
    </WindowHeader>)
    const rendered = render(content(false))
    const identity = screen.getByTestId("identity")
    const close = screen.getByRole("button", { name: "Close" })

    expect(identity.style.opacity).toBe("0.6")
    expect(identity.style.transitionDuration).toBe("120ms")
    expect(close.hasAttribute("disabled")).toBe(true)
    rendered.rerender(content(true))
    expect(identity.style.opacity).toBe("1")
    rendered.rerender(provider(<WindowHeader active={false}><WindowHeader.Identity title="Editor" data-testid="identity" /></WindowHeader>, false))
    expect(identity.style.transitionDuration).toBe("0ms")
  })
})
