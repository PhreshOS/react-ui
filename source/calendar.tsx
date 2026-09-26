import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { Calendar as AriaCalendar } from "react-aria-components"
import type { CalendarProps as AriaCalendarProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { CalendarLayout, calendarRootStyle } from "./calendar-layout.js"
import { useControlMetrics, type ControlOverrides, type ControlProps } from "./control/control.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import { dimmedClass } from "./surface/surface.js"

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
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaCalendar
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null ? undefined : date => isDateUnavailable(date as CalendarDate)}
    style={calendarRootStyle(metrics, style)}
  >
    <CalendarLayout color={color ?? "primary"} size={size} metrics={metrics} />
  </AriaCalendar></AriaDirectionBoundary>
})
