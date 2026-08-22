import { cleanup, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { standardTheme } from "@phreshos/core"
import { Surface, ThemeProvider } from "../source/main.js"
import { prepareSurfaceLayout } from "../source/surface-renderer.js"

afterEach(cleanup)

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
    expect(surface.querySelector("canvas[data-surface-material]")).not.toBeNull()
  })

  it("uses the Theme Surface defaults as its non-WebGL fallback without enabling blur", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")

    expect(surface.style.backgroundColor).toBe("rgb(245, 244, 238)")
    expect(surface.style.backgroundImage).toBe("")
    expect(surface.style.border).toBe("1px solid rgba(15, 17, 21, 0.08)")
    expect(surface.style.borderRadius).toBe("10px")
    expect(surface.style.color).toBe("rgb(24, 52, 71)")
    expect(surface.style.backdropFilter).toBe("")
  })

  it("uses color to select the Surface background treatment", function () {
    renderSurface(<>
      <Surface data-testid="base" />
      <Surface data-testid="strong" color="strong" />
      <Surface data-testid="direct" color="#123456" />
    </>)

    expect(screen.getByTestId("base").style.backgroundColor).toBe("rgb(245, 244, 238)")
    expect(screen.getByTestId("strong").style.backgroundColor).toContain("color-mix(in oklch")
    expect(screen.getByTestId("direct").style.backgroundColor).toBe("rgb(18, 52, 86)")
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

    expect(surface.style.backdropFilter).toBe("blur(8px)")
    expect(surface.style.backgroundColor).toContain("color-mix(in srgb")
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
})

describe("Surface material layout", function () {
  it("does not replace an existing positioning owner", function () {
    const surface = document.createElement("div")
    surface.style.position = "absolute"

    const restore = prepareSurfaceLayout(surface)

    expect(surface.style.position).toBe("absolute")
    expect(surface.style.isolation).toBe("isolate")

    restore()

    expect(surface.style.position).toBe("absolute")
    expect(surface.style.isolation).toBe("")
  })

  it("creates and restores a containing block only for a static Surface", function () {
    const surface = document.createElement("div")

    const restore = prepareSurfaceLayout(surface)

    expect(surface.style.position).toBe("relative")
    expect(surface.style.isolation).toBe("isolate")

    restore()

    expect(surface.style.position).toBe("")
    expect(surface.style.isolation).toBe("")
  })
})

function renderSurface(surface: ReactNode) {
  return render(<ThemeProvider theme={standardTheme}>{surface}</ThemeProvider>)
}
