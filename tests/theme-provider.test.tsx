import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ThemeProvider, useTheme } from "../source/main.js"
import { standardTheme, type Theme, type ThemeProperties } from "@phreshos/core"

afterEach(cleanup)

describe("ThemeProvider", function () {
  it("requires an explicit Theme value", function () {
    if (false) {
      // @ts-expect-error A provider never discovers or supplies its own Theme.
      void <ThemeProvider><span /></ThemeProvider>
    }
  })

  it("rejects an observable Theme handle", function () {
    if (false) {
      const source = null as unknown as Theme

      // @ts-expect-error React UI receives a value, not an environment handle.
      void <ThemeProvider theme={source}><span /></ThemeProvider>
    }
  })

  it("provides the supplied Theme value directly", function () {
    const theme = createTheme()
    let received: ThemeProperties | null = null

    render(<ThemeProvider theme={theme}><Read onRead={value => { received = value }} /></ThemeProvider>)

    expect(received).toBe(theme)
  })

  it("provides a replacement value when its prop changes", function () {
    const first = createTheme()
    const second = createTheme()
    let received: ThemeProperties | null = null
    const rendered = render(<ThemeProvider theme={first}><Read onRead={value => { received = value }} /></ThemeProvider>)

    expect(received).toBe(first)

    rendered.rerender(<ThemeProvider theme={second}><Read onRead={value => { received = value }} /></ThemeProvider>)

    expect(received).toBe(second)
  })

  it("uses the nearest Theme without changing its parent or siblings", function () {
    const outer = createTheme()
    const inner = createTheme()
    const received: ThemeProperties[] = []

    render(<ThemeProvider theme={outer}>
      <Read onRead={value => { received.push(value) }} />
      <ThemeProvider theme={inner}><Read onRead={value => { received.push(value) }} /></ThemeProvider>
      <Read onRead={value => { received.push(value) }} />
    </ThemeProvider>)

    expect(received).toEqual([outer, inner, outer])
  })

  it("rejects reads outside a ThemeProvider", function () {
    expect(() => render(<Read onRead={() => undefined} />)).toThrow("useTheme() requires a ThemeProvider")
  })
})

function Read({ onRead }: Readonly<{ onRead: (theme: ThemeProperties) => void }>) {
  onRead(useTheme())
  return null
}

function createTheme(): ThemeProperties {
  return Object.freeze({ ...standardTheme })
}
