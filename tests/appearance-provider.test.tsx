import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AppearanceProvider, useAppearance, useResolveTheme, useTheme } from "../source/main.js"
import { standardAppearance, type Appearance, type Theme } from "@phreshos/core"

afterEach(cleanup)

describe("AppearanceProvider", function () {
  it("requires complete Appearance and an effective Theme", function () {
    if (false) {
      // @ts-expect-error Both explicit inputs are required.
      void <AppearanceProvider><span /></AppearanceProvider>
    }
  })

  it("provides unresolved Appearance and effective Theme directly", function () {
    const values: Array<Appearance | Theme | string> = []

    render(<AppearanceProvider appearance={standardAppearance} theme="dark">
      <Read onRead={value => values.push(value)} />
    </AppearanceProvider>)

    expect(values).toEqual([standardAppearance, "dark", standardAppearance.background.dark])
  })

  it("resolves shared values through their light branch in either Theme", function () {
    let received = 0

    render(<AppearanceProvider appearance={standardAppearance} theme="dark">
      <ResolveSpacing onRead={value => { received = value }} />
    </AppearanceProvider>)

    expect(received).toBe(standardAppearance.spacing.light)
  })

  it("owns Appearance-derived document scrollbars without rendering a container", function () {
    const rendered = render(<AppearanceProvider appearance={standardAppearance} theme="light">
      <span data-testid="content" />
    </AppearanceProvider>)
    const root = document.documentElement
    const style = document.head.querySelector<HTMLStyleElement>("style[data-phreshos-scrollbars]")

    expect(rendered.container.children).toHaveLength(1)
    expect(style?.textContent).toContain("*:hover::-webkit-scrollbar-thumb")
    expect(style?.textContent).toContain("*::-webkit-scrollbar-thumb:hover")
    expect(style?.textContent).toContain("@supports not selector(::-webkit-scrollbar)")
    expect(style?.textContent).toContain("@supports selector(::-webkit-scrollbar)")
    expect(style?.textContent).toContain("scrollbar-color: transparent transparent")
    expect(style?.textContent).toContain("scrollbar-color: var(--phreshos-scrollbar-thumb) transparent")
    expect(style?.textContent).not.toContain("transition:")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb")).toBe("color-mix(in srgb, #183447 10%, transparent)")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb-hover")).toBe("color-mix(in srgb, #183447 20%, transparent)")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-size")).toBe("14px")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-padding")).toBe("5px")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-radius")).toBe("7px")

    rendered.rerender(<AppearanceProvider appearance={standardAppearance} theme="dark">
      <span data-testid="content" />
    </AppearanceProvider>)

    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb")).toBe("color-mix(in srgb, #edf8fc 10%, transparent)")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb-hover")).toBe("color-mix(in srgb, #edf8fc 20%, transparent)")

    rendered.unmount()

    expect(document.head.querySelector("style[data-phreshos-scrollbars]")).toBeNull()
    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb")).toBe("")
    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb-hover")).toBe("")
  })

  it("restores the previous document Appearance when a later provider leaves", function () {
    const rendered = render(<>
      <AppearanceProvider appearance={standardAppearance} theme="light"><span /></AppearanceProvider>
      <AppearanceProvider appearance={standardAppearance} theme="dark"><span /></AppearanceProvider>
    </>)
    const root = document.documentElement

    expect(document.head.querySelectorAll("style[data-phreshos-scrollbars]")).toHaveLength(1)
    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb")).toContain("#edf8fc")

    rendered.rerender(<AppearanceProvider appearance={standardAppearance} theme="light"><span /></AppearanceProvider>)

    expect(root.style.getPropertyValue("--phreshos-scrollbar-thumb")).toContain("#183447")
  })

  it("rejects reads outside an AppearanceProvider", function () {
    expect(() => render(<Read onRead={() => undefined} />)).toThrow("useAppearance() requires an AppearanceProvider")
  })
})

function Read({ onRead }: Readonly<{ onRead: (value: Appearance | Theme | string) => void }>) {
  const appearance = useAppearance()
  onRead(appearance)
  onRead(useTheme())
  onRead(useResolveTheme(appearance.background))
  return null
}

function ResolveSpacing({ onRead }: Readonly<{ onRead: (value: number) => void }>) {
  onRead(useResolveTheme(useAppearance().spacing))
  return null
}
