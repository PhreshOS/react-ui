import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { RangeCalendar as AriaRangeCalendar } from "react-aria-components"
import type { RangeCalendarProps as AriaRangeCalendarProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./aria-direction.js"
import { CalendarLayout, calendarRootStyle } from "./calendar-layout.js"
import {
  useControlTheme,
  type ControlOverrides,
  type ControlProps
} from "./control.js"
import type { DateRange } from "./date-range.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { RadiusProps } from "./radius.js"

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
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color, radius })
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaRangeCalendar
    {...properties}
    ref={ref}
    dir={direction}
    className={className}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null
      ? undefined
      : (date, anchorDate) => isDateUnavailable(date as CalendarDate, anchorDate)}
    style={calendarRootStyle(theme, disabled, style)}
  >
    <CalendarLayout color={color} range size={size} theme={theme} />
  </AriaRangeCalendar></AriaDirectionBoundary>
})
