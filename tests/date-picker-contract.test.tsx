import { CalendarDate } from "@internationalized/date"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  DatePicker,
  UIProvider,
  defaultAppearance,
  type DatePickerProps
} from "../source/main.js"
import { cssColor as normalized, hairline, paintDeclarations } from "./support/paint.js"

afterEach(cleanup)

it("opens a calendar from the segmented date field", async function () {
  renderPicker(<DatePicker label="Due date" defaultValue={new CalendarDate(2026, 9, 21)} />)

  await userEvent.setup().click(screen.getByRole("button", { name: /calendar/i }))

  expect(await screen.findByRole("dialog")).toBeTruthy()
  expect(screen.getByRole("grid")).toBeTruthy()
  expect(screen.getByRole("heading", { name: /September 2026/i })).toBeTruthy()
  expect(document.querySelector<HTMLElement>(".react-aria-Calendar")?.style.fontSize).toBe("0.8125em")
})

it("reports a CalendarDate selected from the calendar", async function () {
  const onChange = vi.fn()
  renderPicker(<DatePicker label="Due date" defaultValue={new CalendarDate(2026, 9, 21)} onChange={onChange} />)
  const user = userEvent.setup()

  await user.click(screen.getByRole("button", { name: /calendar/i }))
  await user.click(await screen.findByText("22"))

  expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 9, 22))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
})

it("does not reactivate the field when pointer dismissal restores trigger focus", async function () {
  const { container } = renderPicker(<DatePicker label="Date" defaultValue={new CalendarDate(2026, 9, 21)} />)
  const user = userEvent.setup()
  const field = screen.getByRole("group", { name: "Date" })

  await user.click(screen.getByRole("button", { name: /calendar/i }))
  expect(normalized(hairline(paintDeclarations(field)["box-shadow"]))).toBe(normalized(defaultAppearance.colors.light.primary))

  await user.click(screen.getByTestId("underlay"))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  expect(container.contains(field)).toBe(true)
  expect(normalized(hairline(paintDeclarations(field)["box-shadow"]))).not.toBe(normalized(defaultAppearance.colors.light.primary))
})

it("uses the same visible Surface and segmented value contract as DateField", function () {
  const { container } = renderPicker(<DatePicker aria-label="Date" color="secondary" material="basic" />)

  expect(container.querySelectorAll(".phreshos-surface:not(button)")).toHaveLength(1)
  expect(screen.getAllByRole("spinbutton")).toHaveLength(3)
})

it("sizes the calendar trigger inside the field height", function () {
  renderPicker(<DatePicker label="Date" />)

  const trigger = screen.getByRole("button", { name: /calendar/i })
  const field = screen.getByRole("group", { name: "Date" })
  expect(Number.parseFloat(trigger.style.height)).toBeLessThan(Number.parseFloat(field.style.height))
  expect(trigger.style.width).toBe(trigger.style.height)
})

it("keeps the public contract date-only while retaining controlled open state", function () {
  expectTypeOf<DatePickerProps["value"]>().toEqualTypeOf<CalendarDate | null | undefined>()
  expectTypeOf<DatePickerProps["onChange"]>().toEqualTypeOf<((value: CalendarDate | null) => void) | undefined>()
  expectTypeOf<DatePickerProps["open"]>().toEqualTypeOf<boolean | undefined>()
  expectTypeOf<DatePickerProps["onOpenChange"]>().toEqualTypeOf<((open: boolean) => void) | undefined>()
  expectTypeOf<"isOpen">().not.toExtend<keyof DatePickerProps>()
  expectTypeOf<"granularity">().not.toExtend<keyof DatePickerProps>()
})

function renderPicker(component: React.ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>)
}
