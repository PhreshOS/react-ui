import { act, cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import { Avatar, Breadcrumbs, Meter, SearchField, Skeleton, TagGroup, ToastRegion, UIProvider, defaultAppearance, toast } from "../source/main.js"
import { cssColor } from "./support/paint.js"

afterEach(cleanup)

const colors = defaultAppearance.colors.light

function renderLight(node: ReactNode, animations = false) {
  return render(<UIProvider preferences={{ theme: "light", animations }}>{node}</UIProvider>)
}

it("reads a Meter's level and turns warning, then danger, at its thresholds", function () {
  const fill = (value: number) => {
    cleanup()
    renderLight(<Meter label="Disk" value={value} warning={0.7} danger={0.9} />)
    return screen.getByRole("meter", { name: "Disk" }).querySelector<HTMLElement>("[data-meter-fill]")!.style.background
  }
  expect(fill(40)).toBe(cssColor(colors.info))
  expect(fill(75)).toBe(cssColor(colors.warning))
  expect(fill(95)).toBe(cssColor(colors.danger))
})

it("clears a SearchField with its button and submits on Enter", async function () {
  const onSubmit = vi.fn()
  const user = userEvent.setup()
  renderLight(<SearchField label="Search" onSubmit={onSubmit} />)
  const input = screen.getByRole("searchbox", { name: "Search" })
  await user.type(input, "logs{Enter}")
  expect(onSubmit).toHaveBeenCalledWith("logs")
  await user.click(screen.getByRole("button", { name: "Clear search" }))
  expect((input as HTMLInputElement).value).toBe("")
})

it("links every ancestor in Breadcrumbs and marks the last entry current", function () {
  renderLight(<Breadcrumbs>
    <Breadcrumbs.Item href="/docs">Docs</Breadcrumbs.Item>
    <Breadcrumbs.Item href="/docs/system">System</Breadcrumbs.Item>
    <Breadcrumbs.Item>Permissions</Breadcrumbs.Item>
  </Breadcrumbs>)
  expect(screen.getByRole("link", { name: "Docs" }).getAttribute("href")).toBe("/docs")
  expect(screen.getByText("Permissions").getAttribute("aria-current")).toBe("page")
})

it("names an Avatar, shows initials, and keeps one color per name", function () {
  renderLight(<><Avatar name="Ada Lovelace" /><Avatar name="Ada Lovelace" /></>)
  const [first, second] = screen.getAllByRole("img", { name: "Ada Lovelace" })
  expect(first!.textContent).toBe("AL")
  expect(first!.className).toBe(second!.className)
})

it("removes Tags through their remove buttons", async function () {
  const onRemove = vi.fn()
  renderLight(<TagGroup label="Filters" onRemove={onRemove}>
    <TagGroup.Tag id="running">Running</TagGroup.Tag>
    <TagGroup.Tag id="stopped">Stopped</TagGroup.Tag>
  </TagGroup>)
  const tag = screen.getByRole("row", { name: "Running" })
  // React Aria names the button after its Tag: "Remove Running".
  await userEvent.setup().click(within(tag).getByRole("button", { name: "Remove Running" }))
  expect([...onRemove.mock.calls[0]![0]]).toEqual(["running"])
})

it("pulses a Skeleton only while animations are on, and ends a paragraph short", function () {
  const { container } = renderLight(<Skeleton lines={3} />)
  const lines = container.querySelectorAll<HTMLElement>("span[aria-hidden] > span")
  expect(lines).toHaveLength(3)
  expect(lines[0]!.style.animation).toBe("")
  expect(lines[2]!.style.width).not.toBe("100%")
  cleanup()
  const animated = renderLight(<Skeleton />, true)
  expect(animated.container.querySelector<HTMLElement>("span[aria-hidden]")!.style.animation).toContain("phreshos-ui-pulse")
})

it("shows a Toast in the region and closes it", async function () {
  renderLight(<ToastRegion />)
  let key = ""
  act(() => { key = toast.show({ title: "Saved", color: "success" }) })
  expect(await screen.findByText("Saved")).toBeTruthy()
  act(() => toast.close(key))
  await vi.waitFor(() => expect(screen.queryByText("Saved")).toBeNull())
})
