import { cleanup, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { standardTheme } from "@phreshos/core"
import { Surface, ThemeProvider } from "../source/main.js"

afterEach(function () {
  cleanup()
  vi.restoreAllMocks()
})

describe("Surface", function () {
  it("requires the explicit Theme that supplies its background", function () {
    expect(() => render(<Surface />)).toThrow("useTheme() requires a ThemeProvider")
  })

  it("preserves the complete native div contract", function () {
    const ref = createRef<HTMLDivElement>()

    renderSurface(<Surface
      ref={ref}
      data-testid="surface"
      className="custom"
      aria-label="Workspace"
      style={{ borderRadius: 18, padding: 12 }}
    >
      <span>Content</span>
    </Surface>)

    const surface = screen.getByTestId("surface")

    expect(ref.current).toBe(surface)
    expect(surface.className).toBe("custom")
    expect(surface.getAttribute("aria-label")).toBe("Workspace")
    expect(surface.style.borderRadius).toBe("18px")
    expect(surface.style.padding).toBe("12px")
    expect(surface.querySelector("span")?.textContent).toBe("Content")
    expect(surface.querySelector("[data-surface-material]")).toBeInstanceOf(SVGSVGElement)
    expect(surface.querySelector("canvas")).toBeNull()
  })

  it("renders the complete Theme material without enabling blur", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-surface-material]"))
    const base = required(material.querySelector<SVGRectElement>("[data-surface-base]"))
    const grain = required(material.querySelector<SVGRectElement>("[data-surface-grain]"))

    expect(surface.style.backgroundColor).toBe("")
    expect(surface.style.backgroundImage).toBe("")
    expect(surface.style.border).toBe("")
    expect(surface.style.borderRadius).toBe("10px")
    expect(surface.style.color).toBe("rgb(24, 52, 71)")
    expect(surface.style.backdropFilter).toBe("")
    expect(surface.style.position).toBe("relative")
    expect(surface.style.isolation).toBe("isolate")
    expect(material.style.opacity).toBe("1")
    expect(material.style.border).toBe("1px solid rgba(15, 17, 21, 0.08)")
    expect(material.style.boxSizing).toBe("border-box")
    expect(base.getAttribute("fill")).toBe("#f5f4ee")
    expect(grain.getAttribute("opacity")).toBe("0.04")
    expect(material.querySelectorAll("[data-surface-grain-tone]")).toHaveLength(16)
    expect(material.querySelector("[data-surface-edge]")).toBeNull()
  })

  it("resolves Theme color treatments and direct colors into each local material", function () {
    renderSurface(<>
      <Surface data-testid="base" />
      <Surface data-testid="strong" color="strong" />
      <Surface data-testid="direct" color="#123456" />
    </>)

    expect(baseColor("base")).toBe("#f5f4ee")
    expect(baseColor("strong")).toBe("color-mix(in oklch, #f5f4ee 82%, black)")
    expect(baseColor("direct")).toBe("#123456")
  })

  it("uses the top-level Theme background as its default material color", function () {
    render(<ThemeProvider theme={{ ...standardTheme, background: "#123456" }}>
      <Surface data-testid="surface" />
    </ThemeProvider>)

    expect(baseColor("surface")).toBe("#123456")
  })

  it("accepts concrete material ranges without leaking them as div attributes", function () {
    renderSurface(<Surface
      data-testid="surface"
      grain={0.9}
      animation={12}
      backdrop={8}
      opacity={0.5}
    />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-surface-material]"))
    const grain = required(material.querySelector<SVGRectElement>("[data-surface-grain]"))

    expect(surface.style.backdropFilter).toBe("blur(8px)")
    expect(surface.style.backgroundColor).toBe("")
    expect(grain.getAttribute("opacity")).toBe("0.9")
    expect(material.style.opacity).toBe("0.5")
    expect(surface.hasAttribute("grain")).toBe(false)
    expect(surface.hasAttribute("animation")).toBe(false)
    expect(surface.hasAttribute("backdrop")).toBe(false)
    expect(surface.hasAttribute("opacity")).toBe(false)
  })

  it("removes its backdrop properties when the resolved value returns to zero", function () {
    const rendered = renderSurface(<Surface data-testid="surface" backdrop={8} />)
    const surface = screen.getByTestId("surface")

    expect(surface.style.backdropFilter).toBe("blur(8px)")

    rendered.rerender(<ThemeProvider theme={standardTheme}>
      <Surface data-testid="surface" backdrop={0} />
    </ThemeProvider>)

    expect(surface.style.backdropFilter).toBe("")
    expect(surface.style.getPropertyValue("-webkit-backdrop-filter")).toBe("")
  })

  it("keeps caller-provided position and native backdrop styles authoritative", function () {
    renderSurface(<Surface
      data-testid="surface"
      backdrop={0}
      style={{ position: "absolute", isolation: "auto", backdropFilter: "saturate(2)" }}
    />)

    const surface = screen.getByTestId("surface")

    expect(surface.style.position).toBe("absolute")
    expect(surface.style.isolation).toBe("isolate")
    expect(surface.style.backdropFilter).toBe("saturate(2)")
  })

  it("animates only the Surface that explicitly enables animation", function () {
    let frame: FrameRequestCallback | undefined
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
      frame = callback
      return 1
    })
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined)

    renderSurface(<>
      <Surface data-testid="animated" animation={4} />
      <Surface data-testid="static" animation={0} />
    </>)

    const animated = grainPath("animated")
    const staticPath = grainPath("static")
    const animatedStart = animated.getAttribute("d")
    const staticStart = staticPath.getAttribute("d")

    frame?.(1000)

    expect(animated.getAttribute("d")).not.toBe(animatedStart)
    expect(staticPath.getAttribute("d")).toBe(staticStart)
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2)
  })
})

function renderSurface(surface: ReactNode) {
  return render(<ThemeProvider theme={standardTheme}>{surface}</ThemeProvider>)
}

function baseColor(testId: string) {
  return required(screen.getByTestId(testId).querySelector("[data-surface-base]")).getAttribute("fill")
}

function grainPath(testId: string) {
  return required(screen.getByTestId(testId).querySelector<SVGPathElement>("[data-surface-grain-tone]"))
}

function required<T>(value: T | null): T {
  if (value === null) throw new Error("Expected Surface material test element.")
  return value
}
