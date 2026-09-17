import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { UIProvider, defaultAppearance, useAppearance, useBrowserPreferences, usePreferences, useThemedValue, type Appearance, type Preferences } from "../source/main.js"

afterEach(cleanup)

describe("UIProvider", function () {
  it("introduces no boundary when every property is omitted", function () {
    const values: Array<Appearance | Preferences | string> = []

    const view = render(<UIProvider><main data-testid="content"><Read onRead={value => values.push(value)} /></main></UIProvider>)

    expect(view.container.firstElementChild).toBe(view.getByTestId("content"))
    expect(values).toEqual([defaultAppearance, { theme: "light", animations: true }, defaultAppearance.colors.light.background])
  })

  it("provides Appearance and complete Preferences directly", function () {
    const values: Array<Appearance | Preferences | string> = []

    render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "dark", animations: false }}>
      <Read onRead={value => values.push(value)} />
    </UIProvider>)

    expect(values).toEqual([defaultAppearance, { theme: "dark", animations: false }, defaultAppearance.colors.dark.background])
  })

  it("inherits every omitted property from the nearest provider", function () {
    const appearance = {
      ...defaultAppearance,
      colors: {
        light: { ...defaultAppearance.colors.light, background: "#112233" },
        dark: { ...defaultAppearance.colors.dark, background: "#ddeeff" }
      }
    }
    const values: Array<Appearance | Preferences | string> = []

    render(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: false }}>
      <UIProvider><Read onRead={value => values.push(value)} /></UIProvider>
    </UIProvider>)

    expect(values).toEqual([appearance, { theme: "dark", animations: false }, appearance.colors.dark.background])
  })

  it("overrides only the property that is supplied", function () {
    const appearance = {
      ...defaultAppearance,
      spacing: defaultAppearance.spacing + 1
    }
    const values: Array<Appearance | Preferences | string> = []

    render(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: false }}>
      <UIProvider preferences={{ theme: "light", animations: true }}>
        <Read onRead={value => values.push(value)} />
      </UIProvider>
    </UIProvider>)

    expect(values).toEqual([appearance, { theme: "light", animations: true }, appearance.colors.light.background])
  })

  it("does not alter arbitrary document scrollbars", function () {
    render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
      <span data-testid="content" />
    </UIProvider>)
    expect(document.head.querySelector("style[data-phreshos-scrollbars]")).toBeNull()
    expect(document.documentElement.getAttribute("style")).toBeNull()
  })

  it("uses React UI defaults outside a UIProvider", function () {
    const values: Array<Appearance | Preferences | string> = []

    render(<Read onRead={value => values.push(value)} />)

    expect(values).toEqual([defaultAppearance, { theme: "light", animations: true }, defaultAppearance.colors.light.background])
  })

  it("reacts to complete browser Preferences when no provider supplies them", function () {
    const listeners = new Set<() => void>()
    let dark = true
    let reduced = false
    const original = window.matchMedia

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("color-scheme") ? dark : reduced,
        media: query,
        onchange: null,
        addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true
      })
    })

    const values: Preferences[] = []
    const rendered = render(<ReadBrowserPreferences onRead={value => values.push(value)} />)
    expect(values.at(-1)).toEqual({ theme: "dark", animations: true })

    act(() => {
      dark = false
      reduced = true
      for (const listener of listeners) listener()
    })

    expect(values.at(-1)).toEqual({ theme: "light", animations: false })
    rendered.unmount()
    Object.defineProperty(window, "matchMedia", { configurable: true, value: original })
  })
})

function Read({ onRead }: Readonly<{ onRead: (value: Appearance | Preferences | string) => void }>) {
  const appearance = useAppearance()
  onRead(appearance)
  onRead(usePreferences())
  onRead(useThemedValue(appearance.colors).background)
  return null
}

function ReadBrowserPreferences({ onRead }: Readonly<{ onRead: (value: Preferences) => void }>) {
  onRead(useBrowserPreferences())
  return null
}
