import { cleanup, render, screen } from "@testing-library/react"
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
import { solidColors } from "../source/color.js"

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

it("uses stable equal tracks and one Surface selection indicator", async function () {
  const user = userEvent.setup()
  renderTabs(<Tabs defaultValue="overview" color="primary:base">
    <Tabs.List aria-label="Project views">
      <Tabs.Tab id="overview">Overview</Tabs.Tab>
      <Tabs.Tab id="activity">Activity</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel id="overview">Project overview</Tabs.Panel>
    <Tabs.Panel id="activity">Recent activity</Tabs.Panel>
  </Tabs>)

  const list = screen.getByRole("tablist", { name: "Project views" })
  const selected = screen.getByRole("tab", { name: "Overview" })
  const indicator = selected.querySelector<HTMLElement>("[data-tabs-indicator]")
  const paints = solidColors(
    defaultAppearance.colors.light.primary,
    defaultAppearance.colors.light.background,
    defaultAppearance.colors.light.foreground
  )

  expect(list.style.display).toBe("grid")
  expect(list.style.gridAutoColumns).toBe("minmax(0, 1fr)")
  expect(selected.style.width).toBe("100%")
  expect(indicator?.style.inset).toBe("0px")
  expect(indicator?.querySelector("[data-material]")).not.toBeNull()
  expect(baseColor(indicator)).toBe(css(paints.hover.background))
  expect(list.querySelectorAll("[data-tabs-indicator]")).toHaveLength(1)

  await user.click(screen.getByRole("tab", { name: "Activity" }))

  expect(screen.getByRole("tab", { name: "Activity" }).querySelector("[data-tabs-indicator]")).not.toBeNull()
  expect(list.querySelectorAll("[data-tabs-indicator]")).toHaveLength(1)
})

function renderTabs(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}

function css(value: string) {
  const element = document.createElement("div")
  element.style.background = value
  return element.style.background
}

function baseColor(indicator: HTMLElement | null) {
  return indicator?.querySelector<HTMLElement>("[data-material-base]")?.style.background ?? ""
}
