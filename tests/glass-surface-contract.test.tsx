import { standardTheme } from "@phreshos/core"
import { cleanup, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { GlassSurface, ThemeProvider } from "../source/main.js"

afterEach(cleanup)

describe("GlassSurface", function () {
  it("requires the explicit Theme supplied by its application", function () {
    expect(() => render(<GlassSurface />)).toThrow("useTheme() requires a ThemeProvider")
  })

  it("owns only its themed glass material", function () {
    const ref = createRef<HTMLDivElement>()

    render(<ThemeProvider theme={standardTheme}>
      <GlassSurface
        ref={ref}
        data-testid="glass"
        className="custom"
        style={{ borderRadius: 18, padding: 12 }}
      >
        Content
      </GlassSurface>
    </ThemeProvider>)

    const glass = screen.getByTestId("glass")

    expect(ref.current).toBe(glass)
    expect(glass.className).toBe("custom")
    expect(glass.style.borderRadius).toBe("18px")
    expect(glass.style.padding).toBe("12px")
    expect(glass.style.color).toBe("rgb(24, 52, 71)")
    expect(glass.style.backgroundColor).toBe("color-mix(in srgb, rgb(237, 248, 252) 12%, transparent)")
    expect(glass.style.backdropFilter).toContain("blur(4px) saturate(1.8) brightness(1.06)")
    expect(glass.style.boxShadow).toContain("inset 1px 1px 0")
    expect(glass.textContent).toBe("Content")
  })

  it("derives the five independent visual levels from the concrete Theme defaults", function () {
    render(<ThemeProvider theme={standardTheme}>
      <GlassSurface
        data-testid="glass"
        distortion="large"
        blur="small"
        saturation="medium"
        brightness="large"
        opacity="large"
      />
    </ThemeProvider>)

    const glass = screen.getByTestId("glass")
    const displacement = glass.querySelector("feDisplacementMap")

    expect(glass.style.backdropFilter).toContain("blur(2px) saturate(1.8) brightness(1.09)")
    expect(glass.style.backgroundColor).toBe("color-mix(in srgb, rgb(237, 248, 252) 18%, transparent)")
    expect(displacement?.getAttribute("scale")).toBe("105")
  })

  it("accepts the shared semantic Radius without hiding explicit values", function () {
    render(<ThemeProvider theme={standardTheme}>
      <GlassSurface data-testid="xsmall" radius="xsmall" />
      <GlassSurface data-testid="small" radius="small" />
      <GlassSurface data-testid="medium" radius="medium" />
      <GlassSurface data-testid="large" radius="large" />
      <GlassSurface data-testid="xlarge" radius="xlarge" />
      <GlassSurface data-testid="explicit" radius="2rem" />
    </ThemeProvider>)

    expect(screen.getByTestId("xsmall").style.borderRadius).toBe("2.5px")
    expect(screen.getByTestId("small").style.borderRadius).toBe("5px")
    expect(screen.getByTestId("medium").style.borderRadius).toBe("10px")
    expect(screen.getByTestId("large").style.borderRadius).toBe("15px")
    expect(screen.getByTestId("xlarge").style.borderRadius).toBe("20px")
    expect(screen.getByTestId("explicit").style.borderRadius).toBe("2rem")
  })

  it("derives semantic treatments from any CSS background without using the accent", function () {
    render(<ThemeProvider theme={{
      ...standardTheme,
      background: "oklch(62% 0.24 29)",
      accent: "hotpink"
    }}>
      <GlassSurface data-testid="base" />
      <GlassSurface data-testid="strong" color="strong" />
    </ThemeProvider>)

    expect(screen.getByTestId("base").style.backgroundColor).toBe("color-mix(in srgb, oklch(0.62 0.24 29) 12%, transparent)")
    expect(screen.getByTestId("strong").style.backgroundColor).toContain("color-mix(in oklch, oklch(0.62 0.24 29) 82%, black)")
  })

  it("caps derived material opacity at thirty percent without fading its content", function () {
    const theme = {
      ...standardTheme,
      glass: { ...standardTheme.glass, opacity: 0.8 }
    }

    render(<ThemeProvider theme={theme}>
      <GlassSurface data-testid="glass" opacity="large">Content</GlassSurface>
    </ThemeProvider>)

    const glass = screen.getByTestId("glass")

    expect(glass.style.backgroundColor).toBe("color-mix(in srgb, rgb(237, 248, 252) 30%, transparent)")
    expect(glass.style.backgroundImage).toContain("30%")
    expect(glass.style.opacity).toBe("")
    expect(glass.textContent).toBe("Content")
  })
})
