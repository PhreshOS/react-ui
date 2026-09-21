import { forwardRef } from "react"
import type { Time } from "@internationalized/date"
import { TimeField as AriaTimeField } from "react-aria-components"
import type { TimeFieldProps as AriaTimeFieldProps } from "react-aria-components"
import { AriaDirectionBoundary } from "./aria-direction.js"
import {
  FieldFeedback,
  FieldLabel,
  fieldStyle,
  useControlTheme
} from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import { DateControl } from "./date-control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { MaterialOverrides } from "./material-options.js"
import type { RadiusProps } from "./radius.js"
import type { ShadowOverrides } from "./shadow-options.js"

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
    MaterialOverrides,
    ShadowOverrides {
  readonly value?: Time | null
  readonly defaultValue?: Time | null
  readonly onChange?: (value: Time | null) => void
  readonly minValue?: Time | null
  readonly maxValue?: Time | null
  readonly placeholderValue?: Time
  readonly granularity?: "hour" | "minute" | "second"
  readonly hourCycle?: 12 | 24
  readonly shouldForceLeadingZeros?: boolean
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
  shadow,
  style,
  className,
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color, radius })
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaTimeField
    {...properties}
    ref={ref}
    dir={direction}
    className={className}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
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
  </AriaTimeField></AriaDirectionBoundary>
})
