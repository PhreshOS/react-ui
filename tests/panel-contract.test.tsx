import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { UIProvider, Panel, Surface, defaultAppearance } from "../source/main.js"
import { lifted, paintDeclarations } from "./support/paint.js"

afterEach(cleanup)

function provider(children: ReactNode, spacing = 12) {
  return <UIProvider appearance={{ ...defaultAppearance, spacing }} preferences={{ theme: "light", animations: true }}>{children}</UIProvider>
}

describe("Panel", () => {
  it("composes independently configurable root, header, and content parts", () => {
    render(provider(<>
      <Panel data-testid="panel">
        <Panel.Header data-testid="header"><h2>Title</h2></Panel.Header>
        <Panel.Content aria-label="Body"><p data-testid="content">Content</p></Panel.Content>
      </Panel>
      <Surface data-testid="reference" material="extended" />
    </>))

    const panel = screen.getByTestId("panel")
    const header = screen.getByTestId("header")
    const body = screen.getByLabelText("Body")
    const reference = screen.getByTestId("reference")
    expect(header.parentElement).toBe(panel)
    expect(header.nextElementSibling).toBe(body)
    expect(body.parentElement).toBe(panel)
    expect(screen.getByTestId("content").parentElement).toBe(body)
    expect(panel.style.display).toBe("grid")
    expect(panel.style.gridTemplateRows).toBe("auto minmax(0, 1fr)")
    // The same header row as a Window: 16px plus the 12px spacing above and below.
    expect(header.style.minHeight).toBe("40px")
    expect(header.style.paddingInline).toBe("12px")
    expect(body.style.marginRight).toBe("6px")
    expect(body.style.marginBottom).toBe("6px")
    expect(body.style.marginLeft).toBe("6px")
    expect(body.style.marginTop).toBe("0px")
    // Both rise: a frosted shell and a more solid content region of its color,
    // so recessed fields inside the content stand out from it.
    expect(lifted(paintDeclarations(panel)["box-shadow"])).toBe(true)
    expect(lifted(paintDeclarations(body)["box-shadow"])).toBe(true)
    expect(paintDeclarations(panel)["--phreshos-surface-frost"]).toContain("blur")
    expect(paintDeclarations(body)["--phreshos-surface-frost"]).toBe("none")
    expect(paintDeclarations(body)["--phreshos-surface-rim"]).toContain("linear-gradient")
    expect(paintDeclarations(body)["--phreshos-surface-grain"]).toBe(paintDeclarations(reference)["--phreshos-surface-grain"])
  })

  it("forwards the outer ref and native properties without leaking slot properties", () => {
    const ref = createRef<HTMLDivElement>()
    const click = vi.fn()
    render(provider(<Panel ref={ref} data-testid="panel" aria-label="Example" className="custom" onClick={click} style={{ width: 320 }}>
      <Panel.Header><span>Header</span></Panel.Header>
      <Panel.Content role="region" className="body" style={{ padding: 20 }}><button>Action</button></Panel.Content>
    </Panel>))
    const panel = screen.getByTestId("panel")
    expect(ref.current).toBe(panel)
    expect(panel.classList.contains("custom")).toBe(true)
    expect(panel.style.width).toBe("320px")
    expect(panel.getAttribute("aria-label")).toBe("Example")
    expect(screen.getByRole("region").classList.contains("body")).toBe(true)
    expect(screen.getByRole("region").style.padding).toBe("20px")
    fireEvent.click(screen.getByRole("button"))
    expect(click).toHaveBeenCalledOnce()
  })

  it("uses one content row and equal insets without a header, responding to Appearance changes", () => {
    const content = <Panel data-testid="panel"><Panel.Content aria-label="Body">Content</Panel.Content></Panel>
    const rendered = render(provider(content))
    expect(screen.getByTestId("panel").style.gridTemplateRows).toBe("minmax(0, 1fr)")
    expect(screen.getByLabelText("Body").style.margin).toBe("6px")
    rendered.rerender(provider(content, 18))
    expect(screen.getByLabelText("Body").style.margin).toBe("9px")
  })

  it("pads its content by the Appearance spacing as a default any class can replace", () => {
    render(provider(<Panel><Panel.Content aria-label="Body">Content</Panel.Content></Panel>))
    const body = screen.getByLabelText("Body")
    const rule = [...document.styleSheets].flatMap(sheet => [...sheet.cssRules])
      .find(rule => [...body.classList].some(name => rule.cssText.startsWith(`:where(.${name})`) && rule.cssText.includes("padding: 12px")))
    expect(rule).toBeDefined()
    expect(body.style.padding).toBe("")
  })

  it("applies material controls independently to the outer and content Surfaces", () => {
    render(provider(<Panel data-testid="panel" material={{ opacity: 0.4 }}>
      <Panel.Content material={{ opacity: 0.1 }} aria-label="Body">Content</Panel.Content>
    </Panel>))
    expect(paintDeclarations(screen.getByTestId("panel"))["--phreshos-surface-paint"]).toContain("40%")
    expect(paintDeclarations(screen.getByLabelText("Body"))["--phreshos-surface-paint"]).toContain("10%")
  })

  it("keeps the content rim above an opaque iframe without compensating padding", () => {
    render(provider(<Panel>
      <Panel.Header><span>Title</span></Panel.Header>
      <Panel.Content aria-label="Body"><iframe title="Opaque content" style={{ width: "100%", height: "100%", border: 0, background: "#123456" }} /></Panel.Content>
    </Panel>))
    const body = screen.getByLabelText("Body")
    const frame = screen.getByTitle("Opaque content")
    expect(frame.parentElement).toBe(body)
    expect(body.style.padding).toBe("")
    expect(body.style.overflow).toBe("hidden")
    // Paint sits beneath the content and the rim above it, both as pseudo-elements.
    const stylesheet = [...document.head.querySelectorAll("style")].map(sheet => sheet.textContent).join("")
    expect(stylesheet).toMatch(/\.phreshos-surface::before \{[^}]*z-index: -1/)
    expect(stylesheet).toMatch(/\.phreshos-surface::after \{[^}]*z-index: 1/)
    expect(frame.style.borderRadius).toBe("")
    expect(frame.style.backgroundColor).toBe("rgb(18, 52, 86)")
  })
})
