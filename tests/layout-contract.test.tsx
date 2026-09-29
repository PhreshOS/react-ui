import { cleanup, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { AppLayout, UIProvider, Flex, Grid, defaultAppearance } from "../source/main.js"

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

  it("resolves semantic gaps from the nearest UIProvider", function () {
    render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
      <Flex data-testid="xsmall" gap="xsmall" />
      <Flex data-testid="small" gap="small" />
      <Flex data-testid="medium" gap="medium" />
      <Flex data-testid="large" gap="large" />
      <Flex data-testid="xlarge" gap="xlarge" />
    </UIProvider>)

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

it("pads a container one level above the spacing a control pads with", async function () {
  const { containerPadding } = await import("../source/foundation/spacing.js")
  expect(containerPadding(12)).toBe(18)
  expect(containerPadding(8)).toBe(12)
})

it("keeps the sidebar footer at the foot, outside what scrolls", function () {
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <AppLayout>
      <AppLayout.Sidebar aria-label="Places" footer={<p>In progress</p>}><p>Home</p></AppLayout.Sidebar>
      <AppLayout.Content>Files</AppLayout.Content>
    </AppLayout>
  </UIProvider>)

  const scrolling = screen.getByText("Home").closest("[data-phreshos-scroll-area-viewport]")
  expect(scrolling).not.toBeNull()
  expect(scrolling!.contains(screen.getByText("In progress"))).toBe(false)
  expect(screen.getByRole("complementary", { name: "Places" }).lastElementChild!.contains(screen.getByText("In progress"))).toBe(true)
})

it("raises the content by default, and recesses it when asked", function () {
  const content = (depth?: "recessed") => {
    const { unmount } = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
      <AppLayout><AppLayout.Content depth={depth}>Files</AppLayout.Content></AppLayout>
    </UIProvider>)
    const style = screen.getByRole("main").className
    unmount()
    return style
  }

  expect(content()).toBe(content())
  expect(content()).not.toBe(content("recessed"))
})
