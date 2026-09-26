import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import {
  DatePicker as AriaDatePicker
} from "react-aria-components"
import type { DatePickerProps as AriaDatePickerProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { Calendar } from "./calendar.js"
import { CalendarTrigger } from "./calendar-trigger.js"
import { ariaOpenState } from "./control/open-state.js"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { DateControl } from "./date-control.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { PopoverContent, PopoverDialog } from "./popover.js"
import type { RadiusProps } from "./foundation/radius.js"
import { dimmedClass } from "./surface/surface.js"

type DatePickerOverrides = ControlOverrides
  | "isReadOnly"
  | "value"
  | "defaultValue"
  | "onChange"
  | "minValue"
  | "maxValue"
  | "isDateUnavailable"
  | "granularity"
  | "hourCycle"
  | "hideTimeZone"
  | "isOpen"
  | "defaultOpen"
  | "onOpenChange"
  | "shouldCloseOnSelect"
  | "shouldForceLeadingZeros"

export interface DatePickerProps
  extends Omit<AriaDatePickerProps<CalendarDate>, DatePickerOverrides>,
    ControlProps,
    FieldProps,
    RadiusProps,
    MaterialOverrides {
  readonly value?: CalendarDate | null
  readonly defaultValue?: CalendarDate | null
  readonly onChange?: (value: CalendarDate | null) => void
  readonly minValue?: CalendarDate | null
  readonly maxValue?: CalendarDate | null
  readonly isDateUnavailable?: (date: CalendarDate) => boolean
  /** Whether the calendar popover is shown. */
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  /** Whether choosing a date closes the calendar. Defaults to `true`. */
  readonly closeOnSelect?: boolean
  /** Whether hours, days, and months always show two digits. */
  readonly leadingZeros?: boolean
  readonly readOnly?: boolean
}

/** A date-only segmented field with a calendar selection popover. */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(function DatePicker({
  label,
  description,
  errorMessage,
  disabled,
  readOnly,
  required,
  invalid,
  size,
  color,
  radius,
  material,
  style,
  className,
  isDateUnavailable,
  open,
  defaultOpen,
  onOpenChange,
  closeOnSelect,
  leadingZeros,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaDatePicker
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    {...ariaOpenState({ open, defaultOpen, onOpenChange })}
    shouldCloseOnSelect={closeOnSelect}
    shouldForceLeadingZeros={leadingZeros}
    isRequired={required}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null ? undefined : date => isDateUnavailable(date as CalendarDate)}
    style={fieldStyle(metrics, style)}
  >
    {state => <>
      <FieldLabel label={label} />
      <DateControl
        active={state.isOpen}
        disabled={state.isDisabled}
        endFocusVisible={state.isFocusVisible}
        endRequiresVisibleFocus
        group
        invalid={state.isInvalid}
        material={material}
        color={color ?? "background"}
        metrics={metrics}
        end={<CalendarTrigger metrics={metrics} />}
      />
      <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
      <PopoverContent placement="bottom start">
        <PopoverDialog>
          <Calendar size={size} radius={radius} />
        </PopoverDialog>
      </PopoverContent>
    </>}
  </AriaDatePicker></AriaDirectionBoundary>
})
