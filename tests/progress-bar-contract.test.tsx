import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, expectTypeOf, it } from "vitest"
import { ProgressBar, UIProvider, defaultAppearance, type ProgressBarProps } from "../source/main.js"
import { resolveColorLevel } from "../source/color.js"

afterEach(cleanup)

it("exposes the determinate value and renders its percentage", function () {
  renderProgress(<ProgressBar label="Upload" value={30} />)

  const progress = screen.getByRole("progressbar", { name: "Upload" })
  const fill = progress.querySelector<HTMLElement>("[data-progress-fill]")

  expect(progress.getAttribute("aria-valuemin")).toBe("0")
  expect(progress.getAttribute("aria-valuemax")).toBe("100")
  expect(progress.getAttribute("aria-valuenow")).toBe("30")
  expect(screen.getByText("30%")).toBeTruthy()
  expect(fill?.style.width).toBe("30%")
})

it("supports bounded values, formatting, and an explicit value label", function () {
  renderProgress(<ProgressBar aria-label="Files" value={3} minValue={1} maxValue={5} valueLabel="3 of 5" />)

  const progress = screen.getByRole("progressbar", { name: "Files" })
  expect(progress.getAttribute("aria-valuenow")).toBe("3")
  expect(progress.getAttribute("aria-valuetext")).toBe("3 of 5")
  expect(screen.getByText("3 of 5")).toBeTruthy()
  expect(progress.querySelector<HTMLElement>("[data-progress-fill]")?.style.width).toBe("50%")
})

it("represents indeterminate activity without asserting a value", function () {
  renderProgress(<ProgressBar aria-label="Connecting" indeterminate />)

  const progress = screen.getByRole("progressbar", { name: "Connecting" })
  expect(progress.getAttribute("aria-valuenow")).toBeNull()
  expect(progress.querySelector<HTMLElement>("[data-progress-fill]")?.style.width).toBe("40%")
})

it("uses the shared size and color contracts", function () {
  renderProgress(<ProgressBar aria-label="Deploy" value={50} size="large" color="danger:base" />)

  const progress = screen.getByRole("progressbar", { name: "Deploy" })
  const track = progress.querySelector<HTMLElement>("[data-progress-track]")
  const fill = progress.querySelector<HTMLElement>("[data-progress-fill]")

  expect(progress.style.fontSize).toBe("0.875em")
  expect(track?.style.height).toBe("9px")
  expect(fill?.style.background).not.toBe("")
})

it("uses the neutral default because progress has no inherent semantic color", function () {
  renderProgress(<ProgressBar aria-label="Deploy" value={50} />)

  const fill = screen.getByRole("progressbar", { name: "Deploy" })
    .querySelector<HTMLElement>("[data-progress-fill]")

  expect(fill?.style.background).toBe(css(resolveColorLevel(defaultAppearance.colors.light.default, "base")))
})

it("keeps the public operation values statically typed", function () {
  expectTypeOf<ProgressBarProps["value"]>().toEqualTypeOf<number | undefined>()
  expectTypeOf<ProgressBarProps["indeterminate"]>().toEqualTypeOf<boolean | undefined>()
})

function renderProgress(component: React.ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>)
}

function css(value: string) {
  const element = document.createElement("div")
  element.style.background = value
  return element.style.background
}
