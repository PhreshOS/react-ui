import { forwardRef } from "react"
import { SwitchButton, SwitchField } from "react-aria-components"
import type { SwitchFieldProps } from "react-aria-components"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, fieldStyle } from "./control/field.js"
import { ToggleIndicator, toggleRowStyle } from "./control/toggle.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface SwitchProps extends Omit<SwitchFieldProps, ControlOverrides | "isSelected" | "defaultSelected">, ControlProps, FieldProps, MaterialOverrides {
  readonly checked?: boolean
  readonly defaultChecked?: boolean
  readonly readOnly?: boolean
}

/** An on/off setting. `onChange` receives the next boolean value. */
export const Switch = forwardRef<HTMLDivElement, SwitchProps>(function Switch({
  label, description, errorMessage, disabled, required, invalid, readOnly, className,
  checked, defaultChecked, size, color = "primary", style, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const direction = resolveDirection(properties.dir, useDirection())

  return <SwitchField {...properties} ref={ref} isDisabled={disabled} isRequired={required} isInvalid={invalid}
    isReadOnly={readOnly} isSelected={checked} defaultSelected={defaultChecked}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    style={fieldStyle(metrics, style)}>
    <SwitchButton style={state => toggleRowStyle(metrics, state.isDisabled, state.isReadOnly)}>
      {state => <>
        <ToggleIndicator kind="switch" direction={direction} color={color} material={material} metrics={metrics} state={{
          selected: state.isSelected,
          hovered: !state.isReadOnly && state.isHovered,
          pressed: !state.isReadOnly && state.isPressed,
          focusVisible: state.isFocusVisible,
          invalid: state.isInvalid,
          disabled: state.isDisabled
        }} />
        {label}
      </>}
    </SwitchButton>
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </SwitchField>
})
