import { CalendarDate } from "@internationalized/date"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  RangeCalendar,
  UIProvider,
  defaultAppearance,
  type DateRange,
  type RangeCalendarProps
} from "../source/main.js"
import { colorLightness } from "../source/color.js"

afterEach(cleanup)

it("selects one inclusive CalendarDate range", async function () {
  const onChange = vi.fn()
  renderRange(<RangeCalendar aria-label="Trip dates" defaultFocusedValue={new CalendarDate(2026, 9, 21)} onChange={onChange} />)
  const user = userEvent.setup()

  await user.click(screen.getByText("21"))
  await user.click(screen.getByText("24"))

  expect(onChange).toHaveBeenLastCalledWith({
    start: new CalendarDate(2026, 9, 21),
    end: new CalendarDate(2026, 9, 24)
  })
})

it("shares one date-only range contract with range pickers", function () {
  expectTypeOf<RangeCalendarProps["value"]>().toEqualTypeOf<DateRange | null | undefined>()
  expectTypeOf<RangeCalendarProps["onChange"]>().toEqualTypeOf<((value: DateRange) => void) | undefined>()
  expectTypeOf<"visibleDuration">().not.toExtend<keyof RangeCalendarProps>()
})

it("uses a lighter derived color between the two selected endpoints", function () {
  renderRange(<RangeCalendar aria-label="Trip dates" defaultValue={{
    start: new CalendarDate(2026, 9, 21),
    end: new CalendarDate(2026, 9, 24)
  }} />)

  const start = screen.getByText("21")
  const interior = screen.getByText("22")
  const end = screen.getByText("24")

  expect(start.style.background).toBe(end.style.background)
  expect(colorLightness(interior.style.background)).toBeGreaterThan(colorLightness(start.style.background))
})

function renderRange(component: React.ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>)
}
