import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AppearanceProvider, useAppearance, useThemedValue, useTheme } from "../source/main.js"
import { defaultAppearance, type Appearance, type Theme } from "@phreshos/core"

afterEach(cleanup)

describe("AppearanceProvider", function () {
  it("accepts independent Appearance and Theme overrides", function () {
    const values: Array<Appearance | Theme | string> = []

    render(<AppearanceProvider><Read onRead={value => values.push(value)} /></AppearanceProvider>)

    expect(values).toEqual([defaultAppearance, "light", defaultAppearance.colors.light.background])
  })

  it("provides unresolved Appearance and effective Theme directly", function () {
    const values: Array<Appearance | Theme | string> = []

    render(<AppearanceProvider appearance={defaultAppearance} theme="dark">
      <Read onRead={value => values.push(value)} />
    </AppearanceProvider>)

    expect(values).toEqual([defaultAppearance, "dark", defaultAppearance.colors.dark.background])
  })

  it("inherits every omitted value from the nearest provider", function () {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#112233" },
        dark: { ...defaultAppearance.colors.dark, background: "#ddeeff" }
      }
    }
    const values: Array<Appearance | Theme | string> = []

    render(<AppearanceProvider appearance={appearance} theme="dark">
      <AppearanceProvider><Read onRead={value => values.push(value)} /></AppearanceProvider>
    </AppearanceProvider>)

    expect(values).toEqual([appearance, "dark", appearance.colors.dark.background])
  })

  it("does not alter arbitrary document scrollbars", function () {
    render(<AppearanceProvider appearance={defaultAppearance} theme="light">
      <span data-testid="content" />
    </AppearanceProvider>)
    expect(document.head.querySelector("style[data-phreshos-scrollbars]")).toBeNull()
    expect(document.documentElement.getAttribute("style")).toBeNull()
  })

  it("uses Core defaults outside an AppearanceProvider", function () {
    const values: Array<Appearance | Theme | string> = []

    render(<Read onRead={value => values.push(value)} />)

    expect(values).toEqual([defaultAppearance, "light", defaultAppearance.colors.light.background])
  })

  it("reacts to the browser Theme when no provider selects one", function () {
    const listeners = new Set<() => void>()
    let dark = true
    const original = window.matchMedia

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: dark,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true
      })
    })

    const values: Theme[] = []
    const rendered = render(<ReadTheme onRead={value => values.push(value)} />)
    expect(values.at(-1)).toBe("dark")

    act(() => {
      dark = false
      for (const listener of listeners) listener()
    })

    expect(values.at(-1)).toBe("light")
    rendered.unmount()
    Object.defineProperty(window, "matchMedia", { configurable: true, value: original })
  })
})

function Read({ onRead }: Readonly<{ onRead: (value: Appearance | Theme | string) => void }>) {
  const appearance = useAppearance()
  onRead(appearance)
  onRead(useTheme())
  onRead(useThemedValue(appearance.colors).background)
  return null
}

function ReadTheme({ onRead }: Readonly<{ onRead: (value: Theme) => void }>) {
  onRead(useTheme())
  return null
}
