import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import {
  DatePicker as AriaDatePicker
} from "react-aria-components"
import type { DatePickerProps as AriaDatePickerProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./aria-direction.js"
import { Calendar } from "./calendar.js"
import { CalendarTrigger } from "./calendar-trigger.js"
import {
  FieldFeedback,
  FieldLabel,
  fieldStyle,
  useControlTheme,
  type ControlOverrides,
  type ControlProps,
  type FieldProps
} from "./control.js"
import { DateControl } from "./date-control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { MaterialOverrides } from "./material-options.js"
import { PopoverContent, PopoverDialog } from "./popover.js"
import type { RadiusProps } from "./radius.js"
import type { ShadowOverrides } from "./shadow-options.js"

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

export interface DatePickerProps
  extends Omit<AriaDatePickerProps<CalendarDate>, DatePickerOverrides>,
    ControlProps,
    FieldProps,
    RadiusProps,
    MaterialOverrides,
    ShadowOverrides {
  readonly value?: CalendarDate | null
  readonly defaultValue?: CalendarDate | null
  readonly onChange?: (value: CalendarDate | null) => void
  readonly minValue?: CalendarDate | null
  readonly maxValue?: CalendarDate | null
  readonly isDateUnavailable?: (date: CalendarDate) => boolean
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
  shadow,
  style,
  className,
  isDateUnavailable,
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color, radius })
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaDatePicker
    {...properties}
    ref={ref}
    dir={direction}
    className={className}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null ? undefined : date => isDateUnavailable(date as CalendarDate)}
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
      />
      <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
      <PopoverContent placement="bottom start">
        <PopoverDialog>
          <Calendar color={color} size={size} radius={radius} />
        </PopoverDialog>
      </PopoverContent>
    </>}
  </AriaDatePicker></AriaDirectionBoundary>
})
