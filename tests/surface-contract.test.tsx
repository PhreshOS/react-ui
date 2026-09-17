import { cleanup, render, screen } from "@testing-library/react"
import { createRef, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { UIProvider, Surface, defaultAppearance } from "../source/main.js"
import { color as colorScale, type ColorLevel } from "../source/color.js"
import { shadowStyle } from "../source/shadow-options.js"

afterEach(function () {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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
    const view = render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" color={`background:${level}`} />
    </UIProvider>)
    const base = required(screen.getByTestId("surface").querySelector<SVGRectElement>("[data-material-base]"))
    expect(base.style.fill).toBe(cssFill(colorScale(appearance.colors.light.background)[level]))
    view.rerender(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: true }}>
      <Surface data-testid="surface" color={`background:${level}`} />
    </UIProvider>)
    expect(base.style.fill).toBe(cssFill(colorScale(appearance.colors.dark.background)[level]))
    expect(screen.getByTestId("surface").hasAttribute("color")).toBe(false)
  })

  it.each(["#8b5cf6", "rgb(20 80 120)", "color-mix(in srgb, #ffffff 80%, #000000)"])("accepts the direct background color %s", function (color) {
    renderSurface(<Surface data-testid="surface" color={color} />)
    const base = required(screen.getByTestId("surface").querySelector<SVGRectElement>("[data-material-base]"))
    expect(base.style.fill).toBe(cssFill(color))
  })

  it.each([
    ["xsmall", "2.5px"], ["small", "5px"], ["medium", "10px"], ["large", "15px"], ["xlarge", "20px"], ["full", "9999px"],
    [0, "0px"], [18, "18px"], ["50%", "50%"], ["1rem 2rem", "1rem 2rem"]
  ] as const)("accepts radius %s without forwarding it to the DOM", function (radius, expected) {
    renderSurface(<Surface data-testid="surface" radius={radius} />)
    const surface = screen.getByTestId("surface")
    expect(surface.style.borderRadius).toBe(expected)
    expect(surface.hasAttribute("radius")).toBe(false)
  })

  it("derives radius levels from the shared Appearance value across theme changes", function () {
    const appearance = { ...defaultAppearance, radius: 8 }
    const view = render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}><Surface data-testid="surface" radius="large" /></UIProvider>)
    expect(screen.getByTestId("surface").style.borderRadius).toBe("12px")
    view.rerender(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: true }}><Surface data-testid="surface" radius="large" /></UIProvider>)
    expect(screen.getByTestId("surface").style.borderRadius).toBe("12px")
  })

  it("resolves Appearance shadow values across theme changes", function () {
    const appearance = {
      ...defaultAppearance,
      shadow: {
        light: { x: -3, y: 12, blur: 30, spread: 2, opacity: 0.25 },
        dark: { x: 2, y: 6, blur: 18, spread: -1, opacity: 0 }
      }
    }
    const view = render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" />
    </UIProvider>)
    expect(screen.getByTestId("surface").style.boxShadow).toBe(shadowStyle(appearance.shadow.light))
    view.rerender(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: true }}>
      <Surface data-testid="surface" />
    </UIProvider>)
    expect(screen.getByTestId("surface").style.boxShadow).toBe("none")
  })

  it("accepts grouped shadow overrides without forwarding them to the host", function () {
    renderSurface(<Surface data-testid="surface" shadow={{ x: -4, y: 6, blur: "small", spread: 2, opacity: 0.3 }} />)
    const surface = screen.getByTestId("surface")
    expect(surface.style.boxShadow).toBe("-4px 6px 12px 2px rgba(0, 0, 0, 0.3)")
    expect(surface.hasAttribute("shadow")).toBe(false)
  })

  it("treats true and omission as the Appearance material and shadow defaults", function () {
    renderSurface(<>
      <Surface data-testid="implicit" />
      <Surface data-testid="explicit" material shadow />
    </>)
    const implicit = screen.getByTestId("implicit")
    const explicit = screen.getByTestId("explicit")

    expect(explicit.querySelector("[data-material]")).not.toBeNull()
    expect(explicit.querySelector("[data-surface-edge]")).not.toBeNull()
    expect(explicit.querySelector("[data-material-fill]")?.getAttribute("opacity"))
      .toBe(implicit.querySelector("[data-material-fill]")?.getAttribute("opacity"))
    expect(explicit.style.boxShadow).toBe(implicit.style.boxShadow)
  })

  it("uses ordinary background paint without material or shadow when each is false", function () {
    renderSurface(<Surface data-testid="surface" color="#345678" material={false} shadow={false}>Content</Surface>)
    const surface = screen.getByTestId("surface")

    expect(surface.style.background).toBe("rgb(52, 86, 120)")
    expect(surface.style.boxShadow).toBe("none")
    expect(surface.style.color).toBe(cssColor(defaultAppearance.colors.light.foreground))
    expect(surface.querySelector("[data-material]")).toBeNull()
    expect(surface.querySelector("[data-material-paint]")).toBeNull()
    expect(surface.querySelector("[data-surface-edge]")).toBeNull()
    expect(surface.hasAttribute("material")).toBe(false)
    expect(surface.hasAttribute("shadow")).toBe(false)
    expect(surface.textContent).toBe("Content")
  })

  it("uses the default Appearance and browser Preferences without a provider", function () {
    render(<Surface data-testid="surface" />)

    expect(screen.getByTestId("surface").style.color).toBe(cssColor(defaultAppearance.colors.light.foreground))
    expect(screen.getByTestId("surface").style.boxShadow).toBe(shadowStyle(defaultAppearance.shadow.light))
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

  it("renders the standard light Theme material with frost and grain", function () {
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
    expect(surface.querySelector<HTMLElement>("[data-material-backdrop='frost']")?.style.backdropFilter).toBe("blur(12px) saturate(1.66)")
    expect(surface.style.position).toBe("relative")
    expect(surface.style.isolation).toBe("isolate")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-edge]"))
    const illumination = required(surface.querySelector<HTMLElement>("[data-surface-edge-light]"))
    expect(material.style.border).toBe("")
    expect(border.parentElement).toBe(surface)
    expect(border.childElementCount).toBe(0)
    expect(border.style.boxSizing).toBe("border-box")
    expect(border.style.borderStyle).toBe("solid")
    expect(border.style.borderWidth).toBe("0.8px")
    expect(border.style.borderRadius).toBe("inherit")
    expect(border.style.pointerEvents).toBe("none")
    expect(material.style.zIndex).toBe("-1")
    expect(border.style.zIndex).toBe("1")
    expect(illumination.style.zIndex).toBe("1")
    expect(Number(border.style.opacity)).toBe(1)
    expect(border.style.borderColor).toBe("var(--phreshos-surface-edge-dark)")
    expect(illumination.style.inset).toBe("0px")
    expect(illumination.style.padding).toBe("1.1px")
    expect(illumination.style.background).toContain("linear-gradient(90deg")
    expect(illumination.style.getPropertyValue("--phreshos-surface-edge-light-peak")).toContain("92%")
    expect(illumination.style.getPropertyValue("--phreshos-surface-edge-light-soft")).toContain("56%")
    expect(illumination.style.getPropertyValue("--phreshos-surface-edge-light-minimum")).toContain("24%")
    expect(illumination.style.maskComposite).toBe("exclude")
    expect(surface.querySelector("[data-surface-edge-glow]")).toBeNull()
    expect(material.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.55")
    expect(base.style.fill).toBe("rgb(255, 255, 255)")
    expect(material.querySelector("[data-material-grain]")).not.toBeNull()
    expect(material.querySelector("[data-material-grain-tone]")).not.toBeNull()
    expect(material.querySelector("[data-material-distortion]")).toBeNull()
  })

  it("uses the medium Appearance radius for its geometry and paint", function () {
    render(<UIProvider appearance={{ ...defaultAppearance, radius: 14 }} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" />
    </UIProvider>)

    const surface = screen.getByTestId("surface")
    expect(surface.style.borderRadius).toBe("14px")
    expect(surface.querySelector<SVGSVGElement>("[data-material-paint]")?.style.borderRadius).toBe("inherit")
    expect(surface.querySelector<HTMLElement>("[data-surface-edge]")?.style.borderRadius).toBe("inherit")
  })

  it("uses the Appearance background base as its default color", function () {
    render(<UIProvider appearance={{
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#123456" },
        dark: { ...defaultAppearance.colors.dark, background: "#123456" }
      }
    }} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" />
    </UIProvider>)

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

    rendered.rerender(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" material={{ backdrop: 0, distortion: 0, saturation: 1 }} />
    </UIProvider>)

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

  it("derives nested dark and illuminated edges directly from the current Material color", function () {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#ffeecc" },
        dark: { ...defaultAppearance.colors.dark, background: "#112233" }
      }
    }
    const rendered = render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" material={{ opacity: 0.5 }} />
    </UIProvider>)
    const surface = screen.getByTestId("surface")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-edge]"))
    const light = required(surface.querySelector<HTMLElement>("[data-surface-edge-light]"))
    const dark = border.style.getPropertyValue("--phreshos-surface-edge-dark")
    const lightColor = light.style.getPropertyValue("--phreshos-surface-edge-light-peak")
    expect(dark).toContain("#ffeecc")
    expect(dark).toContain("black")
    expect(lightColor).toContain("#ffeecc")
    expect(lightColor).not.toContain("black")
    expect(Number(border.style.opacity)).toBe(1)
    rendered.rerender(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: true }}>
      <Surface data-testid="surface" material={{ opacity: 0.5 }} />
    </UIProvider>)

    expect(border.style.getPropertyValue("--phreshos-surface-edge-dark")).toContain("#112233")
    expect(border.style.getPropertyValue("--phreshos-surface-edge-dark")).not.toBe(dark)
    expect(light.style.getPropertyValue("--phreshos-surface-edge-light-peak")).not.toBe(lightColor)
    expect(Number(border.style.opacity)).toBe(1)
  })

  it("preserves direct CSS color expressions without observing computed styles", function () {
    render(<UIProvider appearance={{
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "color-mix(in srgb, #ffffff 80%, #000000)", foreground: "rgb(20 30 40)" },
        dark: { ...defaultAppearance.colors.dark, background: "#000000", foreground: "#ffffff" }
      }
    }} preferences={{ theme: "light", animations: true }}><Surface data-testid="surface" /></UIProvider>)
    const border = required(screen.getByTestId("surface").querySelector<HTMLElement>("[data-surface-edge]"))
    expect(border.style.getPropertyValue("--phreshos-surface-edge-dark")).toContain("color-mix(in srgb, #ffffff 80%, #000000)")
  })

  it.each(["light", "dark"] as const)("scales the %s edge from Material opacity and caps it at one", function (theme) {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "oklch(50% 0 0)" },
        dark: { ...defaultAppearance.colors.dark, background: "oklch(50% 0 0)" }
      }
    }
    const rendered = render(<UIProvider appearance={appearance} preferences={{ theme, animations: true }}>
      <Surface data-testid="surface" material={{ opacity: 0.1 }} />
    </UIProvider>)
    const surface = screen.getByTestId("surface")
    const border = required(surface.querySelector<HTMLElement>("[data-surface-edge]"))
    expect(Number(border.style.opacity)).toBeCloseTo(0.2)

    rendered.rerender(<UIProvider appearance={appearance} preferences={{ theme, animations: true }}>
      <Surface data-testid="surface" material={{ opacity: 0.8 }} />
    </UIProvider>)

    expect(Number(border.style.opacity)).toBe(1)
    expect(surface.querySelector("[data-material-fill]")?.getAttribute("opacity")).toBe("0.8")
  })

  it("removes the edge at zero opacity while keeping active refraction", function () {
    const rendered = renderSurface(<Surface data-testid="surface" material={{ distortion: 20 }} />)
    const surface = screen.getByTestId("surface")

    rendered.rerender(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
      <Surface data-testid="surface" material={{ distortion: 20, opacity: 0 }} />
    </UIProvider>)

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
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>{surface}</UIProvider>)
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
