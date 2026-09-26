import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { RangeCalendar as AriaRangeCalendar } from "react-aria-components"
import type { RangeCalendarProps as AriaRangeCalendarProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { CalendarLayout, calendarRootStyle } from "./calendar-layout.js"
import { useControlMetrics, type ControlOverrides, type ControlProps } from "./control/control.js"
import type { DateRange } from "./date-range.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import { dimmedClass } from "./surface/surface.js"

type RangeCalendarOverrides = ControlOverrides
  | "children"
  | "isReadOnly"
  | "isInvalid"
  | "value"
  | "defaultValue"
  | "onChange"
  | "minValue"
  | "maxValue"
  | "isDateUnavailable"
  | "visibleDuration"
  | "createCalendar"
  | "errorMessage"
  | "validationState"
  | "allowsNonContiguousRanges"

export interface RangeCalendarProps
  extends Omit<AriaRangeCalendarProps<CalendarDate>, RangeCalendarOverrides>,
    ControlProps,
    RadiusProps {
  readonly value?: DateRange | null
  readonly defaultValue?: DateRange | null
  readonly onChange?: (value: DateRange) => void
  readonly minValue?: CalendarDate | null
  readonly maxValue?: CalendarDate | null
  readonly isDateUnavailable?: (date: CalendarDate, anchorDate: CalendarDate | null) => boolean
  /** Whether a range may include unavailable dates. */
  readonly nonContiguous?: boolean
  readonly readOnly?: boolean
  readonly invalid?: boolean
}

/** A locale-aware month view for selecting an inclusive date range. */
export const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(function RangeCalendar({
  disabled,
  readOnly,
  invalid,
  size,
  color,
  radius,
  style,
  className,
  isDateUnavailable,
  nonContiguous,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaRangeCalendar
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    allowsNonContiguousRanges={nonContiguous}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null
      ? undefined
      : (date, anchorDate) => isDateUnavailable(date as CalendarDate, anchorDate)}
    style={calendarRootStyle(metrics, style)}
  >
    <CalendarLayout color={color ?? "primary"} range size={size} metrics={metrics} />
  </AriaRangeCalendar></AriaDirectionBoundary>
})
