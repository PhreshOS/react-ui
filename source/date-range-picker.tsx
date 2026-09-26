import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { DateRangePicker as AriaDateRangePicker } from "react-aria-components"
import type { DateRangePickerProps as AriaDateRangePickerProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { CalendarTrigger } from "./calendar-trigger.js"
import { ariaOpenState } from "./control/open-state.js"
import { controlOpacity, useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { DateControl, DateSegments } from "./date-control.js"
import type { DateRange } from "./date-range.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { PopoverContent, PopoverDialog } from "./popover.js"
import { RangeCalendar } from "./range-calendar.js"
import type { RadiusProps } from "./foundation/radius.js"
import { dimmedClass } from "./surface/surface.js"

type DateRangePickerOverrides = ControlOverrides
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
  | "allowsNonContiguousRanges"

export interface DateRangePickerProps
  extends Omit<AriaDateRangePickerProps<CalendarDate>, DateRangePickerOverrides>,
    ControlProps,
    FieldProps,
    RadiusProps,
    MaterialOverrides {
  readonly value?: DateRange | null
  readonly defaultValue?: DateRange | null
  readonly onChange?: (value: DateRange | null) => void
  readonly minValue?: CalendarDate | null
  readonly maxValue?: CalendarDate | null
  readonly isDateUnavailable?: (date: CalendarDate, anchorDate: CalendarDate | null) => boolean
  /** Whether the calendar popover is shown. */
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  /** Whether choosing a date closes the calendar. Defaults to `true`. */
  readonly closeOnSelect?: boolean
  /** Whether hours, days, and months always show two digits. */
  readonly leadingZeros?: boolean
  /** Whether a range may include unavailable dates. */
  readonly nonContiguous?: boolean
  readonly readOnly?: boolean
}

/** Two date-only segmented fields backed by one inclusive range calendar. */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(function DateRangePicker({
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
  nonContiguous,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaDateRangePicker
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    {...ariaOpenState({ open, defaultOpen, onOpenChange })}
    shouldCloseOnSelect={closeOnSelect}
    shouldForceLeadingZeros={leadingZeros}
    allowsNonContiguousRanges={nonContiguous}
    isRequired={required}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null
      ? undefined
      : (date, anchorDate) => isDateUnavailable(date as CalendarDate, anchorDate)}
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
      >
        {/* The two dates are one value; keep their separator adjacent rather than
            letting two flexible inputs turn the field into unrelated columns. */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flex: "1 1 auto",
          minWidth: 0,
          gap: Math.max(2, metrics.gap / 2)
        }}>
          <DateSegments compact slot="start" metrics={metrics} />
          <span aria-hidden="true" style={{ flex: "0 0 auto", opacity: controlOpacity.secondary }}>–</span>
          <DateSegments compact slot="end" metrics={metrics} />
        </div>
      </DateControl>
      <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
      <PopoverContent placement="bottom start">
        <PopoverDialog>
          <RangeCalendar size={size} radius={radius} />
        </PopoverDialog>
      </PopoverContent>
    </>}
  </AriaDateRangePicker></AriaDirectionBoundary>
})
