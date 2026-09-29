import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, expectTypeOf, it } from "vitest"
import { Spinner, UIProvider, defaultAppearance, type SpinnerProps } from "../source/main.js"

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
  const head = large.querySelector<SVGCircleElement>("[data-spinner-part=head]")
  const smallDiameter = Number.parseFloat(small.style.width)
  const mediumDiameter = Number.parseFloat(medium.style.width)
  const largeDiameter = Number.parseFloat(large.style.width)

  expect(mediumDiameter).toBe(defaultAppearance.spacing * 2)
  expect(mediumDiameter - smallDiameter).toBe(largeDiameter - mediumDiameter)
  expect(large.style.width).toBe(large.style.height)
  expect(head?.querySelector("circle")?.getAttribute("stroke")).toBe(defaultAppearance.colors.light.danger)
})

it("draws a comet whose tail follows its head a moment behind, fading, in the surrounding color", function () {
  const { container } = renderSpinner(<Spinner decorative color="currentColor" />, true)
  const head = container.querySelector<HTMLElement>("[data-spinner-part=head]")
  const tail = [...container.querySelectorAll<HTMLElement>("[data-spinner-part=tail]")].reverse()
  // The delay is the last time in the animation, just before it repeats.
  const delay = (piece: HTMLElement) => Number(/(-?[\d.]+)ms infinite/.exec(piece.style.animation)?.[1])

  expect(head?.querySelector("circle")?.getAttribute("stroke")).toBe("currentColor")
  expect(Number(head?.style.opacity)).toBe(1)
  // Each piece makes the same turn a moment after the one ahead, and shows less of itself.
  const pieces = [head!, ...tail]
  expect(pieces.map(delay)).toEqual(pieces.map(delay).sort((a, b) => a - b))
  expect(new Set(pieces.map(delay)).size).toBe(pieces.length)
  expect(pieces.map(piece => Number(piece.style.opacity))).toEqual(pieces.map(piece => Number(piece.style.opacity)).sort((a, b) => b - a))
})

it("rests as its shape without motion", function () {
  const { container } = renderSpinner(<Spinner decorative />, false)
  const pieces = [...container.querySelectorAll<HTMLElement>("[data-spinner-part]")]
  expect(pieces.every(piece => piece.style.animation === "")).toBe(true)
  expect(new Set(pieces.map(piece => piece.style.rotate)).size).toBe(pieces.length)
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
