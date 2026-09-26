import { cleanup, render, screen } from "@testing-library/react"
import { createRef, forwardRef, type CSSProperties, type ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { defaultAppearance, Surface, UIProvider } from "../source/main.js"
import { contrast, luminance, mixColor } from "../source/foundation/color.js"
import { resolveVisual } from "../source/foundation/visual.js"
import { surfacePaint } from "../source/surface/surface.js"
import { shadowStyle } from "../source/surface/shadow-options.js"
import { lifted } from "./support/paint.js"

afterEach(cleanup)

const visual = resolveVisual(defaultAppearance, { theme: "light", animations: true })

function paint(...[color, depth, material, shadow, interaction]: Partial<Parameters<typeof surfacePaint>> extends infer _ ? [
  Parameters<typeof surfacePaint>[1]?, Parameters<typeof surfacePaint>[2]?, Parameters<typeof surfacePaint>[3]?,
  Parameters<typeof surfacePaint>[4]?, Parameters<typeof surfacePaint>[5]?
] : never) {
  return surfacePaint(visual, color ?? "background", depth ?? "raised", material, shadow, interaction)
}

function variable(result: ReturnType<typeof surfacePaint>, name: string) {
  return (result.variables as Record<string, string>)[`--phreshos-surface-${name}`]
}

describe("Surface depth", function () {
  it("raises with an outer Appearance shadow, a lit rim, and an inward spill", function () {
    const raised = paint("background", "raised")
    expect(raised.shadow).toContain(shadowStyle(defaultAppearance.shadow.light))
    expect(defaultAppearance.shadow.light.x).toBe(0)
    expect(defaultAppearance.shadow.light.y).toBe(0)
    expect(raised.shadow).toMatch(/^0 0 0 0\.5px /)
    // Light rises from the middle of the top and bottom edges and fades before the sides.
    expect(variable(raised, "rim")).toMatch(/^linear-gradient\(to right, transparent, .* 50%, .*, transparent\)$/)
    expect(variable(raised, "spill-top")).toMatch(/^radial-gradient\(50% 6px at 50% 0,/)
    expect(variable(raised, "spill-bottom")).toMatch(/^radial-gradient\(50% 6px at 50% 100%,/)
  })

  it("recesses with a slightly deeper paint, a dimmer rim, and no outer shadow", function () {
    const recessed = paint("background", "recessed")
    expect(lifted(recessed.shadow)).toBe(false)
    expect(recessed.fill).toBe(mixColor(defaultAppearance.colors.light.background, "#000000", 0.03))
    expect(variable(recessed, "spill-top")).toBe("none")
    expect(variable(recessed, "rim")).not.toBe(variable(paint("background", "raised"), "rim"))
  })

  it("sits level when flat, keeping only its rim and hairline", function () {
    const flat = paint("background", "flat")
    expect(lifted(flat.shadow)).toBe(false)
    expect(variable(flat, "spill-top")).toBe("none")
  })

  it("stays distinguishable from any canvas by moving toward the side with room", function () {
    const at = (background: string) => {
      const appearance = { ...defaultAppearance, colors: { ...defaultAppearance.colors, light: { ...defaultAppearance.colors.light, background } } }
      return surfacePaint(resolveVisual(appearance, { theme: "light", animations: true }), "background", "recessed", undefined, undefined, undefined).fill
    }
    for (const background of ["#fbf8f4", "#8a8580", "#16120f", "#050505"]) {
      expect(contrast(background, at(background))!).toBeGreaterThan(1.05)
    }
    expect(luminance(at("#fbf8f4"))!).toBeLessThan(luminance("#fbf8f4")!)
    expect(luminance(at("#16120f"))!).toBeGreaterThan(luminance("#16120f")!)
  })

})

describe("Surface interaction", function () {
  it("moves the same base toward the content color on hover and press", function () {
    const base = defaultAppearance.colors.light.primary
    const foreground = defaultAppearance.colors.light.foreground
    expect(paint("primary", "raised", undefined, undefined, { hovered: true }).fill).toBe(mixColor(base, foreground, 0.05))
    expect(paint("primary", "raised", undefined, undefined, { pressed: true }).fill).toBe(mixColor(base, foreground, 0.1))
  })

  it("settles a pressed raised Surface onto its surroundings", function () {
    expect(lifted(paint("default", "raised", undefined, undefined, { pressed: true }).shadow)).toBe(false)
  })

  it("ignores hover and press while disabled", function () {
    const disabled = paint("primary", "raised", undefined, undefined, { hovered: true, pressed: true, disabled: true })
    expect(disabled.fill).toBe(defaultAppearance.colors.light.primary)
  })

  it("rings focus in the owner's color, or the identity color when the owner is neutral", function () {
    expect(paint("danger", "raised", undefined, undefined, { focusVisible: true }).ring).toContain(defaultAppearance.colors.light.danger)
    expect(paint("background", "raised", undefined, undefined, { focusVisible: true }).ring).toContain(defaultAppearance.colors.light.primary)
  })

  it("lets a focused or invalid value holder claim its hairline", function () {
    expect(paint("background", "recessed", undefined, undefined, { focusVisible: true }).shadow).toBe(`0 0 0 1px ${defaultAppearance.colors.light.primary}`)
    expect(paint("background", "recessed", undefined, undefined, { invalid: true }).shadow).toBe(`0 0 0 1px ${defaultAppearance.colors.light.danger}`)
  })

  it("keeps a transparent Surface without substance until interaction veils it", function () {
    const rest = paint("transparent", "raised")
    expect(rest.fill).toBe("transparent")
    expect(rest.shadow).toBe("none")
    expect(rest.text).toBe("inherit")
    expect(paint("transparent", "raised", undefined, undefined, { hovered: true }).fill).not.toBe("transparent")
  })
})

describe("Surface material", function () {
  it("adds Material capabilities progressively from none through full", function () {
    const appearance = {
      ...defaultAppearance,
      material: {
        light: { ...defaultAppearance.material.light, opacity: 0.4, backdrop: 8, saturation: 1.8, grain: 0.2, distortion: 12 },
        dark: defaultAppearance.material.dark
      }
    }
    const translucent = resolveVisual(appearance, { theme: "light", animations: true })
    const at = (material: "none" | "basic" | "extended" | "full") => surfacePaint(translucent, "background", "raised", material, undefined, undefined)

    expect(variable(at("none"), "grain")).toBe("none")
    expect(variable(at("none"), "rim")).toBe("none")
    expect(variable(at("basic"), "grain")).toContain("data:image/svg+xml")
    expect(variable(at("basic"), "paint")).toBe(at("basic").fill)
    expect(variable(at("extended"), "paint")).toContain("color-mix(in srgb")
    expect(variable(at("extended"), "frost")).toBe("none")
    expect(variable(at("full"), "frost")).toBe("blur(8px) saturate(1.8)")
    expect(at("full").distortion).toBe(12)
  })

  it("omits backdrop work when the final paint is opaque", function () {
    const full = surfacePaint(visual, "background", "raised", { opacity: 1, backdrop: 12 }, undefined, undefined)
    expect(variable(full, "frost")).toBe("none")
    expect(full.distortion).toBe(0)
  })
})

describe("Surface element", function () {
  it("renders one element whose paint lives in a shared class", function () {
    renderLight(<>
      <Surface data-testid="first">One</Surface>
      <Surface data-testid="second">Two</Surface>
    </>)
    const first = screen.getByTestId("first")
    expect(first.children).toHaveLength(0)
    expect(first.textContent).toBe("One")
    const paintClass = [...first.classList].find(name => name.startsWith("phreshos-paint-"))
    expect(paintClass).toBeDefined()
    expect(screen.getByTestId("second").classList.contains(paintClass!)).toBe(true)
    expect(ruleText(paintClass!)).toContain("--phreshos-surface-paint")
  })

  it("keeps consumer classes and styles above its own paint", function () {
    renderLight(<Surface data-testid="surface" className="mine" style={{ position: "absolute", color: "red" }} />)
    const surface = screen.getByTestId("surface")
    expect(surface.classList.contains("mine")).toBe(true)
    expect(surface.style.position).toBe("absolute")
    expect(surface.style.color).toBe("red")
    const paintClass = [...surface.classList].find(name => name.startsWith("phreshos-paint-"))!
    expect(ruleText(paintClass)).toMatch(/^:where\(/)
  })

  it("changes its paint class when the Theme changes", function () {
    const view = render(<UIProvider preferences={{ theme: "light", animations: true }}><Surface data-testid="surface" /></UIProvider>)
    const before = screen.getByTestId("surface").className
    view.rerender(<UIProvider preferences={{ theme: "dark", animations: true }}><Surface data-testid="surface" /></UIProvider>)
    expect(screen.getByTestId("surface").className).not.toBe(before)
  })

  it("resolves radius levels and explicit values", function () {
    renderLight(<>
      <Surface data-testid="large" radius="large" />
      <Surface data-testid="full" radius="full" />
      <Surface data-testid="pixels" radius={3} />
    </>)
    expect(ruleFor("large")).toContain("border-radius: 15px")
    expect(ruleFor("full")).toContain("border-radius: 9999px")
    expect(ruleFor("pixels")).toContain("border-radius: 3px")
  })

  it("adds a refraction pass only when distortion is visible", function () {
    renderLight(<Surface data-testid="surface" material={{ opacity: 0.5, distortion: 20 }} />)
    expect(screen.getByTestId("surface").querySelector("[data-surface-refraction]")).not.toBeNull()
  })

  it("renders on another host and forwards its ref", function () {
    const ref = createRef<HTMLButtonElement>()
    const Host = forwardRef<HTMLElement, { children?: ReactNode, className?: string, style?: CSSProperties }>(function Host(properties, forwarded) {
      return <section {...properties} ref={forwarded} data-testid="host" />
    })
    renderLight(<>
      <Surface as="button" ref={ref} type="button">Press</Surface>
      <Surface as={Host}>Hosted</Surface>
    </>)
    expect(ref.current?.tagName).toBe("BUTTON")
    expect(screen.getByTestId("host").className).toContain("phreshos-surface")
  })
})

function renderLight(children: ReactNode) {
  return render(<UIProvider preferences={{ theme: "light", animations: true }}>{children}</UIProvider>)
}

function ruleFor(testId: string) {
  const name = [...screen.getByTestId(testId).classList].find(value => value.startsWith("phreshos-paint-"))!
  return ruleText(name)
}

function ruleText(className: string) {
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (rule.cssText.includes(`.${className})`)) return rule.cssText
    }
  }
  return ""
}
