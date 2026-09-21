import { CalendarDate } from "@internationalized/date"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  DateRangePicker,
  UIProvider,
  defaultAppearance,
  type DateRange,
  type DateRangePickerProps
} from "../source/main.js"

afterEach(cleanup)

it("edits and selects one shared date range", async function () {
  const onChange = vi.fn()
  renderPicker(<DateRangePicker label="Trip dates" defaultValue={{
    start: new CalendarDate(2026, 9, 21),
    end: new CalendarDate(2026, 9, 24)
  }} onChange={onChange} />)

  expect(screen.getAllByRole("spinbutton")).toHaveLength(6)
  const inputs = document.querySelectorAll<HTMLElement>(".react-aria-DateInput")
  expect(inputs).toHaveLength(2)
  expect(inputs[0]?.parentElement).toBe(inputs[1]?.parentElement)
  expect(inputs[0]?.parentElement?.style.justifyContent).toBe("flex-start")
  expect(inputs[0]?.style.flex).toBe("0 1 auto")
  await userEvent.setup().click(screen.getByRole("button", { name: /calendar/i }))
  expect(await screen.findByRole("dialog")).toBeTruthy()
  expect(screen.getByRole("grid")).toBeTruthy()
})

it("reports a range selected from the calendar and closes by default", async function () {
  const onChange = vi.fn()
  renderPicker(<DateRangePicker label="Trip dates" defaultValue={{
    start: new CalendarDate(2026, 9, 21),
    end: new CalendarDate(2026, 9, 24)
  }} onChange={onChange} />)
  const user = userEvent.setup()

  await user.click(screen.getByRole("button", { name: /calendar/i }))
  await user.click(await screen.findByText("22"))
  await user.click(screen.getByText("25"))

  expect(onChange).toHaveBeenLastCalledWith({
    start: new CalendarDate(2026, 9, 22),
    end: new CalendarDate(2026, 9, 25)
  })
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
})

it("keeps its public contract date-only", function () {
  expectTypeOf<DateRangePickerProps["value"]>().toEqualTypeOf<DateRange | null | undefined>()
  expectTypeOf<DateRangePickerProps["onChange"]>().toEqualTypeOf<((value: DateRange | null) => void) | undefined>()
  expectTypeOf<DateRangePickerProps["startName"]>().toEqualTypeOf<string | undefined>()
  expectTypeOf<DateRangePickerProps["endName"]>().toEqualTypeOf<string | undefined>()
  expectTypeOf<"granularity">().not.toExtend<keyof DateRangePickerProps>()
})

function renderPicker(component: React.ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>)
}
