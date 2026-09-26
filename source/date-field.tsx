import { forwardRef } from "react"
import type { CalendarDate } from "@internationalized/date"
import { DateField as AriaDateField } from "react-aria-components"
import type { DateFieldProps as AriaDateFieldProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import type { RadiusProps } from "./foundation/radius.js"
import { DateControl } from "./date-control.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import { dimmedClass } from "./surface/surface.js"

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
  | "shouldForceLeadingZeros"

export interface DateFieldProps
  extends Omit<AriaDateFieldProps<CalendarDate>, DateFieldOverrides>,
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
  /** Whether hours, days, and months always show two digits. */
  readonly leadingZeros?: boolean
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
  style,
  className,
  isDateUnavailable,
  leadingZeros,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaDateField
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    shouldForceLeadingZeros={leadingZeros}
    isRequired={required}
    isInvalid={invalid}
    isDateUnavailable={isDateUnavailable == null ? undefined : date => isDateUnavailable(date as CalendarDate)}
    style={fieldStyle(metrics, style)}
  >
    {state => <>
      <FieldLabel label={label} />
      <DateControl
        disabled={state.isDisabled}
        invalid={state.isInvalid}
        material={material}
        color={color ?? "background"}
        metrics={metrics}
      />
      <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
    </>}
  </AriaDateField></AriaDirectionBoundary>
})
