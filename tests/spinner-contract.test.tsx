import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, expectTypeOf, it } from "vitest"
import { Spinner, UIProvider, defaultAppearance, timing, type SpinnerProps } from "../source/main.js"

afterEach(cleanup)

it("announces named indeterminate progress without a numeric value", function () {
  renderSpinner(<Spinner label="Connecting" />)

  const spinner = screen.getByRole("progressbar", { name: "Connecting" })

  expect(spinner.getAttribute("aria-valuenow")).toBeNull()
  expect(spinner.querySelector("[data-spinner-indicator]")).toBeTruthy()
})

it("is absent from the accessibility tree when explicitly decorative", function () {
  const { container } = renderSpinner(<Spinner decorative />)
  const spinner = container.querySelector<HTMLElement>("[aria-hidden=true]")

  expect(spinner).toBeTruthy()
  expect(screen.queryByRole("progressbar")).toBeNull()
})

it("uses the shared size and color contracts", function () {
  renderSpinner(<>
    <Spinner label="Small" size="small" />
    <Spinner label="Medium" size="medium" />
    <Spinner label="Large" size="large" color="danger" />
  </>)

  const small = screen.getByRole("progressbar", { name: "Small" })
  const medium = screen.getByRole("progressbar", { name: "Medium" })
  const large = screen.getByRole("progressbar", { name: "Large" })
  const fill = large.querySelector<SVGCircleElement>("[data-spinner-fill]")
  const smallDiameter = Number.parseFloat(small.style.width)
  const mediumDiameter = Number.parseFloat(medium.style.width)
  const largeDiameter = Number.parseFloat(large.style.width)

  expect(mediumDiameter).toBe(defaultAppearance.spacing * 2)
  expect(mediumDiameter - smallDiameter).toBe(largeDiameter - mediumDiameter)
  expect(large.style.width).toBe(large.style.height)
  expect(fill?.getAttribute("stroke")).toBe(defaultAppearance.colors.light.danger)
})

it("is a ring missing a quarter, following the surrounding current color when asked", function () {
  const { container } = renderSpinner(<Spinner decorative color="currentColor" />)
  const fill = container.querySelector("[data-spinner-fill]")

  expect(fill?.getAttribute("stroke")).toBe("currentColor")
  expect(fill?.getAttribute("stroke-dasharray")).toBe("75 25")
  expect(container.querySelector("[data-spinner-track]")).toBeNull()
})

it("turns once every repeating motion loop", function () {
  const { container } = renderSpinner(<Spinner label="Loading" />, true)
  const duration = Math.max(900, timing("change").duration * 8)

  expect(container.querySelector<SVGElement>("[data-spinner-indicator]")?.style.animation).toBe(`phreshos-ui-spin ${duration}ms linear infinite`)
})

it("rotates continuously only while animations are enabled", function () {
  const view = renderSpinner(<Spinner label="Loading" />, true)
  expect(view.container.querySelector<SVGElement>("[data-spinner-indicator]")?.style.animation).toContain("phreshos-ui-spin")
  view.unmount()
  const still = renderSpinner(<Spinner label="Loading" />, false)
  expect(still.container.querySelector<SVGElement>("[data-spinner-indicator]")?.style.animation).toBe("")
})

it("requires an accessible label unless the indicator is decorative", function () {
  expectTypeOf<SpinnerProps>().toMatchTypeOf<{ color?: string }>()

  const named: SpinnerProps = { label: "Loading" }
  const decorative: SpinnerProps = { decorative: true }

  expect(named.label).toBe("Loading")
  expect(decorative.decorative).toBe(true)

  // @ts-expect-error An unnamed non-decorative Spinner has no accessible meaning.
  const unnamed: SpinnerProps = {}
  void unnamed
})

function renderSpinner(component: React.ReactNode, animations = false) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations }}>
    {component}
  </UIProvider>)
}
