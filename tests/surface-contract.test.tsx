import { cleanup, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { standardAppearance } from "@phreshos/core"
import { AppearanceProvider, Surface } from "../source/main.js"

afterEach(function () {
  cleanup()
  vi.restoreAllMocks()
})

describe("Surface", function () {
  it("requires the explicit Theme that supplies its background", function () {
    expect(() => render(<Surface />)).toThrow("useAppearance() requires an AppearanceProvider")
  })

  it("preserves the complete native div contract", function () {
    const ref = createRef<HTMLDivElement>()

    renderSurface(<Surface
      ref={ref}
      data-testid="surface"
      className="custom"
      color="#123456"
      aria-label="Workspace"
      style={{ borderRadius: 18, padding: 12 }}
    >
      <span>Content</span>
    </Surface>)

    const surface = screen.getByTestId("surface")

    expect(ref.current).toBe(surface)
    expect(surface.className).toBe("custom")
    expect(surface.getAttribute("color")).toBe("#123456")
    expect(surface.getAttribute("aria-label")).toBe("Workspace")
    expect(surface.style.borderRadius).toBe("18px")
    expect(surface.style.padding).toBe("12px")
    expect(surface.querySelector("span")?.textContent).toBe("Content")
    expect(surface.querySelector("[data-surface-material]")).toBeInstanceOf(SVGSVGElement)
    expect(baseColor("surface")).toBe("#fffff5")
    expect(surface.querySelector("canvas")).toBeNull()
  })

  it("renders the grain-free standard Theme material without enabling blur", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-surface-material]"))
    const base = required(material.querySelector<SVGRectElement>("[data-surface-base]"))

    expect(surface.style.backgroundColor).toBe("")
    expect(surface.style.backgroundImage).toBe("")
    expect(surface.style.borderColor).toBe("color-mix(in oklch, rgb(255, 255, 245) 94%, black)")
    expect(surface.style.borderStyle).toBe("solid")
    expect(surface.style.borderWidth).toBe("1px")
    expect(surface.style.borderRadius).toBe("10px")
    expect(surface.style.boxSizing).toBe("border-box")
    expect(surface.style.color).toBe("rgb(24, 52, 71)")
    expect(surface.style.backdropFilter).toBe("")
    expect(surface.querySelector("[data-surface-backdrop]")).toBeNull()
    expect(surface.style.position).toBe("relative")
    expect(surface.style.isolation).toBe("isolate")
    expect(material.style.opacity).toBe("1")
    expect(material.style.boxSizing).toBe("border-box")
    expect(surface.querySelector("[data-surface-border]")).toBeNull()
    expect(base.getAttribute("fill")).toBe("#fffff5")
    expect(material.querySelector("[data-surface-grain]")).toBeNull()
    expect(material.querySelector("[data-surface-grain-tone]")).toBeNull()
    expect(material.querySelector("[data-surface-distortion]")).toBeNull()
    expect(material.querySelector("[data-surface-edge]")).toBeNull()
  })

  it("uses the top-level Theme background as its default material color", function () {
    render(<AppearanceProvider appearance={{ ...standardAppearance, background: { light: "#123456", dark: "#123456" } }} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)

    expect(baseColor("surface")).toBe("#123456")
  })

  it("accepts concrete material ranges without leaking them as div attributes", function () {
    renderSurface(<Surface
      data-testid="surface"
      grain={0.9}
      grainAmount={0.5}
      backdrop={8}
      distortion={70}
      waves={12}
      ripples={8}
      saturation={1.8}
      brightness={1.06}
      opacity={0.5}
    />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-surface-material]"))
    const grain = required(material.querySelector<SVGRectElement>("[data-surface-grain]"))
    const refraction = required(surface.querySelector<HTMLElement>("[data-surface-backdrop='refraction']"))
    const frost = required(surface.querySelector<HTMLElement>("[data-surface-backdrop='frost']"))

    expect(surface.style.backdropFilter).toBe("")
    expect(refraction.style.backdropFilter).toContain("url(")
    expect(frost.style.backdropFilter).toBe("blur(8px) saturate(1.8) brightness(1.06)")
    expect(surface.style.backgroundColor).toBe("")
    expect(grain.getAttribute("opacity")).toBeNull()
    expect(material.querySelector("[data-surface-grain-tone='0']")?.getAttribute("fill")).toBe("color-mix(in srgb, #fffff5 10%, rgb(0 0 0) 90%)")
    expect(material.querySelectorAll("[data-surface-distortion-field]")).toHaveLength(3)
    expect(material.querySelectorAll("[data-surface-distortion-stage]")).toHaveLength(1)
    expect(material.style.opacity).toBe("0.5")
    expect(surface.hasAttribute("grain")).toBe(false)
    expect(surface.hasAttribute("grainAmount")).toBe(false)
    expect(surface.hasAttribute("backdrop")).toBe(false)
    expect(surface.hasAttribute("distortion")).toBe(false)
    expect(surface.hasAttribute("waves")).toBe(false)
    expect(surface.hasAttribute("ripples")).toBe(false)
    expect(surface.hasAttribute("saturation")).toBe(false)
    expect(surface.hasAttribute("brightness")).toBe(false)
    expect(surface.hasAttribute("opacity")).toBe(false)
  })

  it("removes its backdrop properties when the resolved value returns to zero", function () {
    const rendered = renderSurface(<Surface data-testid="surface" backdrop={8} distortion={70} saturation={1.8} brightness={1.06} />)
    const surface = screen.getByTestId("surface")

    expect(surface.querySelectorAll("[data-surface-backdrop]")).toHaveLength(2)

    rendered.rerender(<AppearanceProvider appearance={standardAppearance} theme="light">
      <Surface data-testid="surface" backdrop={0} distortion={0} waves={0} ripples={0} saturation={1} brightness={1} />
    </AppearanceProvider>)

    expect(surface.querySelector("[data-surface-backdrop]")).toBeNull()
    expect(surface.querySelector("[data-surface-distortion]")).toBeNull()
  })

  it("omits grain when either grain dimension is zero", function () {
    renderSurface(<>
      <Surface data-testid="no-intensity" grain={0} grainAmount={1} />
      <Surface data-testid="no-amount" grain={1} grainAmount={0} />
    </>)

    for (const testId of ["no-intensity", "no-amount"]) {
      const material = required(screen.getByTestId(testId).querySelector<SVGSVGElement>("[data-surface-material]"))
      expect(material.querySelector("[data-surface-grain]")).toBeNull()
      expect(material.querySelector("[data-surface-grain-tone]")).toBeNull()
    }
  })

  it("renders active grain without scheduling animation frames", function () {
    const request = vi.spyOn(window, "requestAnimationFrame")

    renderSurface(<Surface data-testid="surface" grain={0.04} grainAmount={1} />)

    expect(screen.getByTestId("surface").querySelector("[data-surface-grain]")).not.toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it("omits the complete SVG material when opacity and displacement are zero", function () {
    renderSurface(<Surface data-testid="surface" opacity={0} distortion={0} waves={0} ripples={0} />)

    const surface = screen.getByTestId("surface")

    expect(surface.querySelector("[data-surface-material]")).toBeNull()
    expect(surface.style.borderColor).toBe("transparent")
  })

  it("combines only enabled distortion fields into one displacement stage", function () {
    renderSurface(<Surface data-testid="surface" distortion={0} waves={12} ripples={0} />)

    const material = required(screen.getByTestId("surface").querySelector<SVGSVGElement>("[data-surface-material]"))
    expect(material.querySelector('[data-surface-distortion-field="organic"]')).toBeNull()
    expect(material.querySelector('[data-surface-distortion-field="waves"]')).not.toBeNull()
    expect(material.querySelector('[data-surface-distortion-field="ripples"]')).toBeNull()
    expect(material.querySelectorAll('[data-surface-distortion-stage="combined"]')).toHaveLength(1)
    expect(material.querySelector("[data-surface-distortion-combine]")).toBeNull()
    expect(material.querySelector("[data-surface-distortion-noise]")).toBeNull()
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

})

function renderSurface(surface: ReactNode) {
  return render(<AppearanceProvider appearance={standardAppearance} theme="light">{surface}</AppearanceProvider>)
}

function baseColor(testId: string) {
  return required(screen.getByTestId(testId).querySelector("[data-surface-base]")).getAttribute("fill")
}

function required<T>(value: T | null): T {
  if (value === null) throw new Error("Expected Surface material test element.")
  return value
}
