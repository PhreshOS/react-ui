import { forwardRef } from "react"
import { CheckboxButton, CheckboxField } from "react-aria-components"
import type { CheckboxFieldProps } from "react-aria-components"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, fieldStyle } from "./control/field.js"
import { ToggleIndicator, toggleRowStyle } from "./control/toggle.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface CheckboxProps extends Omit<CheckboxFieldProps, ControlOverrides | "isSelected" | "defaultSelected" | "isIndeterminate">, ControlProps, FieldProps, MaterialOverrides, RadiusProps {
  readonly checked?: boolean
  readonly defaultChecked?: boolean
  readonly indeterminate?: boolean
  readonly readOnly?: boolean
}

/** An independent boolean field with optional mixed-state presentation. */
export const Checkbox = forwardRef<HTMLDivElement, CheckboxProps>(function Checkbox({
  label, description, errorMessage, disabled, required, invalid, readOnly, className,
  checked, defaultChecked, indeterminate, size, color = "primary", style, material, radius, ...properties
}, ref) {
  const metrics = useControlMetrics(size)

  return <CheckboxField {...properties} ref={ref} isDisabled={disabled} isRequired={required} isInvalid={invalid}
    isReadOnly={readOnly} isSelected={checked} defaultSelected={defaultChecked} isIndeterminate={indeterminate}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    style={fieldStyle(metrics, style)}>
    <CheckboxButton style={state => toggleRowStyle(metrics, state.isDisabled, state.isReadOnly)}>
      {state => <>
        <ToggleIndicator kind="checkbox" color={color} material={material} metrics={metrics} radius={radius} state={{
          selected: state.isSelected,
          indeterminate: state.isIndeterminate,
          hovered: !state.isReadOnly && state.isHovered,
          pressed: !state.isReadOnly && state.isPressed,
          focusVisible: state.isFocusVisible,
          invalid: state.isInvalid,
          disabled: state.isDisabled
        }} />
        {label}
      </>}
    </CheckboxButton>
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </CheckboxField>
})
