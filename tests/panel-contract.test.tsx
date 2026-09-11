import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultAppearance } from "@phreshos/core"
import { AppearanceProvider, Panel, Surface } from "../source/main.js"

afterEach(cleanup)

function provider(children: ReactNode, spacing = 12) {
  return <AppearanceProvider appearance={{ ...defaultAppearance, spacing: { light: spacing } }} theme="light">{children}</AppearanceProvider>
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
    expect(panel.querySelectorAll("[data-material-paint]")).toHaveLength(2)
    expect(panel.style.gridTemplateRows).toBe("auto minmax(0, 1fr)")
    expect(body.style.margin).toBe("0px 6px 6px")
    for (const surface of [panel, body]) {
      expect(surface.style.borderRadius).toBe(reference.style.borderRadius)
      expect(surface.querySelector("[data-surface-edge]")?.getAttribute("style")).toBe(reference.querySelector("[data-surface-edge]")?.getAttribute("style"))
      expect(surface.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.2")
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
    render(provider(<Panel data-testid="panel" material={{ opacity: 0.4 }} contentProps={{ material: { opacity: 0.1 }, "aria-label": "Body" }}>Content</Panel>))
    expect(screen.getByTestId("panel").querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.4")
    expect(screen.getByLabelText("Body").querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.1")
  })

  it("keeps the content rim above an opaque iframe without compensating padding", () => {
    render(provider(<Panel header={<span>Title</span>} contentProps={{ "aria-label": "Body" }}>
      <iframe title="Opaque content" style={{ width: "100%", height: "100%", border: 0, background: "#123456" }} />
    </Panel>))
    const body = screen.getByLabelText("Body")
    const frame = screen.getByTitle("Opaque content")
    const material = body.querySelector<SVGSVGElement>("[data-material-paint]")!
    const rim = body.querySelector<HTMLElement>("[data-surface-edge]")!
    expect(frame.parentElement).toBe(body)
    expect(body.style.padding).toBe("")
    expect(body.style.overflow).toBe("hidden")
    expect(material.style.zIndex).toBe("-1")
    expect(rim.style.zIndex).toBe("1")
    expect(rim.style.borderRadius).toBe("inherit")
    expect(rim.style.pointerEvents).toBe("none")
    expect(frame.style.borderRadius).toBe("")
    expect(frame.style.backgroundColor).toBe("rgb(18, 52, 86)")
  })
})
