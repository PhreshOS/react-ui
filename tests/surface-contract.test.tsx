import { cleanup, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { standardTheme } from "@phreshos/core"
import { Surface, ThemeProvider } from "../source/main.js"

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
    expect(surface.querySelector("canvas")).toBeNull()
  })

  it("renders only the Theme radius and foreground without enabling blur", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")

    expect(surface.style.backgroundColor).toBe("")
    expect(surface.style.backgroundImage).toBe("")
    expect(surface.style.border).toBe("")
    expect(surface.style.borderRadius).toBe("10px")
    expect(surface.style.color).toBe("rgb(24, 52, 71)")
    expect(surface.style.backdropFilter).toBe("")
  })

  it("ignores canvas color treatments", function () {
    renderSurface(<>
      <Surface data-testid="base" />
      <Surface data-testid="strong" color="strong" />
      <Surface data-testid="direct" color="#123456" />
    </>)

    expect(screen.getByTestId("base").style.backgroundColor).toBe("")
    expect(screen.getByTestId("strong").style.backgroundColor).toBe("")
    expect(screen.getByTestId("direct").style.backgroundColor).toBe("")
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
    expect(surface.style.backgroundColor).toBe("")
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

function renderSurface(surface: ReactNode) {
  return render(<ThemeProvider theme={standardTheme}>{surface}</ThemeProvider>)
}
