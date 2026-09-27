import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import { Badge, Code, Heading, Kbd, Link, Text, UIProvider, defaultAppearance } from "../source/main.js"
import { colorLevel } from "../source/foundation/color.js"
import { cssColor } from "./support/paint.js"

afterEach(cleanup)

const colors = defaultAppearance.colors.light

function renderLight(node: ReactNode) {
  return render(<UIProvider preferences={{ theme: "light", animations: false }}>{node}</UIProvider>)
}

it("draws a Link as a native anchor in the strong level of its color", function () {
  renderLight(<Link href="/docs">Documentation</Link>)
  const link = screen.getByRole("link", { name: "Documentation" })
  expect(link.tagName).toBe("A")
  expect(link.getAttribute("href")).toBe("/docs")
  expect(link.style.color).toBe(cssColor(colorLevel(colors.primary, "strong", colors)))
  expect(link.style.textDecorationLine).toBe("underline")
})

it("follows in-app links with the provider's navigate", async function () {
  const navigate = vi.fn()
  render(<UIProvider navigate={navigate}><Link href="/blog">Blog</Link></UIProvider>)
  await userEvent.setup().click(screen.getByRole("link", { name: "Blog" }))
  expect(navigate).toHaveBeenCalledWith("/blog", undefined)
})

it("sizes headings by level along the Appearance scale ladder", function () {
  renderLight(<><Heading level={1}>One</Heading><Heading level={3}>Three</Heading><Heading level={3} size="xlarge">Big three</Heading></>)
  expect(screen.getByRole("heading", { level: 1, name: "One" }).style.fontSize).toBe("2em")
  expect(screen.getByRole("heading", { level: 3, name: "Three" }).style.fontSize).toBe("1.5em")
  expect(screen.getByRole("heading", { level: 3, name: "Big three" }).style.fontSize).toBe("2em")
})

it("recedes secondary Text to the strength of descriptions", function () {
  renderLight(<Text tone="secondary">Quiet</Text>)
  expect(screen.getByText("Quiet").style.opacity).toBe("0.66")
})

it("marks keys and code with their native elements", function () {
  renderLight(<p>Press <Kbd>⌘K</Kbd> or run <Code>phresh dev</Code></p>)
  expect(screen.getByText("⌘K").closest("kbd")).not.toBeNull()
  expect(screen.getByText("phresh dev").tagName).toBe("CODE")
})

it("paints a Badge in the subtle level with strong text, and a dot in the full color", function () {
  renderLight(<Badge color="success" dot>running</Badge>)
  const badge = screen.getByText("running")
  expect(badge.style.color).toBe(cssColor(colorLevel(colors.success, "strong", colors)))
  expect(badge.querySelector<HTMLElement>("[aria-hidden]")!.style.background).toBe(cssColor(colors.success))
})
