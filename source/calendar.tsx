import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { Calendar as AriaCalendar } from "react-aria-components"
import type { CalendarProps as AriaCalendarProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./aria-direction.js"
import { CalendarLayout, calendarRootStyle } from "./calendar-layout.js"
import {
  useControlTheme,
  type ControlOverrides,
  type ControlProps
} from "./control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { RadiusProps } from "./radius.js"

type CalendarOverrides = ControlOverrides
  | "children"
  | "isReadOnly"
  | "isInvalid"
  | "value"
  | "defaultValue"
  | "onChange"
  | "minValue"
  | "maxValue"
  | "isDateUnavailable"
  | "selectionMode"
  | "visibleDuration"
  | "createCalendar"
  | "errorMessage"
  | "validationState"

export interface CalendarProps
  extends Omit<AriaCalendarProps<CalendarDate>, CalendarOverrides>,
    ControlProps,
    RadiusProps {
  readonly value?: CalendarDate | null
  readonly defaultValue?: CalendarDate | null
  readonly onChange?: (value: CalendarDate) => void
  readonly minValue?: CalendarDate | null
  readonly maxValue?: CalendarDate | null
  readonly isDateUnavailable?: (date: CalendarDate) => boolean
  readonly readOnly?: boolean
  readonly invalid?: boolean
}

/** A locale-aware, keyboard-navigable month view for selecting one date. */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar({
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

  return <AriaDirectionBoundary direction={direction}><AriaCalendar
    {...properties}
    ref={ref}
    dir={direction}
    className={className}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null ? undefined : date => isDateUnavailable(date as CalendarDate)}
    style={calendarRootStyle(theme, disabled, style)}
  >
    <CalendarLayout color={color} size={size} theme={theme} />
  </AriaCalendar></AriaDirectionBoundary>
})
