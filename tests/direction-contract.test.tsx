import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it } from "vitest"
import { AppearanceProvider, Radio, RadioGroup, Select, Slider, Surface, useDirection, useDocumentDirection } from "../source/main.js"

afterEach(function () {
  document.documentElement.removeAttribute("dir")
  document.documentElement.removeAttribute("class")
  document.documentElement.removeAttribute("style")
  cleanup()
})

it("reads only the explicit direction of the HTML element", async function () {
  document.documentElement.style.direction = "rtl"
  document.documentElement.className = "rtl"
  render(<DocumentDirectionProbe />)
  expect(screen.getByTestId("document-direction").textContent).toBe("ltr")

  act(() => document.documentElement.dir = "rtl")
  await waitFor(() => expect(screen.getByTestId("document-direction").textContent).toBe("rtl"))

  act(() => document.documentElement.dir = "auto")
  await waitFor(() => expect(screen.getByTestId("document-direction").textContent).toBe("ltr"))
})

it("reacts when the HTML direction changes", async function () {
  render(<DocumentDirectionProbe />)
  expect(screen.getByTestId("document-direction").textContent).toBe("ltr")

  document.documentElement.dir = "rtl"
  await waitFor(() => expect(screen.getByTestId("document-direction").textContent).toBe("rtl"))
})

it("lets AppearanceProvider inherit and override direction", async function () {
  document.documentElement.dir = "rtl"
  render(<AppearanceProvider>
    <DirectionProbe name="inherited" />
    <AppearanceProvider direction="ltr"><DirectionProbe name="overridden" /></AppearanceProvider>
  </AppearanceProvider>)

  expect(screen.getByTestId("inherited").textContent).toBe("rtl")
  expect(screen.getByTestId("inherited").getAttribute("dir")).toBe("rtl")
  expect(screen.getByTestId("overridden").textContent).toBe("ltr")
  expect(screen.getByTestId("overridden").getAttribute("dir")).toBe("ltr")

  document.documentElement.dir = "ltr"
  await waitFor(() => expect(screen.getByTestId("inherited").textContent).toBe("ltr"))
  expect(screen.getByTestId("overridden").textContent).toBe("ltr")
})

it("keeps directional keyboard behavior and portalled layout in RTL", async function () {
  const user = userEvent.setup()
  render(<AppearanceProvider direction="rtl">
    <Slider aria-label="Value" minValue={10} maxValue={30} step={5} defaultValue={20} />
    <RadioGroup aria-label="Choice" orientation="horizontal" defaultValue="two">
      <Radio value="one" label="One" />
      <Radio value="two" label="Two" />
      <Radio value="three" label="Three" />
    </RadioGroup>
    <Select aria-label="Choice" options={[{ value: "one", label: "One" }]} />
  </AppearanceProvider>)

  const slider = screen.getByRole("slider") as HTMLInputElement
  slider.focus()
  await user.keyboard("[ArrowRight]")
  expect(slider.value).toBe("15")

  const second = screen.getByRole("radio", { name: "Two" }) as HTMLInputElement
  second.focus()
  await user.keyboard("[ArrowRight]")
  expect(screen.getByRole("radio", { name: "One" }).getAttribute("aria-checked")).toBe("true")

  await user.click(screen.getByRole("button"))
  expect(screen.getByRole("listbox").closest("[dir=rtl]")).not.toBeNull()
})

function DocumentDirectionProbe() {
  return <output data-testid="document-direction">{useDocumentDirection()}</output>
}

function DirectionProbe({ name }: Readonly<{ name: string }>) {
  return <Surface as="output" data-testid={name} material={false} shadow={false}>{useDirection()}</Surface>
}
