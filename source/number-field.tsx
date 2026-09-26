import { forwardRef } from "react"
import { Group, Input as AriaInput, NumberField as AriaNumberField } from "react-aria-components"
import type { GroupRenderProps, NumberFieldProps as AriaNumberFieldProps } from "react-aria-components"
import { Minus, Plus } from "lucide-react"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldButton } from "./control/field-button.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { iconProps } from "./control/icon.js"
import { surfaceRender } from "./control/surface-render.js"
import { nativeTextStyle } from "./control/text-control.js"
import MotionStyle, { textControlClass } from "./foundation/motion-style.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface NumberFieldProps extends
  Omit<AriaNumberFieldProps, ControlOverrides | "value" | "defaultValue" | "onChange" | "className" | "style">,
  ControlProps,
  FieldProps,
  RadiusProps,
  MaterialOverrides {
  /** A number, or `null` while the field is empty. */
  readonly value?: number | null
  readonly defaultValue?: number | null
  readonly onChange?: (value: number | null) => void
  readonly placeholder?: string
  readonly readOnly?: boolean
}

/**
 * A number typed or stepped within a range. It is formatted by the locale and
 * `formatOptions`, such as a unit, and checked against its range on blur.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField({
  label, description, errorMessage, disabled, readOnly, required, invalid, value, defaultValue, onChange,
  size, color = "background", radius, style, className, placeholder, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  // React Aria spells an empty number as NaN; React UI spells it as null.
  const number = (next: number | null | undefined) => next === null ? Number.NaN : next

  return <AriaNumberField
    {...properties}
    {...(value !== undefined ? { value: number(value) } : {})}
    {...(defaultValue !== undefined ? { defaultValue: number(defaultValue) } : {})}
    onChange={next => onChange?.(Number.isNaN(next) ? null : next)}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    style={fieldStyle(metrics, style)}
  >
    <MotionStyle />
    <FieldLabel label={label} />
    <Group
      render={surfaceRender<GroupRenderProps>("div", group => ({
        color,
        depth: "recessed",
        material,
        radius: metrics.radius,
        interaction: { hovered: group.isHovered, focusVisible: group.isFocusWithin, invalid: group.isInvalid, disabled: group.isDisabled }
      }))}
      style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", alignItems: "center", minWidth: 0, height: metrics.height, paddingInlineEnd: 4 }}
    >
      <AriaInput ref={ref} placeholder={placeholder} className={textControlClass}
        style={{ ...nativeTextStyle(metrics, false), paddingInlineEnd: metrics.gap, fontVariantNumeric: "tabular-nums" }} />
      <FieldButton slot="decrement" metrics={metrics}><Minus {...iconProps(14)} /></FieldButton>
      <FieldButton slot="increment" metrics={metrics}><Plus {...iconProps(14)} /></FieldButton>
    </Group>
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </AriaNumberField>
})
