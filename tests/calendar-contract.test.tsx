import { CalendarDate } from "@internationalized/date"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Calendar,
  UIProvider,
  defaultAppearance,
  type CalendarProps
} from "../source/main.js"

afterEach(cleanup)

it("selects one CalendarDate from a locale-aware month grid", async function () {
  const onChange = vi.fn()
  renderCalendar(<Calendar aria-label="Release date" defaultValue={new CalendarDate(2026, 9, 21)} onChange={onChange} />)

  await userEvent.setup().click(screen.getByText("22"))

  expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 9, 22))
  expect(screen.getByRole("heading", { name: /September 2026/i })).toBeTruthy()
})

it("keeps unavailable dates visible but prevents their selection", async function () {
  const onChange = vi.fn()
  renderCalendar(<Calendar aria-label="Release date" defaultValue={new CalendarDate(2026, 9, 21)}
    isDateUnavailable={date => date.day === 22} onChange={onChange} />)

  const unavailable = screen.getByText("22")
  expect(unavailable.getAttribute("data-unavailable")).toBe("true")
  await userEvent.setup().click(unavailable)
  expect(onChange).not.toHaveBeenCalled()
})

it("uses the React UI direction for calendar grid navigation", async function () {
  const user = userEvent.setup()
  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: false }}>
    <Calendar aria-label="Release date" defaultValue={new CalendarDate(2026, 9, 21)} />
  </UIProvider>)

  const selected = screen.getByText("21")
  selected.focus()
  await user.keyboard("[ArrowLeft]")
  expect(document.activeElement?.textContent).toBe("22")
})

it("keeps the public contract date-only and single-month", function () {
  expectTypeOf<CalendarProps["value"]>().toEqualTypeOf<CalendarDate | null | undefined>()
  expectTypeOf<CalendarProps["onChange"]>().toEqualTypeOf<((value: CalendarDate) => void) | undefined>()
  expectTypeOf<"selectionMode">().not.toExtend<keyof CalendarProps>()
  expectTypeOf<"visibleDuration">().not.toExtend<keyof CalendarProps>()
})

it("owns compact calendar proportions without document heading or table typography", function () {
  const { container } = renderCalendar(<Calendar aria-label="Release date" defaultValue={new CalendarDate(2026, 9, 21)} />)

  const calendar = container.querySelector<HTMLElement>(".react-aria-Calendar")
  const heading = container.querySelector<HTMLElement>(".react-aria-CalendarHeading")
  const grid = screen.getByRole("grid")
  const weekday = container.querySelector<HTMLElement>(".react-aria-CalendarHeaderCell")

  expect(calendar?.style.width).toBe("max-content")
  expect(heading?.style.fontSize).toBe("inherit")
  expect(heading?.style.lineHeight).toBe("inherit")
  expect(grid.style.width).toBe("max-content")
  expect(grid.style.margin).toBe("0px")
  expect(weekday?.style.fontSize).toBe("inherit")
  expect(weekday?.style.padding).toBe("0px")
})

function renderCalendar(component: React.ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>)
}
