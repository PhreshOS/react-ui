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
  it("reads independent shadow values and follows live theme changes", function () {
    const appearance = {
      ...standardAppearance,
      shadow: {
        light: { x: -3, y: 12, blur: 30, spread: 2, opacity: 0.25 },
        dark: { x: 2, y: 6, blur: 18, spread: -1, opacity: 0 }
      }
    }
    const view = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)
    const material = required(screen.getByTestId("surface").querySelector<SVGSVGElement>("[data-surface-material]"))
    expect(material.style.boxShadow).toContain("-3px 12px 30px 2px color-mix(in srgb, rgb(24, 52, 71) 25%, transparent)")
    view.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" />
    </AppearanceProvider>)
    expect(material.style.boxShadow).toContain("2px 6px 18px -1px color-mix(in srgb, rgb(18, 26, 33) 0%, transparent)")
    expect(material.style.boxShadow).toContain("inset 0 1px 2px")
  })

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
    expect(baseColor("surface")).toBe("rgb(255, 255, 255)")
    expect(surface.querySelector("canvas")).toBeNull()
  })

  it("renders the translucent grain-free standard Theme material with frost", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-surface-material]"))
    const base = required(material.querySelector<SVGRectElement>("[data-surface-base]"))

    expect(surface.style.backgroundColor).toBe("")
    expect(surface.style.backgroundImage).toBe("")
    expect(surface.style.borderColor).toBe("")
    expect(surface.style.borderStyle).toBe("")
    expect(surface.style.borderWidth).toBe("")
    expect(surface.style.borderRadius).toBe("10px")
    expect(surface.style.boxSizing).toBe("")
    expect(surface.style.color).toBe("rgb(24, 52, 71)")
    expect(surface.style.backdropFilter).toBe("")
    expect(surface.querySelector<HTMLElement>("[data-surface-backdrop='frost']")?.style.backdropFilter).toBe("blur(12px)")
    expect(surface.style.position).toBe("relative")
    expect(surface.style.isolation).toBe("isolate")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-border]"))
    expect(material.style.border).toBe("")
    expect(material.style.boxShadow).toBe("inset 0 1px 2px color-mix(in srgb, rgb(255, 255, 255) 28%, transparent), 0px 8px 24px 0px color-mix(in srgb, rgb(24, 52, 71) 16%, transparent)")
    expect(border.parentElement).toBe(surface)
    expect(border.childElementCount).toBe(0)
    expect(border.style.padding).toBe("1px")
    expect(border.style.borderRadius).toBe("inherit")
    expect(border.style.pointerEvents).toBe("none")
    expect(material.style.zIndex).toBe("-1")
    expect(border.style.zIndex).toBe("1")
    expect(border.style.maskComposite).toBe("exclude")
    expect(Number(border.style.opacity)).toBeCloseTo(0.4)
    expect(border.style.background).toContain("linear-gradient(145deg,")
    expect(material.querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.2")
    expect(base.style.fill).toBe("rgb(255, 255, 255)")
    expect(material.querySelector("[data-surface-grain]")).toBeNull()
    expect(material.querySelector("[data-surface-grain-tone]")).toBeNull()
    expect(material.querySelector("[data-surface-distortion]")).toBeNull()
    expect(material.querySelector("[data-surface-edge]")).toBeNull()
  })

  it("uses the medium Appearance radius for its geometry and paint", function () {
    render(<AppearanceProvider appearance={{ ...standardAppearance, radius: { light: 14 } }} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)

    const surface = screen.getByTestId("surface")
    expect(surface.style.borderRadius).toBe("14px")
    expect(surface.querySelector<SVGSVGElement>("[data-surface-material]")?.style.borderRadius).toBe("inherit")
    expect(surface.querySelector<HTMLElement>("[data-surface-border]")?.style.borderRadius).toBe("inherit")
  })

  it("uses the top-level Theme background as its default material color", function () {
    render(<AppearanceProvider appearance={{ ...standardAppearance, background: { light: "#123456", dark: "#123456" } }} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)

    expect(baseColor("surface")).toBe("rgb(18, 52, 86)")
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
    expect(material.querySelector("[data-surface-grain-tone='0']")?.getAttribute("fill")).toBe("color-mix(in srgb, #ffffff 10%, rgb(0 0 0) 90%)")
    expect(material.querySelectorAll("[data-surface-distortion-field]")).toHaveLength(3)
    expect(material.querySelectorAll("[data-surface-distortion-stage]")).toHaveLength(1)
    expect(material.style.opacity).toBe("")
    expect(material.querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.5")
    expect(surface.querySelector<HTMLElement>("[data-surface-border]")?.style.opacity).toBe("1")
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
    expect(surface.querySelector("[data-surface-border]")).toBeNull()
    expect(surface.style.borderColor).toBe("")
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

  it("derives the rim and shadow colors from the current palette", function () {
    const appearance = {
      ...standardAppearance,
      background: { light: "#ffeecc", dark: "#112233" },
      foreground: { light: "#443322", dark: "#ccddee" }
    }
    const rendered = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" opacity={0.5} />
    </AppearanceProvider>)
    const border = required(screen.getByTestId("surface").querySelector<HTMLElement>("[data-surface-border]"))
    const material = required(screen.getByTestId("surface").querySelector<SVGSVGElement>("[data-surface-material]"))
    const light = border.style.background
    const lightOpacity = Number(border.style.opacity)

    expect(light).toContain("rgb(255, 238, 204)")
    expect(light).toContain("rgb(68, 51, 34)")
    expect(light).not.toMatch(/\b(white|black)\b/)
    expect(material.style.boxShadow).toBe("inset 0 1px 2px color-mix(in srgb, rgb(255, 238, 204) 28%, transparent), 0px 8px 24px 0px color-mix(in srgb, rgb(68, 51, 34) 16%, transparent)")

    rendered.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" opacity={0.5} />
    </AppearanceProvider>)

    expect(border.style.background).toContain("rgb(17, 34, 51)")
    expect(border.style.background).toContain("rgb(204, 221, 238)")
    expect(border.style.background).not.toBe(light)
    expect(Number(border.style.opacity)).toBeLessThan(lightOpacity)
    expect(material.style.boxShadow).toBe("inset 0 1px 2px color-mix(in srgb, rgb(204, 221, 238) 28%, transparent), 0px 8px 24px 0px color-mix(in srgb, rgb(17, 34, 51) 16%, transparent)")
  })

  it("keeps lighting colors identical but follows background lightness when palette roles are reversed", function () {
    const appearance = {
      ...standardAppearance,
      background: { light: "#112233", dark: "#ffeecc" },
      foreground: { light: "#ffeecc", dark: "#112233" }
    }
    const rendered = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" opacity={0.5} />
    </AppearanceProvider>)
    const surface = screen.getByTestId("surface")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-border]"))
    const material = required(surface.querySelector<SVGSVGElement>("[data-surface-material]"))
    const gradient = border.style.background
    const shadow = material.style.boxShadow
    const darkOpacity = Number(border.style.opacity)
    expect(gradient).toMatch(/^linear-gradient\(145deg, color-mix\(in srgb, rgb\(255, 238, 204\)/)

    rendered.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" opacity={0.5} />
    </AppearanceProvider>)

    expect(border.style.background).toBe(gradient)
    expect(material.style.boxShadow).toBe(shadow)
    expect(Number(border.style.opacity)).toBeGreaterThan(darkOpacity)
  })

  it("compares CSS expressions after resolving them in the Surface's scope", function () {
    render(<AppearanceProvider appearance={{
      ...standardAppearance,
      background: { light: "color-mix(in srgb, #ffffff 80%, #000000)", dark: "#000000" },
      foreground: { light: "rgb(20 30 40)", dark: "#ffffff" }
    }} theme="light"><Surface data-testid="surface" /></AppearanceProvider>)
    const material = required(screen.getByTestId("surface").querySelector<SVGSVGElement>("[data-surface-material]"))
    expect(material.style.boxShadow).toContain("color(srgb 0.8 0.8 0.8) 28%")
    expect(material.style.boxShadow).toContain("rgb(20, 30, 40) 16%")
  })

  it.each(["light", "dark"] as const)("scales the %s rim by background lightness after capping xlarge opacity", function (theme) {
    const appearance = { ...standardAppearance, background: { light: "oklch(50% 0 0)", dark: "oklch(50% 0 0)" } }
    const rendered = render(<AppearanceProvider appearance={appearance} theme={theme}>
      <Surface data-testid="surface" opacity={0.1} />
    </AppearanceProvider>)
    const surface = screen.getByTestId("surface")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-border]"))
    expect(Number(border.style.opacity)).toBeCloseTo(0.1)

    rendered.rerender(<AppearanceProvider appearance={appearance} theme={theme}>
      <Surface data-testid="surface" opacity={0.8} />
    </AppearanceProvider>)

    expect(Number(border.style.opacity)).toBeCloseTo(0.5)
    expect(surface.querySelector("[data-surface-paint]")?.getAttribute("opacity")).toBe("0.8")
  })

  it.each([0, 0.25, 0.5, 0.75, 1])("derives rim opacity from background lightness %s", function (lightness) {
    render(<AppearanceProvider appearance={{
      ...standardAppearance,
      background: { light: `oklch(${lightness} 0 0)`, dark: `oklch(${lightness} 0 0)` }
    }} theme="light"><Surface data-testid="surface" opacity={0.2} /></AppearanceProvider>)

    const border = required(screen.getByTestId("surface").querySelector<HTMLElement>("[data-surface-border]"))
    expect(Number(border.style.opacity)).toBeCloseTo(0.4 * lightness)
  })

  it("removes the rim at zero opacity while keeping active refraction", function () {
    const rendered = renderSurface(<Surface data-testid="surface" distortion={20} />)
    const surface = screen.getByTestId("surface")

    rendered.rerender(<AppearanceProvider appearance={standardAppearance} theme="light">
      <Surface data-testid="surface" distortion={20} opacity={0} />
    </AppearanceProvider>)

    expect(surface.querySelector("[data-surface-border]")).toBeNull()
    expect(surface.querySelector("[data-surface-distortion]")).not.toBeNull()
    expect(surface.querySelector<SVGSVGElement>("[data-surface-material]")?.style.boxShadow).toBe("")
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
  return required(screen.getByTestId(testId).querySelector<SVGRectElement>("[data-surface-base]")).style.fill
}

function required<T>(value: T | null): T {
  if (value === null) throw new Error("Expected Surface material test element.")
  return value
}
