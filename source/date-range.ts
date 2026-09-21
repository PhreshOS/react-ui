import type { CalendarDate } from "@internationalized/date"

/** A date-only inclusive range shared by range calendars and range pickers. */
export interface DateRange {
  readonly start: CalendarDate
  readonly end: CalendarDate
}
