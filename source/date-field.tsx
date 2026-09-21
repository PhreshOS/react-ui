import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { DateField as AriaDateField } from "react-aria-components"
import type { DateFieldProps as AriaDateFieldProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./aria-direction.js"
import {
  FieldFeedback,
  FieldLabel,
  fieldStyle,
  useControlTheme
} from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import type { MaterialOverrides } from "./material-options.js"
import type { RadiusProps } from "./radius.js"
import type { ShadowOverrides } from "./shadow-options.js"
import { DateControl } from "./date-control.js"
import { resolveDirection, useDirection } from "./direction.js"

type DateFieldOverrides = ControlOverrides
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

export interface DateFieldProps
  extends Omit<AriaDateFieldProps<CalendarDate>, DateFieldOverrides>,
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

/** A locale-aware date-only field whose year, month, and day are edited as independent segments. */
export const DateField = forwardRef<HTMLDivElement, DateFieldProps>(function DateField({
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

  return <AriaDirectionBoundary direction={direction}><AriaDateField
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
        disabled={state.isDisabled}
        invalid={state.isInvalid}
        material={material}
        shadow={shadow}
        theme={theme}
      />
      <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
    </>}
  </AriaDateField></AriaDirectionBoundary>
})
