import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { standardAppearance } from "@phreshos/core"
import { AppearanceProvider, Panel, Surface } from "../source/main.js"

afterEach(cleanup)

function provider(children: ReactNode, spacing = 12) {
  return <AppearanceProvider appearance={{ ...standardAppearance, spacing: { light: spacing } }} theme="light">{children}</AppearanceProvider>
}

describe("Panel", () => {
  it("composes exactly two default Surfaces with the header before the body", () => {
    render(provider(<>
      <Panel data-testid="panel" header={<h2 data-testid="header">Title</h2>} contentProps={{ "aria-label": "Body" }}>
        <p data-testid="content">Content</p>
      </Panel>
      <Surface data-testid="reference" />
    </>))

    const panel = screen.getByTestId("panel")
    const header = screen.getByTestId("header")
    const body = screen.getByLabelText("Body")
    const reference = screen.getByTestId("reference")
    expect(header.parentElement).toBe(panel)
    expect(header.nextElementSibling).toBe(body)
    expect(body.parentElement).toBe(panel)
    expect(screen.getByTestId("content").parentElement).toBe(body)
    expect(panel.querySelectorAll("[data-surface-material]")).toHaveLength(2)
    expect(panel.style.gridTemplateRows).toBe("auto minmax(0, 1fr)")
    expect(body.style.margin).toBe("0px 6px 6px")
    for (const surface of [panel, body]) {
      expect(surface.style.borderRadius).toBe(reference.style.borderRadius)
      expect(surface.querySelector("[data-surface-border]")?.getAttribute("style")).toBe(reference.querySelector("[data-surface-border]")?.getAttribute("style"))
      expect(surface.querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.2")
    }
  })

  it("forwards the outer ref and native properties without leaking slot properties", () => {
    const ref = createRef<HTMLDivElement>()
    const click = vi.fn()
    render(provider(<Panel ref={ref} data-testid="panel" aria-label="Example" className="custom" onClick={click}
      header={<span>Header</span>} style={{ width: 320 }} contentProps={{ role: "region", className: "body", style: { padding: 20 } }}>
      <button>Action</button>
    </Panel>))
    const panel = screen.getByTestId("panel")
    expect(ref.current).toBe(panel)
    expect(panel.className).toBe("custom")
    expect(panel.style.width).toBe("320px")
    expect(panel.getAttribute("aria-label")).toBe("Example")
    expect(panel.hasAttribute("header")).toBe(false)
    expect(panel.hasAttribute("contentProps")).toBe(false)
    expect(screen.getByRole("region").className).toBe("body")
    expect(screen.getByRole("region").style.padding).toBe("20px")
    fireEvent.click(screen.getByRole("button"))
    expect(click).toHaveBeenCalledOnce()
  })

  it("uses one content row and equal insets without a header, responding to Appearance changes", () => {
    const content = <Panel data-testid="panel" contentProps={{ "aria-label": "Body" }}>Content</Panel>
    const rendered = render(provider(content))
    expect(screen.getByTestId("panel").style.gridTemplateRows).toBe("minmax(0, 1fr)")
    expect(screen.getByLabelText("Body").style.margin).toBe("6px")
    rendered.rerender(provider(content, 18))
    expect(screen.getByLabelText("Body").style.margin).toBe("9px")
  })

  it("applies material controls independently to the outer and content Surfaces", () => {
    render(provider(<Panel data-testid="panel" opacity={0.4} contentProps={{ opacity: 0.1, "aria-label": "Body" }}>Content</Panel>))
    expect(screen.getByTestId("panel").querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.4")
    expect(screen.getByLabelText("Body").querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.1")
  })
})
