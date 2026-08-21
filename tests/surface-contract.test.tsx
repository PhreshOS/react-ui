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
    expect(surface.firstElementChild?.textContent).toBe("Content")
  })

  it("paints the opaque material over the Theme's middle background treatment without blur", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")

    expect(surface.style.backgroundColor).toBe("rgb(245, 244, 238)")
    expect(surface.style.backgroundImage).toContain("linear-gradient")
    expect(surface.style.backgroundImage).toContain("fractalNoise")
    expect(surface.style.backgroundBlendMode).toBe("normal, overlay, multiply")
    expect(surface.style.border).toBe("1px solid rgba(15, 17, 21, 0.08)")
    expect(surface.style.color).toBe("rgb(23, 24, 28)")
    expect(surface.style.backdropFilter).toBe("")
  })

  it("uses color to select the Surface background treatment", function () {
    renderSurface(<>
      <Surface data-testid="base" />
      <Surface data-testid="strong" color="strong" />
    </>)

    expect(screen.getByTestId("base").style.backgroundColor).toBe("rgb(245, 244, 238)")
    expect(screen.getByTestId("strong").style.backgroundColor).toContain("color-mix(in oklch")
  })
})

function renderSurface(surface: ReactNode) {
  return render(<ThemeProvider theme={standardTheme}>{surface}</ThemeProvider>)
}
