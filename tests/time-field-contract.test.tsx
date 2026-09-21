import { Time } from "@internationalized/date"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  TimeField,
  UIProvider,
  defaultAppearance,
  type TimeFieldProps
} from "../source/main.js"

afterEach(cleanup)

it("edits a locale-aware Time through independent clock segments", async function () {
  const onChange = vi.fn()
  renderTime(<TimeField label="Start time" hourCycle={24} defaultValue={new Time(9, 30)} onChange={onChange} />)

  const hour = screen.getByRole("spinbutton", { name: /hour/i })
  hour.focus()
  await userEvent.setup().keyboard("{ArrowUp}")

  expect(onChange).toHaveBeenLastCalledWith(new Time(10, 30))
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2)
})

it("adds seconds only when the selected granularity requires them", function () {
  const view = renderTime(<TimeField aria-label="Time" hourCycle={24} defaultValue={new Time(9, 30)} />)
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2)

  view.rerender(wrap(<TimeField aria-label="Time" hourCycle={24} granularity="second" defaultValue={new Time(9, 30, 15)} />))
  expect(screen.getAllByRole("spinbutton")).toHaveLength(3)
  expect(screen.getByRole("spinbutton", { name: /second/i })).toBeTruthy()
})

it("supports controlled nullable times", async function () {
  function ControlledTime() {
    const [value, setValue] = useState<Time | null>(new Time(9, 30))
    return <TimeField label="Time" hourCycle={24} value={value} onChange={setValue} />
  }

  renderTime(<ControlledTime />)
  const minute = screen.getByRole("spinbutton", { name: /minute/i })
  minute.focus()
  await userEvent.setup().keyboard("{ArrowUp}")

  expect(minute.textContent).toBe("31")
})

it("associates feedback and preserves disabled, read-only, required, and invalid states", function () {
  const view = renderTime(<TimeField label="Time" description="Use local time." errorMessage="Choose a valid time."
    disabled required invalid />)

  const group = screen.getByRole("group", { name: "Time" })
  expect(group.getAttribute("data-invalid")).toBe("true")
  expect(group.getAttribute("data-disabled")).toBe("true")
  expect(screen.getByText("Use local time.")).toBeTruthy()
  expect(screen.getByText("Choose a valid time.")).toBeTruthy()

  view.rerender(wrap(<TimeField label="Time" readOnly />))
  expect(screen.getByRole("group", { name: "Time" }).getAttribute("data-readonly")).toBe("true")
})

it("uses one Surface for the field boundary", function () {
  const { container } = renderTime(<TimeField aria-label="Time" color="secondary:base" material="basic" />)

  expect(container.querySelectorAll("[data-material-base]")).toHaveLength(1)
  expect(screen.getByRole("group", { name: "Time" }).parentElement?.style.height).not.toBe("")
})

it("keeps the public contract time-only", function () {
  expectTypeOf<TimeFieldProps["value"]>().toEqualTypeOf<Time | null | undefined>()
  expectTypeOf<TimeFieldProps["onChange"]>().toEqualTypeOf<((value: Time | null) => void) | undefined>()
  expectTypeOf<TimeFieldProps["minValue"]>().toEqualTypeOf<Time | null | undefined>()
  expectTypeOf<TimeFieldProps["granularity"]>().toEqualTypeOf<"hour" | "minute" | "second" | undefined>()
  expectTypeOf<TimeFieldProps["hourCycle"]>().toEqualTypeOf<12 | 24 | undefined>()
  expectTypeOf<"hideTimeZone">().not.toExtend<keyof TimeFieldProps>()
})

function renderTime(component: React.ReactNode) {
  return render(wrap(component))
}

function wrap(component: React.ReactNode) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>
}
