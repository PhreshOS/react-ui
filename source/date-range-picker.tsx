import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { DateRangePicker as AriaDateRangePicker } from "react-aria-components"
import type { DateRangePickerProps as AriaDateRangePickerProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./aria-direction.js"
import { CalendarTrigger } from "./calendar-trigger.js"
import {
  controlOpacity,
  FieldFeedback,
  FieldLabel,
  fieldStyle,
  useControlTheme,
  type ControlOverrides,
  type ControlProps,
  type FieldProps
} from "./control.js"
import { DateControl, DateSegments } from "./date-control.js"
import type { DateRange } from "./date-range.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { MaterialOverrides } from "./material-options.js"
import { PopoverContent, PopoverDialog } from "./popover.js"
import { RangeCalendar } from "./range-calendar.js"
import type { RadiusProps } from "./radius.js"
import type { ShadowOverrides } from "./shadow-options.js"

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

export interface DateRangePickerProps
  extends Omit<AriaDateRangePickerProps<CalendarDate>, DateRangePickerOverrides>,
    ControlProps,
    FieldProps,
    RadiusProps,
    MaterialOverrides,
    ShadowOverrides {
  readonly value?: DateRange | null
  readonly defaultValue?: DateRange | null
  readonly onChange?: (value: DateRange | null) => void
  readonly minValue?: CalendarDate | null
  readonly maxValue?: CalendarDate | null
  readonly isDateUnavailable?: (date: CalendarDate, anchorDate: CalendarDate | null) => boolean
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
  shadow,
  style,
  className,
  isDateUnavailable,
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color, radius })
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaDateRangePicker
    {...properties}
    ref={ref}
    dir={direction}
    className={className}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null
      ? undefined
      : (date, anchorDate) => isDateUnavailable(date as CalendarDate, anchorDate)}
    style={fieldStyle(theme, disabled, style)}
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
        shadow={shadow}
        theme={theme}
        end={<CalendarTrigger theme={theme} />}
      >
        {/* The two dates are one value; keep their separator adjacent rather than
            letting two flexible inputs turn the field into unrelated columns. */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flex: "1 1 auto",
          minWidth: 0,
          gap: Math.max(2, theme.gap / 2)
        }}>
          <DateSegments compact slot="start" theme={theme} />
          <span aria-hidden="true" style={{ flex: "0 0 auto", opacity: controlOpacity.secondary }}>–</span>
          <DateSegments compact slot="end" theme={theme} />
        </div>
      </DateControl>
      <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
      <PopoverContent placement="bottom start">
        <PopoverDialog>
          <RangeCalendar color={color} size={size} radius={radius} />
        </PopoverDialog>
      </PopoverContent>
    </>}
  </AriaDateRangePicker></AriaDirectionBoundary>
})
