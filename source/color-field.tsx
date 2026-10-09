import { forwardRef, useContext } from "react"
import { ColorField as AriaColorField, ColorPickerStateContext, Input as AriaInput, parseColor } from "react-aria-components"
import type { ColorFieldProps as AriaColorFieldProps } from "react-aria-components"
import { colorValue } from "./control/color-value.js"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { nativeTextStyle, TextWell } from "./control/text-control.js"
import MotionStyle, { textControlClass } from "./foundation/motion-style.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface ColorFieldProps extends
  Omit<AriaColorFieldProps, ControlOverrides | "value" | "defaultValue" | "onChange" | "className" | "style">,
  ControlProps,
  FieldProps,
  RadiusProps,
  MaterialOverrides {
  /** A hex color, or `null` while the field is empty. */
  readonly value?: string | null
  readonly defaultValue?: string | null
  readonly onChange?: (value: string | null) => void
  readonly placeholder?: string
  readonly readOnly?: boolean
}

/**
 * A whole six-digit hex color, with or without its `#`. A three-digit one is
 * also the start of a six-digit one, so it waits until the field is left.
 */
const completeHex = /^#?[\da-f]{6}$/i

/**
 * A color typed as text: a hex value, or one channel when `channel` is set.
 * Inside a ColorPicker it edits the picker's color. A hex value applies as soon
 * as it is a whole color, as the picker's other parts apply while they move,
 * not only when the field is left.
 */
export const ColorField = forwardRef<HTMLInputElement, ColorFieldProps>(function ColorField({
  label, description, errorMessage, disabled, readOnly, required, invalid, value, defaultValue, onChange,
  size, color = "background", radius, style, className, placeholder, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const picker = useContext(ColorPickerStateContext)

  function typed(text: string) {
    if (properties.channel !== undefined || !completeHex.test(text.trim())) return
    const next = parseColor(text.trim().startsWith("#") ? text.trim() : `#${text.trim()}`)
    if (picker) picker.setColor(next)
    else onChange?.(colorValue(next))
  }

  return <AriaColorField
    {...properties}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    {...(onChange !== undefined ? { onChange: (next: Parameters<NonNullable<AriaColorFieldProps["onChange"]>>[0]) => onChange(next === null ? null : colorValue(next)) } : {})}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    style={fieldStyle(metrics, style)}
  >
    <MotionStyle />
    <FieldLabel label={label} />
    <AriaInput ref={ref} placeholder={placeholder} className={textControlClass}
      render={(native, state) => <TextWell color={color} material={material} metrics={metrics} state={state}>
        <input {...native} onChange={event => { native.onChange?.(event); typed(event.currentTarget.value) }} />
      </TextWell>}
      style={{ ...nativeTextStyle(metrics, false), fontVariantNumeric: "tabular-nums" }} />
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </AriaColorField>
})
