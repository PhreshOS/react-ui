import { cleanup, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultAppearance } from "@phreshos/core"
import { AppearanceProvider, Surface } from "../source/main.js"
import { color as colorScale, type ColorLevel } from "../source/color.js"

afterEach(function () {
  cleanup()
  vi.restoreAllMocks()
})

describe("Surface", function () {
  it.each<ColorLevel>(["subtle", "soft", "base", "strong", "intense"])("derives the %s background level from the active Appearance", function (level) {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#abcdef" },
        dark: { ...defaultAppearance.colors.dark, background: "#123456" }
      }
    }
    const view = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" color={`background:${level}`} />
    </AppearanceProvider>)
    const base = required(screen.getByTestId("surface").querySelector<SVGRectElement>("[data-material-base]"))
    expect(base.style.fill).toBe(cssFill(colorScale(appearance.colors.light.background)[level]))
    view.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" color={`background:${level}`} />
    </AppearanceProvider>)
    expect(base.style.fill).toBe(cssFill(colorScale(appearance.colors.dark.background)[level]))
    expect(screen.getByTestId("surface").hasAttribute("color")).toBe(false)
  })

  it.each(["#8b5cf6", "rgb(20 80 120)", "color-mix(in srgb, #ffffff 80%, #000000)"])("accepts the direct background color %s", function (color) {
    renderSurface(<Surface data-testid="surface" color={color} />)
    const base = required(screen.getByTestId("surface").querySelector<SVGRectElement>("[data-material-base]"))
    expect(base.style.fill).toBe(cssFill(color))
  })

  it.each([
    ["xsmall", "2.5px"], ["small", "5px"], ["medium", "10px"], ["large", "15px"], ["xlarge", "20px"],
    [0, "0px"], [18, "18px"], ["50%", "50%"], ["1rem 2rem", "1rem 2rem"]
  ] as const)("accepts radius %s without forwarding it to the DOM", function (radius, expected) {
    renderSurface(<Surface data-testid="surface" radius={radius} />)
    const surface = screen.getByTestId("surface")
    expect(surface.style.borderRadius).toBe(expected)
    expect(surface.hasAttribute("radius")).toBe(false)
  })

  it("derives radius levels from the shared Appearance value across theme changes", function () {
    const appearance = { ...defaultAppearance, radius: 8 }
    const view = render(<AppearanceProvider appearance={appearance} theme="light"><Surface data-testid="surface" radius="large" /></AppearanceProvider>)
    expect(screen.getByTestId("surface").style.borderRadius).toBe("12px")
    view.rerender(<AppearanceProvider appearance={appearance} theme="dark"><Surface data-testid="surface" radius="large" /></AppearanceProvider>)
    expect(screen.getByTestId("surface").style.borderRadius).toBe("12px")
  })

  it("does not consume Appearance shadow values across theme changes", function () {
    const appearance = {
      ...defaultAppearance,
      shadow: {
        light: { x: -3, y: 12, blur: 30, spread: 2, opacity: 0.25 },
        dark: { x: 2, y: 6, blur: 18, spread: -1, opacity: 0 }
      }
    }
    const view = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)
    expect(screen.getByTestId("surface").style.boxShadow).toBe("")
    view.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" />
    </AppearanceProvider>)
    expect(screen.getByTestId("surface").style.boxShadow).toBe("")
  })

  it("uses the default Appearance and browser Theme without a provider", function () {
    render(<Surface data-testid="surface" />)

    expect(screen.getByTestId("surface").style.color).toBe(cssColor(defaultAppearance.colors.light.foreground))
  })

  it.each(["hidden", "clip"] as const)("keeps the glass edge when content overflow is %s", function (overflow) {
    renderSurface(<Surface data-testid="surface" style={{ overflow }}><span>Content</span></Surface>)

    const surface = screen.getByTestId("surface")
    expect(surface.style.overflow).toBe(overflow)
    expect(surface.querySelector("[data-surface-edge]")).not.toBeNull()
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
    expect(surface.hasAttribute("color")).toBe(false)
    expect(surface.getAttribute("aria-label")).toBe("Workspace")
    expect(surface.style.borderRadius).toBe("18px")
    expect(surface.style.padding).toBe("12px")
    expect(screen.getByText("Content").parentElement).toBe(surface)
    expect(surface.querySelector("[data-material-paint]")).toBeInstanceOf(SVGSVGElement)
    expect(baseColor("surface")).toBe("rgb(18, 52, 86)")
    expect(surface.querySelector("canvas")).toBeNull()
  })

  it("renders the translucent grain-free standard Theme material with frost", function () {
    renderSurface(<Surface data-testid="surface" />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-material-paint]"))
    const base = required(material.querySelector<SVGRectElement>("[data-material-base]"))

    expect(surface.style.backgroundColor).toBe("transparent")
    expect(surface.style.backgroundImage).toBe("none")
    expect(surface.style.borderColor).toBe("")
    expect(surface.style.borderStyle).toBe("")
    expect(surface.style.borderWidth).toBe("")
    expect(surface.style.borderRadius).toBe("10px")
    expect(surface.style.boxSizing).toBe("")
    expect(surface.style.color).toBe("rgb(24, 52, 71)")
    expect(surface.style.backdropFilter).toBe("")
    expect(surface.querySelector<HTMLElement>("[data-material-backdrop='frost']")?.style.backdropFilter).toBe("blur(12px)")
    expect(surface.style.position).toBe("relative")
    expect(surface.style.isolation).toBe("isolate")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-edge]"))
    expect(material.style.border).toBe("")
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
    expect(material.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.2")
    expect(base.style.fill).toBe("rgb(255, 255, 255)")
    expect(material.querySelector("[data-material-grain]")).toBeNull()
    expect(material.querySelector("[data-material-grain-tone]")).toBeNull()
    expect(material.querySelector("[data-material-distortion]")).toBeNull()
  })

  it("uses the medium Appearance radius for its geometry and paint", function () {
    render(<AppearanceProvider appearance={{ ...defaultAppearance, radius: 14 }} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)

    const surface = screen.getByTestId("surface")
    expect(surface.style.borderRadius).toBe("14px")
    expect(surface.querySelector<SVGSVGElement>("[data-material-paint]")?.style.borderRadius).toBe("inherit")
    expect(surface.querySelector<HTMLElement>("[data-surface-edge]")?.style.borderRadius).toBe("inherit")
  })

  it("uses the Appearance background base as its default color", function () {
    render(<AppearanceProvider appearance={{
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#123456" },
        dark: { ...defaultAppearance.colors.dark, background: "#123456" }
      }
    }} theme="light">
      <Surface data-testid="surface" />
    </AppearanceProvider>)

    expect(baseColor("surface")).toBe("rgb(18, 52, 86)")
  })

  it("accepts concrete material ranges without leaking them as div attributes", function () {
    renderSurface(<Surface
      data-testid="surface"
      material={{
        grain: 0.9,
        grainAmount: 0.5,
        backdrop: 8,
        distortion: 70,
        saturation: 1.8,
        opacity: 0.5
      }}
    />)

    const surface = screen.getByTestId("surface")
    const material = required(surface.querySelector<SVGSVGElement>("[data-material-paint]"))
    const grain = required(material.querySelector<SVGRectElement>("[data-material-grain]"))
    const refraction = required(surface.querySelector<HTMLElement>("[data-material-backdrop='refraction']"))
    const frost = required(surface.querySelector<HTMLElement>("[data-material-backdrop='frost']"))

    expect(surface.style.backdropFilter).toBe("")
    expect(refraction.style.backdropFilter).toContain("url(")
    expect(frost.style.backdropFilter).toBe("blur(8px) saturate(1.8)")
    expect(surface.style.backgroundColor).toBe("transparent")
    expect(grain.getAttribute("opacity")).toBeNull()
    expect(material.querySelector("[data-material-grain-tone='0']")?.getAttribute("fill")).toBe("color-mix(in srgb, #ffffff 10%, rgb(0 0 0) 90%)")
    expect(material.querySelectorAll("[data-material-distortion-field]")).toHaveLength(1)
    expect(material.querySelectorAll("[data-material-distortion-stage]")).toHaveLength(1)
    expect(material.style.opacity).toBe("")
    expect(material.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.5")
    expect(surface.querySelector<HTMLElement>("[data-surface-edge]")?.style.opacity).toBe("1")
    for (const property of ["grain", "grainAmount", "backdrop", "distortion", "saturation", "opacity"]) {
      expect(surface.hasAttribute(property)).toBe(false)
    }
  })

  it("removes its backdrop properties when the resolved value returns to zero", function () {
    const rendered = renderSurface(<Surface data-testid="surface" material={{ backdrop: 8, distortion: 70, saturation: 1.8 }} />)
    const surface = screen.getByTestId("surface")

    expect(surface.querySelectorAll("[data-material-backdrop]")).toHaveLength(2)

    rendered.rerender(<AppearanceProvider appearance={defaultAppearance} theme="light">
      <Surface data-testid="surface" material={{ backdrop: 0, distortion: 0, saturation: 1 }} />
    </AppearanceProvider>)

    expect(surface.querySelector("[data-material-backdrop]")).toBeNull()
    expect(surface.querySelector("[data-material-distortion]")).toBeNull()
  })

  it("omits grain when either grain dimension is zero", function () {
    renderSurface(<>
      <Surface data-testid="no-intensity" material={{ grain: 0, grainAmount: 1 }} />
      <Surface data-testid="no-amount" material={{ grain: 1, grainAmount: 0 }} />
    </>)

    for (const testId of ["no-intensity", "no-amount"]) {
      const material = required(screen.getByTestId(testId).querySelector<SVGSVGElement>("[data-material-paint]"))
      expect(material.querySelector("[data-material-grain]")).toBeNull()
      expect(material.querySelector("[data-material-grain-tone]")).toBeNull()
    }
  })

  it("renders active grain without scheduling animation frames", function () {
    const request = vi.spyOn(window, "requestAnimationFrame")

    renderSurface(<Surface data-testid="surface" material={{ grain: 0.04, grainAmount: 1 }} />)

    expect(screen.getByTestId("surface").querySelector("[data-material-grain]")).not.toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it("omits the complete SVG material when opacity and displacement are zero", function () {
    renderSurface(<Surface data-testid="surface" material={{ opacity: 0, distortion: 0 }} />)

    const surface = screen.getByTestId("surface")

    expect(surface.querySelector("[data-material-paint]")).toBeNull()
    expect(surface.querySelector("[data-surface-edge]")).toBeNull()
    expect(surface.style.borderColor).toBe("")
  })

  it("renders one organic distortion field and one displacement stage", function () {
    renderSurface(<Surface data-testid="surface" material={{ distortion: 12 }} />)

    const material = required(screen.getByTestId("surface").querySelector<SVGSVGElement>("[data-material-paint]"))
    expect(material.querySelectorAll('[data-material-distortion-field="organic"]')).toHaveLength(1)
    expect(material.querySelectorAll('[data-material-distortion-stage="organic"]')).toHaveLength(1)
    expect(material.querySelector("[data-material-distortion-noise]")).not.toBeNull()
  })

  it("derives the rim colors from the current palette", function () {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#ffeecc", foreground: "#443322" },
        dark: { ...defaultAppearance.colors.dark, background: "#112233", foreground: "#ccddee" }
      }
    }
    const rendered = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" material={{ opacity: 0.5 }} />
    </AppearanceProvider>)
    const border = required(screen.getByTestId("surface").querySelector<HTMLElement>("[data-surface-edge]"))
    const light = border.style.background
    const lightOpacity = Number(border.style.opacity)

    expect(light).toContain("rgb(255, 238, 204)")
    expect(light).toContain("rgb(68, 51, 34)")
    expect(light).not.toMatch(/\b(white|black)\b/)
    rendered.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" material={{ opacity: 0.5 }} />
    </AppearanceProvider>)

    expect(border.style.background).toContain("rgb(17, 34, 51)")
    expect(border.style.background).toContain("rgb(204, 221, 238)")
    expect(border.style.background).not.toBe(light)
    expect(Number(border.style.opacity)).toBeLessThan(lightOpacity)
  })

  it("keeps lighting colors identical but follows background lightness when palette roles are reversed", function () {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#112233", foreground: "#ffeecc" },
        dark: { ...defaultAppearance.colors.dark, background: "#ffeecc", foreground: "#112233" }
      }
    }
    const rendered = render(<AppearanceProvider appearance={appearance} theme="light">
      <Surface data-testid="surface" material={{ opacity: 0.5 }} />
    </AppearanceProvider>)
    const surface = screen.getByTestId("surface")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-edge]"))
    const gradient = border.style.background
    const darkOpacity = Number(border.style.opacity)
    expect(gradient).toMatch(/^linear-gradient\(145deg, color-mix\(in srgb, rgb\(255, 238, 204\)/)

    rendered.rerender(<AppearanceProvider appearance={appearance} theme="dark">
      <Surface data-testid="surface" material={{ opacity: 0.5 }} />
    </AppearanceProvider>)

    expect(border.style.background).toBe(gradient)
    expect(Number(border.style.opacity)).toBeGreaterThan(darkOpacity)
  })

  it("compares CSS expressions after resolving them in the Surface's scope", function () {
    render(<AppearanceProvider appearance={{
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "color-mix(in srgb, #ffffff 80%, #000000)", foreground: "rgb(20 30 40)" },
        dark: { ...defaultAppearance.colors.dark, background: "#000000", foreground: "#ffffff" }
      }
    }} theme="light"><Surface data-testid="surface" /></AppearanceProvider>)
    const border = required(screen.getByTestId("surface").querySelector<HTMLElement>("[data-surface-edge]"))
    expect(border.style.background).toContain("color(srgb 0.8 0.8 0.8)")
  })

  it.each(["light", "dark"] as const)("scales the %s rim by background lightness after capping xlarge opacity", function (theme) {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "oklch(50% 0 0)" },
        dark: { ...defaultAppearance.colors.dark, background: "oklch(50% 0 0)" }
      }
    }
    const rendered = render(<AppearanceProvider appearance={appearance} theme={theme}>
      <Surface data-testid="surface" material={{ opacity: 0.1 }} />
    </AppearanceProvider>)
    const surface = screen.getByTestId("surface")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-edge]"))
    expect(Number(border.style.opacity)).toBeCloseTo(0.1)

    rendered.rerender(<AppearanceProvider appearance={appearance} theme={theme}>
      <Surface data-testid="surface" material={{ opacity: 0.8 }} />
    </AppearanceProvider>)

    expect(Number(border.style.opacity)).toBeCloseTo(0.5)
    expect(surface.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.8")
  })

  it.each([0, 0.25, 0.5, 0.75, 1])("derives rim opacity from background lightness %s", function (lightness) {
    render(<AppearanceProvider appearance={{
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: `oklch(${lightness} 0 0)` },
        dark: { ...defaultAppearance.colors.dark, background: `oklch(${lightness} 0 0)` }
      }
    }} theme="light"><Surface data-testid="surface" material={{ opacity: 0.2 }} /></AppearanceProvider>)

    const border = required(screen.getByTestId("surface").querySelector<HTMLElement>("[data-surface-edge]"))
    expect(Number(border.style.opacity)).toBeCloseTo(0.4 * lightness)
  })

  it("removes the rim at zero opacity while keeping active refraction", function () {
    const rendered = renderSurface(<Surface data-testid="surface" material={{ distortion: 20 }} />)
    const surface = screen.getByTestId("surface")

    rendered.rerender(<AppearanceProvider appearance={defaultAppearance} theme="light">
      <Surface data-testid="surface" material={{ distortion: 20, opacity: 0 }} />
    </AppearanceProvider>)

    expect(surface.querySelector("[data-surface-edge]")).toBeNull()
    expect(surface.querySelector("[data-material-distortion]")).not.toBeNull()
  })

  it("keeps caller-provided position and native backdrop styles authoritative", function () {
    renderSurface(<Surface
      data-testid="surface"
      material={{ backdrop: 0 }}
      style={{ position: "absolute", isolation: "auto", backdropFilter: "saturate(2)" }}
    />)

    const surface = screen.getByTestId("surface")

    expect(surface.style.position).toBe("absolute")
    expect(surface.style.isolation).toBe("isolate")
    expect(surface.style.backdropFilter).toBe("saturate(2)")
  })

})

function renderSurface(surface: ReactNode) {
  return render(<AppearanceProvider appearance={defaultAppearance} theme="light">{surface}</AppearanceProvider>)
}

function baseColor(testId: string) {
  return required(screen.getByTestId(testId).querySelector<SVGRectElement>("[data-material-base]")).style.fill
}

function cssFill(value: string) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "rect")
  element.style.fill = value
  return element.style.fill
}

function cssColor(value: string) {
  const element = document.createElement("div")
  element.style.color = value
  return element.style.color
}

function required<T>(value: T | null): T {
  if (value === null) throw new Error("Expected Surface material test element.")
  return value
}
