import { cleanup, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { standardTheme } from "@phreshos/core"
import { Flex, Grid, ThemeProvider } from "../source/main.js"

afterEach(cleanup)

describe("Flex", function () {
  it("maps its layout contract while retaining native element properties and refs", function () {
    const ref = createRef<HTMLDivElement>()

    render(
      <Flex
        ref={ref}
        data-testid="layout"
        className="custom"
        direction="column"
        align="center"
        justify="between"
        wrap
        gap={12}
      >
        Content
      </Flex>
    )

    const layout = screen.getByTestId("layout")

    expect(ref.current).toBe(layout)
    expect(layout.className).toBe("custom")
    expect(layout.style.display).toBe("flex")
    expect(layout.style.flexDirection).toBe("column")
    expect(layout.style.alignItems).toBe("center")
    expect(layout.style.justifyContent).toBe("space-between")
    expect(layout.style.flexWrap).toBe("wrap")
    expect(layout.style.gap).toBe("12px")
  })

  it("lets named layout properties take precedence over conflicting styles", function () {
    render(<Flex data-testid="layout" direction="row" gap="1rem" style={{ display: "none", flexDirection: "column", gap: 0 }} />)

    const layout = screen.getByTestId("layout")

    expect(layout.style.display).toBe("flex")
    expect(layout.style.flexDirection).toBe("row")
    expect(layout.style.gap).toBe("1rem")
  })

  it("resolves semantic gaps from the nearest ThemeProvider", function () {
    render(<ThemeProvider theme={standardTheme}>
      <Flex data-testid="xsmall" gap="xsmall" />
      <Flex data-testid="small" gap="small" />
      <Flex data-testid="medium" gap="medium" />
      <Flex data-testid="large" gap="large" />
      <Flex data-testid="xlarge" gap="xlarge" />
    </ThemeProvider>)

    expect(screen.getByTestId("xsmall").style.gap).toBe("3px")
    expect(screen.getByTestId("small").style.gap).toBe("6px")
    expect(screen.getByTestId("medium").style.gap).toBe("12px")
    expect(screen.getByTestId("large").style.gap).toBe("18px")
    expect(screen.getByTestId("xlarge").style.gap).toBe("24px")
  })
})

describe("Grid", function () {
  it("turns numeric dimensions into equal tracks", function () {
    render(<Grid data-testid="layout" columns={3} rows={2} gap="0.75rem" flow="column" />)

    const layout = screen.getByTestId("layout")

    expect(layout.style.display).toBe("grid")
    expect(layout.style.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))")
    expect(layout.style.gridTemplateRows).toBe("repeat(2, minmax(0, 1fr))")
    expect(layout.style.gridAutoFlow).toBe("column")
    expect(layout.style.gap).toBe("0.75rem")
  })

  it("accepts native CSS track expressions", function () {
    render(<Grid data-testid="layout" columns="repeat(auto-fit, minmax(12rem, 1fr))" rows="auto 1fr" inline />)

    const layout = screen.getByTestId("layout")

    expect(layout.style.display).toBe("inline-grid")
    expect(layout.style.gridTemplateColumns).toBe("repeat(auto-fit, minmax(12rem, 1fr))")
    expect(layout.style.gridTemplateRows).toBe("auto 1fr")
  })
})
