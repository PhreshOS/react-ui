import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { UIProvider, Surface, Window, defaultAppearance } from "../source/main.js"
import { surfaceFill } from "./support/paint.js"

afterEach(cleanup)

function provider(children: ReactNode, animations = true) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations }}>{children}</UIProvider>
}

describe("Window", () => {
  it("provides one Surface with a ready header-and-content layout", () => {
    const root = createRef<HTMLDivElement>()
    const content = createRef<HTMLDivElement>()

    render(provider(<Window ref={root} data-testid="window">
      <Window.Header data-testid="header">
        <Window.Header.Identity icon="/program.svg" title="Editor" data-testid="identity" />
        <Window.Header.Center data-testid="center"><input aria-label="Search" /></Window.Header.Center>
        <Window.Header.Actions data-testid="actions"><Window.Header.Action aria-label="Pin">+</Window.Header.Action></Window.Header.Actions>
      </Window.Header>
      <Window.Content ref={content} data-testid="content">Content</Window.Content>
    </Window>))

    const window = screen.getByTestId("window")
    const header = screen.getByTestId("header")
    const identity = screen.getByTestId("identity")
    const center = screen.getByTestId("center")
    const actions = screen.getByTestId("actions")

    expect(root.current).toBe(window)
    expect(window.classList.contains("phreshos-surface")).toBe(true)
    expect(window.children).toHaveLength(2)
    expect(window.style.display).toBe("flex")
    expect(window.style.flexDirection).toBe("column")
    expect(window.style.minWidth).toBe("0px")
    expect(window.style.minHeight).toBe("0px")
    expect([header, content.current].map(part => part?.parentElement)).toEqual([window, window])
    expect(header.style.height).toBe("40px")
    expect(header.style.paddingInline).toBe("12px")
    expect([identity, center, actions].map(part => part.parentElement)).toEqual([header, header, header])
    expect(identity.querySelector("img")?.getAttribute("src")).toBe("/program.svg")
    expect(identity.textContent).toBe("Editor")
    expect(center.style.flex).toBe("1 1 auto")
    expect(actions.style.marginInlineStart).toBe("auto")
    expect(screen.getByRole("button", { name: "Pin" }).style.height).toBe("25px")
    expect(content.current).toBe(screen.getByTestId("content"))
    expect(content.current?.style.flex).toBe("1 1 auto")
    expect(content.current?.style.minWidth).toBe("0px")
    expect(content.current?.style.minHeight).toBe("0px")
    expect(content.current?.style.overflow).toBe("")
  })

  it("allows the header to compose independently inside any Surface", () => {
    render(provider(<Surface data-testid="surface">
      <Window.Header data-testid="header">
        <Window.Header.Identity title="Independent" />
      </Window.Header>
    </Surface>))

    expect(screen.getByTestId("header").parentElement).toBe(screen.getByTestId("surface"))
    expect(screen.getByText("Independent")).not.toBeNull()
  })

  it("provides standard controls and keeps their gestures separate from header dragging", async () => {
    const onGrab = vi.fn()
    const onMaximize = vi.fn()
    const onMinimize = vi.fn()
    const onClose = vi.fn()
    const onPin = vi.fn()

    render(provider(<Window.Header maximized onPointerDown={onGrab} onMaximize={onMaximize}>
      <Window.Header.Identity icon="/program.svg" title="Editor" data-testid="identity" />
      <Window.Header.Actions>
        <Window.Header.Minimize onPress={onMinimize} />
        <Window.Header.Maximize />
        <Window.Header.Close onPress={onClose} />
        <Window.Header.Action aria-label="Pin" onPress={onPin}>+</Window.Header.Action>
      </Window.Header.Actions>
    </Window.Header>))

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

  it("owns one drag-intent cursor before and after a move handoff", () => {
    const beginMoveGesture = vi.fn()
    render(provider(<>
      <Window.Header beginMoveGesture={beginMoveGesture} data-testid="header" />
      <Window.MoveCapture data-testid="capture" />
    </>))

    expect(screen.getByTestId("header").style.cursor).toBe("grab")
    expect(screen.getByTestId("capture").style.cursor).toBe("grab")
  })

  it("uses danger as the overridable semantic default for Window Close", () => {
    render(provider(<Window.Header>
      <Window.Header.Actions><Window.Header.Close /></Window.Header.Actions>
    </Window.Header>))

    expect(surfaceFill(screen.getByRole("button", { name: "Close" }))).toBe(defaultAppearance.colors.light.danger)
  })

  it("applies active treatment and animation preferences to identity only", () => {
    const content = (active: boolean) => provider(<Window.Header active={active}>
      <Window.Header.Identity title="Editor" data-testid="identity" />
      <Window.Header.Actions><Window.Header.Close disabled /></Window.Header.Actions>
    </Window.Header>)
    const rendered = render(content(false))
    const identity = screen.getByTestId("identity")
    const close = screen.getByRole("button", { name: "Close" })

    expect(identity.style.opacity).toBe("0.6")
    expect(identity.style.transitionDuration).toBe(`${defaultAppearance.transaction.duration}ms`)
    expect(close.hasAttribute("disabled")).toBe(true)
    rendered.rerender(content(true))
    expect(identity.style.opacity).toBe("1")
    rendered.rerender(provider(<Window.Header active={false}><Window.Header.Identity title="Editor" data-testid="identity" /></Window.Header>, false))
    expect(identity.style.transitionDuration).toBe("0ms")
  })

  it("lets the header and its action controls own their base colors", () => {
    const content = (header: "primary" | "secondary", close: "danger" | "success") => provider(
      <Window.Header color={header} data-testid="header">
        <Window.Header.Identity title="Editor" />
        <Window.Header.Actions><Window.Header.Close color={close} /></Window.Header.Actions>
      </Window.Header>
    )
    const rendered = render(content("primary", "danger"))
    const header = screen.getByTestId("header")
    const close = screen.getByRole("button", { name: "Close" })
    const headerColor = header.style.color
    const closeColor = surfaceFill(close)

    rendered.rerender(content("secondary", "success"))

    expect(header.style.color).not.toBe(headerColor)
    expect(surfaceFill(close)).not.toBe(closeColor)
  })
})
