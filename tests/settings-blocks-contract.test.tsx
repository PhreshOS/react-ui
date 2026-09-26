import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, it, vi } from "vitest"
import {
  Alert,
  AppLayout,
  Button,
  DropZone,
  Fieldset,
  FileTrigger,
  NumberField,
  SegmentedControl,
  UIProvider,
  defaultAppearance
} from "../source/main.js"

afterEach(cleanup)

function renderUI(children: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>{children}</UIProvider>)
}

it("steps a number within its range and reports an emptied field as null", async function () {
  const onChange = vi.fn()
  renderUI(<NumberField label="Spacing" defaultValue={12} minValue={6} maxValue={13} onChange={onChange} />)
  const user = userEvent.setup()

  await user.click(screen.getByRole("button", { name: /increase/i }))
  expect(onChange).toHaveBeenLastCalledWith(13)
  await user.click(screen.getByRole("button", { name: /increase/i }))
  expect(onChange).toHaveBeenCalledTimes(1)

  const input = screen.getByRole("textbox", { name: "Spacing" })
  await user.clear(input)
  await user.tab()
  expect(onChange).toHaveBeenLastCalledWith(null)
})

it("chooses one visible option as a string value on the Tabs track", async function () {
  const onChange = vi.fn()
  renderUI(<SegmentedControl label="Theme" defaultValue="system" onChange={onChange}>
    <SegmentedControl.Item id="system">System</SegmentedControl.Item>
    <SegmentedControl.Item id="light">Light</SegmentedControl.Item>
    <SegmentedControl.Item id="dark">Dark</SegmentedControl.Item>
  </SegmentedControl>)

  const group = screen.getByRole("radiogroup", { name: "Theme" })
  expect(group.hasAttribute("data-selection-list")).toBe(true)
  await waitFor(() => expect(group.parentElement!.querySelector(":scope > [data-selection-indicator]")).not.toBeNull())
  await userEvent.setup().click(screen.getByRole("radio", { name: "Dark" }))
  expect(onChange).toHaveBeenLastCalledWith("dark")
  // A selection cannot be emptied: pressing the chosen option keeps it.
  await userEvent.setup().click(screen.getByRole("radio", { name: "Dark" }))
  expect(screen.getByRole("radio", { name: "Dark" }).getAttribute("aria-checked")).toBe("true")
})

it("announces urgent alerts and leads every alert with the icon of its meaning", function () {
  renderUI(<><Alert color="danger" title="Could not save">The System refused the change.</Alert><Alert title="Saved" icon={false}>Done.</Alert></>)
  expect(screen.getByRole("alert").textContent).toContain("Could not save")
  expect(screen.getByRole("alert").querySelector("svg")).not.toBeNull()
  expect(screen.getByRole("status").querySelector("svg")).toBeNull()
})

it("opens the file chooser from the control it wraps and reports files as an array", async function () {
  const onSelect = vi.fn()
  const { container } = renderUI(<FileTrigger accept={["image/*"]} onSelect={onSelect}><Button>Choose</Button></FileTrigger>)
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
  expect(input.accept).toBe("image/*")
  await userEvent.setup().upload(input, new File(["a"], "wallpaper.png", { type: "image/png" }))
  expect(onSelect.mock.lastCall![0][0].name).toBe("wallpaper.png")
})

it("recesses a drop area and names it", function () {
  renderUI(<DropZone aria-label="Wallpaper">Drop an image</DropZone>)
  expect(screen.getByText("Drop an image").closest(".phreshos-surface")).not.toBeNull()
})

it("titles a group of fields as one fieldset", function () {
  renderUI(<Fieldset title="Layout" description="Shared spacing and corners."><NumberField label="Radius" defaultValue={10} /></Fieldset>)
  expect(screen.getByRole("group", { name: "Layout" })).toBeTruthy()
})

it("frames a program in named regions with a header as tall as a Window header", function () {
  renderUI(<AppLayout>
    <AppLayout.Sidebar aria-label="Sections">Navigation</AppLayout.Sidebar>
    <AppLayout.Header>Appearance</AppLayout.Header>
    <AppLayout.Content>Page</AppLayout.Content>
  </AppLayout>)
  expect(screen.getByRole("complementary", { name: "Sections" })).toBeTruthy()
  expect(screen.getByRole("banner").style.minHeight).toBe("40px")
  expect(screen.getByRole("main").textContent).toBe("Page")
})
