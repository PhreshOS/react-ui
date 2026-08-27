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
