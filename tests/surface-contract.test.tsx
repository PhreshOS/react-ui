import { cleanup, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { Surface } from "../source/main.js"

afterEach(cleanup)

describe("Surface", function () {
  it("preserves the complete native div contract", function () {
    const ref = createRef<HTMLDivElement>()

    render(<Surface
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

  it("paints the opaque Window Manager material without blur", function () {
    render(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")

    expect(surface.style.backgroundColor).toBe("rgb(245, 244, 238)")
    expect(surface.style.backgroundImage).toContain("linear-gradient")
    expect(surface.style.backgroundImage).toContain("fractalNoise")
    expect(surface.style.backgroundBlendMode).toBe("normal, overlay, multiply")
    expect(surface.style.border).toBe("1px solid rgba(15, 17, 21, 0.08)")
    expect(surface.style.color).toBe("rgb(23, 24, 28)")
    expect(surface.style.backdropFilter).toBe("")
  })
})
