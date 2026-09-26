import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { Button, Checkbox, Dialog, Panel, Select, Tabs, UIProvider, Window, defaultAppearance, type ScaleLevel } from "../source/main.js"
import { controlMetrics } from "../source/control/control.js"
import { resolveVisual } from "../source/foundation/visual.js"
import { paintDeclarations } from "./support/paint.js"

afterEach(cleanup)

const visual = resolveVisual(defaultAppearance, { theme: "light", animations: true })
const radiusOf = (element: Element) => Number.parseFloat(paintDeclarations(element)["border-radius"]!)

describe("radius", function () {
  it("gives the medium control height exactly the Appearance radius", function () {
    renderUI(<Button>Medium</Button>)
    expect(radiusOf(screen.getByRole("button"))).toBe(defaultAppearance.radius)
  })

  it.each<ScaleLevel>(["xsmall", "small", "large", "xlarge"])("keeps the same shape at the %s size", function (size) {
    renderUI(<Button size={size}>Sized</Button>)
    const button = screen.getByRole("button")
    const ratio = radiusOf(button) / Number.parseFloat(button.style.height)
    expect(ratio).toBeCloseTo(defaultAppearance.radius / controlMetrics(visual, "medium", "medium").height, 2)
  })

  it("scales a checkbox indicator by the same proportion", function () {
    renderUI(<Checkbox label="Shape" />)
    const indicator = screen.getByRole("checkbox").closest("label")!.querySelector(".phreshos-surface")!
    const size = controlMetrics(visual, "medium", "medium").indicator
    expect(radiusOf(indicator) / size).toBeCloseTo(defaultAppearance.radius / controlMetrics(visual, "medium", "medium").height, 2)
  })

  it.each([
    ["Window", () => <Window data-testid="shell"><Window.Header><Window.Header.Actions><Window.Header.Close /></Window.Header.Actions></Window.Header></Window>],
    ["Panel", () => <Panel data-testid="shell"><Panel.Content>Content</Panel.Content></Panel>]
  ] as const)("keeps the Appearance radius on a %s shell whatever it holds", function (_name, shell) {
    renderUI(shell())
    expect(radiusOf(screen.getByTestId("shell"))).toBe(defaultAppearance.radius)
  })

  it("keeps the Appearance radius on a Dialog shell", async function () {
    renderUI(<Dialog><Dialog.Trigger>Open</Dialog.Trigger><Dialog.Backdrop><Dialog.Content aria-label="Example"><Dialog.Close>Close</Dialog.Close></Dialog.Content></Dialog.Backdrop></Dialog>)
    await userEvent.setup().click(screen.getByRole("button", { name: "Open" }))
    expect(radiusOf(screen.getByRole("dialog").parentElement!)).toBe(defaultAppearance.radius)
  })

  it("gives Panel content the same Appearance radius as its frame", function () {
    renderUI(<Panel data-testid="panel"><Panel.Content data-testid="content">Content</Panel.Content></Panel>)
    expect(radiusOf(screen.getByTestId("panel"))).toBe(defaultAppearance.radius)
    expect(radiusOf(screen.getByTestId("content"))).toBe(defaultAppearance.radius)
  })

  it("keeps the Appearance radius on a list shell and the control radius on its Items", async function () {
    renderUI(<Select label="Choice" defaultValue="one"><Select.Item id="one">One</Select.Item></Select>)
    await userEvent.setup().click(screen.getByRole("button"))
    const option = screen.getByRole("option", { name: "One" })
    const list = screen.getByRole("listbox")
    const popover = list.closest("[data-phreshos-scroll-area]")!.parentElement!
    expect(radiusOf(popover)).toBe(defaultAppearance.radius)
    expect(radiusOf(option)).toBe(controlMetrics(visual, "medium", "medium").radius)
  })

  it("gives the selected Tab the same control radius as its track", async function () {
    renderUI(<Tabs defaultValue="one"><Tabs.List><Tabs.Tab id="one">One</Tabs.Tab><Tabs.Tab id="two">Two</Tabs.Tab></Tabs.List></Tabs>)
    const track = screen.getByRole("tablist").parentElement!
    const selection = await waitFor(() => {
      const found = track.querySelector("[data-selection-indicator]")
      if (found === null) throw new Error("The selection has not been placed")
      return found
    })
    expect(radiusOf(track)).toBe(defaultAppearance.radius)
    expect(radiusOf(selection)).toBe(radiusOf(track))
  })
})

function renderUI(children: ReactNode) {
  return render(<UIProvider preferences={{ theme: "light", animations: true }}>{children}</UIProvider>)
}
