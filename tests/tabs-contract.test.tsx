import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterAll, afterEach, beforeAll, expect, expectTypeOf, it, vi } from "vitest"
import {
  Tabs,
  UIProvider,
  defaultAppearance,
  type TabsProps,
  type TabsTabProps
} from "../source/main.js"
import { readableColor } from "../source/foundation/color.js"
import { cssColor, surfaceFill } from "./support/paint.js"

beforeAll(function () {
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: () => []
  })
})

afterAll(function () {
  Reflect.deleteProperty(Element.prototype, "getAnimations")
})

afterEach(cleanup)

it("uses string identities and value callbacks", function () {
  expectTypeOf<TabsTabProps["id"]>().toEqualTypeOf<string>()
  expectTypeOf<TabsProps["value"]>().toEqualTypeOf<string | undefined>()
  expectTypeOf<TabsProps["onChange"]>().toEqualTypeOf<((value: string) => void) | undefined>()
})

it("connects tabs to panels and preserves the primitive keyboard behavior", async function () {
  const onChange = vi.fn()
  const user = userEvent.setup()

  renderTabs(<Tabs defaultValue="overview" onChange={onChange}>
    <Tabs.List aria-label="Project views">
      <Tabs.Tab id="overview">Overview</Tabs.Tab>
      <Tabs.Tab id="activity">Activity</Tabs.Tab>
      <Tabs.Tab id="settings" disabled>Settings</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel id="overview">Project overview</Tabs.Panel>
    <Tabs.Panel id="activity">Recent activity</Tabs.Panel>
    <Tabs.Panel id="settings">Project settings</Tabs.Panel>
  </Tabs>)

  const overview = screen.getByRole("tab", { name: "Overview" })
  const activity = screen.getByRole("tab", { name: "Activity" })

  expect(overview.getAttribute("aria-selected")).toBe("true")
  expect(screen.getByRole("tabpanel", { name: "Overview" }).textContent).toBe("Project overview")

  overview.focus()
  await user.keyboard("[ArrowRight]")

  expect(document.activeElement).toBe(activity)
  expect(activity.getAttribute("aria-selected")).toBe("true")
  expect(onChange).toHaveBeenLastCalledWith("activity")
  expect(screen.getByRole("tabpanel", { name: "Activity" }).textContent).toBe("Recent activity")
})

it("uses the React UI direction for horizontal keyboard behavior", async function () {
  const user = userEvent.setup()
  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="Project views">
        <Tabs.Tab id="overview">Overview</Tabs.Tab>
        <Tabs.Tab id="activity">Activity</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="overview">Project overview</Tabs.Panel>
      <Tabs.Panel id="activity">Recent activity</Tabs.Panel>
    </Tabs>
  </UIProvider>)

  const overview = screen.getByRole("tab", { name: "Overview" })
  const activity = screen.getByRole("tab", { name: "Activity" })
  overview.focus()
  await user.keyboard("[ArrowLeft]")

  expect(document.activeElement).toBe(activity)
  expect(activity.getAttribute("aria-selected")).toBe("true")
})

it("raises one selection out of a recessed track of equal columns", async function () {
  const user = userEvent.setup()
  renderTabs(<Tabs defaultValue="overview" color="primary">
    <Tabs.List aria-label="Project views">
      <Tabs.Tab id="overview">Overview</Tabs.Tab>
      <Tabs.Tab id="activity">Activity</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel id="overview">Project overview</Tabs.Panel>
    <Tabs.Panel id="activity">Recent activity</Tabs.Panel>
  </Tabs>)

  const list = screen.getByRole("tablist", { name: "Project views" })
  const selected = screen.getByRole("tab", { name: "Overview" })
  const indicator = await waitFor(() => {
    const found = list.parentElement!.querySelector<HTMLElement>(":scope > [data-selection-indicator]")
    if (found === null) throw new Error("The selection has not been placed")
    return found
  })

  expect(list.style.display).toBe("grid")
  expect(list.style.gridAutoColumns).toBe("minmax(0, 1fr)")
  expect(list.parentElement?.classList.contains("phreshos-surface")).toBe(true)
  expect(indicator?.style.position).toBe("absolute")
  expect(surfaceFill(indicator!)).toBe(defaultAppearance.colors.light.primary)
  expect(selected.style.color).toBe(cssColor(readableColor(defaultAppearance.colors.light.primary, defaultAppearance.colors.light)))
  expect(list.parentElement!.querySelectorAll("[data-selection-indicator]")).toHaveLength(1)

  await user.click(screen.getByRole("tab", { name: "Activity" }))

  // One selection lives in the track and slides; the selected Tab reads on it.
  expect(list.parentElement!.querySelectorAll("[data-selection-indicator]")).toHaveLength(1)
  expect(screen.getByRole("tab", { name: "Activity" }).style.color).toBe(cssColor(readableColor(defaultAppearance.colors.light.primary, defaultAppearance.colors.light)))
})

function renderTabs(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}
