import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { Drawer, UIProvider, defaultAppearance } from "../source/main.js"

afterEach(cleanup)

it("shows its title and content only while open", function () {
  const view = renderDrawer(true)
  expect(screen.getByText("Places")).toBeTruthy()
  expect(screen.getByRole("navigation")).toBeTruthy()
  view.rerender(drawer(false))
  expect(screen.queryByRole("navigation")).toBeNull()
})

it("closes for a press outside and for Escape, which stops there", function () {
  const onClose = vi.fn()
  const outer = vi.fn()
  addEventListener("keydown", outer)
  const { container } = renderDrawer(true, onClose)

  fireEvent.pointerDown(container.querySelector("[data-drawer-scrim]")!)
  fireEvent.keyDown(document.body, { key: "Escape" })

  expect(onClose).toHaveBeenCalledTimes(2)
  expect(outer).not.toHaveBeenCalled()
  removeEventListener("keydown", outer)
})

it("keeps its surface still and scrolls what it holds inside a ScrollArea", function () {
  const { container } = renderDrawer(true)
  const surface = container.querySelector<HTMLElement>("[data-drawer]")!
  expect(surface.style.overflow).toBe("hidden")
  expect(surface.querySelector("[data-phreshos-scroll-area] nav")).toBeTruthy()
})

it("slides only while animations are on", function () {
  const still = renderDrawer(true)
  expect(still.container.querySelector("[data-drawer]")?.getAttribute("data-state")).toBeNull()
  still.unmount()
  const moving = renderDrawer(true, () => {}, true)
  expect(moving.container.querySelector("[data-drawer]")?.getAttribute("data-state")).toBe("opening")
})

function drawer(open: boolean, onClose = () => {}, animations = false) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations }}>
    <Drawer open={open} onClose={onClose} title="Places"><nav aria-label="Places">Home</nav></Drawer>
  </UIProvider>
}

function renderDrawer(open: boolean, onClose = () => {}, animations = false) {
  return render(drawer(open, onClose, animations))
}
