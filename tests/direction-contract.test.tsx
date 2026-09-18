import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import { UIProvider, Radio, RadioGroup, Select, Slider, useDirection, useDocumentDirection } from "../source/main.js"

afterEach(function () {
  document.documentElement.removeAttribute("dir")
  document.documentElement.removeAttribute("class")
  document.documentElement.removeAttribute("style")
  cleanup()
  vi.unstubAllGlobals()
})

it("shares one document observer across direction consumers", function () {
  let observers = 0
  let disconnects = 0
  class Observer {
    constructor(_change: MutationCallback) { observers += 1 }
    observe() {}
    disconnect() { disconnects += 1 }
    takeRecords() { return [] }
  }
  vi.stubGlobal("MutationObserver", Observer)

  const rendered = render(<>{Array.from({ length: 20 }, (_, index) => <DirectionProbe key={index} name={`direction-${index}`} />)}</>)
  expect(observers).toBe(1)
  rendered.unmount()
  expect(disconnects).toBe(1)
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

it("introduces no DOM direction boundary when direction is omitted", async function () {
  document.documentElement.dir = "rtl"
  const view = render(<UIProvider>
    <main data-testid="content"><DirectionProbe name="direction" /></main>
  </UIProvider>)

  expect(view.container.firstElementChild).toBe(screen.getByTestId("content"))
  expect(screen.getByTestId("direction").textContent).toBe("rtl")

  document.documentElement.dir = "ltr"
  await waitFor(() => expect(screen.getByTestId("direction").textContent).toBe("ltr"))
})

it("establishes a DOM boundary only for an explicit direction", function () {
  render(<UIProvider direction="rtl">
    <main data-testid="content"><DirectionProbe name="direction" /></main>
  </UIProvider>)

  const boundary = screen.getByTestId("content").parentElement
  expect(boundary?.dir).toBe("rtl")
  expect(boundary?.style.display).toBe("contents")
  expect(screen.getByTestId("content").hasAttribute("dir")).toBe(false)
  expect(screen.getByTestId("direction").textContent).toBe("rtl")
})

it("inherits an omitted direction from the nearest provider", function () {
  document.documentElement.dir = "ltr"
  render(<UIProvider direction="rtl">
    <DirectionProbe name="outer" />
    <UIProvider><DirectionProbe name="inner" /></UIProvider>
  </UIProvider>)

  expect(screen.getByTestId("outer").textContent).toBe("rtl")
  expect(screen.getByTestId("inner").textContent).toBe("rtl")
  expect(screen.getByTestId("outer").closest("[dir=rtl]")).not.toBeNull()
  expect(screen.getByTestId("inner").closest("[dir=rtl]")).toBe(screen.getByTestId("outer").closest("[dir=rtl]"))
})

it("keeps directional keyboard behavior and portalled layout in RTL", async function () {
  const user = userEvent.setup()
  render(<UIProvider direction="rtl">
    <Slider aria-label="Value" minValue={10} maxValue={30} step={5} defaultValue={20} />
    <RadioGroup aria-label="Choice" orientation="horizontal" defaultValue="two">
      <Radio value="one" label="One" />
      <Radio value="two" label="Two" />
      <Radio value="three" label="Three" />
    </RadioGroup>
    <Select aria-label="Choice" options={[{ value: "one", label: "One" }]} />
  </UIProvider>)

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
  return <output data-testid={name}>{useDirection()}</output>
}
