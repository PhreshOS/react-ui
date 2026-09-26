import { forwardRef } from "react"
import type { Time } from "@internationalized/date"
import { TimeField as AriaTimeField } from "react-aria-components"
import type { TimeFieldProps as AriaTimeFieldProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { DateControl } from "./date-control.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import type { RadiusProps } from "./foundation/radius.js"
import { dimmedClass } from "./surface/surface.js"

type TimeFieldOverrides = ControlOverrides
  | "isReadOnly"
  | "value"
  | "defaultValue"
  | "onChange"
  | "minValue"
  | "maxValue"
  | "placeholderValue"
  | "granularity"
  | "hourCycle"
  | "hideTimeZone"
  | "shouldForceLeadingZeros"

export interface TimeFieldProps
  extends Omit<AriaTimeFieldProps<Time>, TimeFieldOverrides>,
    ControlProps,
    FieldProps,
    RadiusProps,
    MaterialOverrides {
  readonly value?: Time | null
  readonly defaultValue?: Time | null
  readonly onChange?: (value: Time | null) => void
  readonly minValue?: Time | null
  readonly maxValue?: Time | null
  readonly placeholderValue?: Time
  readonly granularity?: "hour" | "minute" | "second"
  readonly hourCycle?: 12 | 24
  /** Whether hours, days, and months always show two digits. */
  readonly leadingZeros?: boolean
  readonly readOnly?: boolean
}

/** A locale-aware time-only field whose visible clock units are independent editable segments. */
export const TimeField = forwardRef<HTMLDivElement, TimeFieldProps>(function TimeField({
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
  leadingZeros,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaTimeField
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    shouldForceLeadingZeros={leadingZeros}
    isRequired={required}
    isInvalid={invalid}
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
  </AriaTimeField></AriaDirectionBoundary>
})
