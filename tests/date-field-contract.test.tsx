import { CalendarDate } from "@internationalized/date"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  DateField,
  UIProvider,
  defaultAppearance,
  type DateFieldProps
} from "../source/main.js"
import { lifted, paintDeclarations } from "./support/paint.js"

afterEach(cleanup)

it("edits a locale-aware CalendarDate through independent segments", async function () {
  const onChange = vi.fn()
  renderDate(<DateField label="Birthday" defaultValue={new CalendarDate(2026, 9, 21)} onChange={onChange} />)

  const month = screen.getByRole("spinbutton", { name: /month/i })
  month.focus()
  await userEvent.setup().keyboard("{ArrowUp}")

  expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 10, 21))
  expect(screen.getAllByRole("spinbutton")).toHaveLength(3)
})

it("uses the React UI direction without changing the date locale", async function () {
  const user = userEvent.setup()
  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: false }}>
    <DateField label="Birthday" defaultValue={new CalendarDate(2026, 9, 21)} />
  </UIProvider>)

  const month = screen.getByRole("spinbutton", { name: /^month,/i })
  const day = screen.getByRole("spinbutton", { name: /^day,/i })
  month.focus()
  await user.keyboard("[ArrowLeft]")

  expect(document.activeElement).toBe(day)
  expect(screen.getAllByRole("spinbutton").map(segment => segment.getAttribute("data-type"))).toEqual(["month", "day", "year"])
})

it("supports controlled nullable dates", async function () {
  function ControlledDate() {
    const [value, setValue] = useState<CalendarDate | null>(new CalendarDate(2026, 9, 21))
    return <DateField label="Date" value={value} onChange={setValue} />
  }

  renderDate(<ControlledDate />)
  const day = screen.getByRole("spinbutton", { name: /day/i })
  day.focus()
  await userEvent.setup().keyboard("{ArrowUp}")

  expect(day.textContent).toBe("22")
})

it("associates feedback and preserves disabled, read-only, required, and invalid states", function () {
  const view = renderDate(<DateField label="Date" description="Use your local date." errorMessage="Choose a valid date."
    disabled required invalid />)

  const group = screen.getByRole("group", { name: "Date" })
  expect(group.getAttribute("data-invalid")).toBe("true")
  expect(group.getAttribute("data-disabled")).toBe("true")
  expect(screen.getByText("Use your local date.")).toBeTruthy()
  expect(screen.getByText("Choose a valid date.")).toBeTruthy()

  view.rerender(wrap(<DateField label="Date" readOnly />))
  expect(screen.getByRole("group", { name: "Date" }).getAttribute("data-readonly")).toBe("true")
})

it("holds its segments in one recessed Surface", function () {
  const { container } = renderDate(<DateField aria-label="Date" color="secondary" material="basic" />)

  const wells = container.querySelectorAll<HTMLElement>(".phreshos-surface")
  expect(wells).toHaveLength(1)
  expect(wells[0]!.style.height).not.toBe("")
  expect(lifted(paintDeclarations(wells[0]!)["box-shadow"])).toBe(false)
})

it("keeps the public contract date-only", function () {
  expectTypeOf<DateFieldProps["value"]>().toEqualTypeOf<CalendarDate | null | undefined>()
  expectTypeOf<DateFieldProps["onChange"]>().toEqualTypeOf<((value: CalendarDate | null) => void) | undefined>()
  expectTypeOf<DateFieldProps["minValue"]>().toEqualTypeOf<CalendarDate | null | undefined>()
  expectTypeOf<"granularity">().not.toExtend<keyof DateFieldProps>()
  expectTypeOf<"hourCycle">().not.toExtend<keyof DateFieldProps>()
})

function renderDate(component: React.ReactNode) {
  return render(wrap(component))
}

function wrap(component: React.ReactNode) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>
}
