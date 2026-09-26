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
import { luminance } from "../source/foundation/color.js"

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
  expect(luminance(interior.style.background)!).toBeGreaterThan(luminance(start.style.background)!)
})

it("keeps showing its range and disables its month buttons while disabled", function () {
  const range = { start: new CalendarDate(2026, 9, 21), end: new CalendarDate(2026, 9, 24) }
  renderRange(<RangeCalendar aria-label="Trip dates" disabled defaultValue={range} />)
  const enabled = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    <RangeCalendar aria-label="Enabled dates" defaultValue={range} />
  </UIProvider>)

  const [start, enabledStart] = screen.getAllByText("21")
  const [interior, enabledInterior] = screen.getAllByText("22")
  expect(start!.style.background).toBe(enabledStart!.style.background)
  expect(interior!.style.background).toBe(enabledInterior!.style.background)
  expect(screen.getAllByRole("button", { name: "Next month" })[0]).toHaveProperty("disabled", true)
  enabled.unmount()
})

it("fades only the disabled calendar, not its days again", function () {
  renderRange(<RangeCalendar aria-label="Trip dates" disabled defaultFocusedValue={new CalendarDate(2026, 9, 21)} />)

  const root = screen.getByText("21").closest(".phreshos-dimmed")!.parentElement!.closest(".phreshos-dimmed")
  const day = screen.getByText("21")
  expect(root?.contains(day)).toBe(true)
  expect(day.style.opacity).toBe("")
  const rule = [...document.querySelectorAll("style")].map(style => style.textContent).join("")
  expect(rule).toContain(":where(.phreshos-dimmed:not(.phreshos-dimmed .phreshos-dimmed))")
})

function renderRange(component: React.ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>)
}
