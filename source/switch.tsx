import { forwardRef } from "react"
import { SwitchField, SwitchButton } from "react-aria-components"
import type { SwitchFieldProps } from "react-aria-components"
import { FieldFeedback, fieldStyle, useControlTheme } from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import { ToggleIndicator, toggleStyle } from "./toggle-indicator.js"
import type { MaterialOverrides } from "./material.js"

export interface SwitchProps extends Omit<SwitchFieldProps, ControlOverrides | "isReadOnly" | "isSelected" | "defaultSelected">, ControlProps, FieldProps, MaterialOverrides {
    readonly checked?: boolean
    readonly defaultChecked?: boolean
    readonly readOnly?: boolean
}

/** An on/off setting. onChange receives the next boolean value. */
export const Switch = forwardRef<HTMLDivElement, SwitchProps>(function Switch({
    label, description, errorMessage, disabled, required, invalid, readOnly,
    checked, defaultChecked, size, color, style, material, ...properties
}, ref) {

    const theme = useControlTheme({ size, color })

    return <SwitchField {...properties} ref={ref} isDisabled={disabled} isRequired={required} isInvalid={invalid}
        isReadOnly={readOnly} isSelected={checked} defaultSelected={defaultChecked}
        style={state => fieldStyle(theme, state.isDisabled, style)}>
        <SwitchButton style={state => toggleStyle(theme, state.isDisabled, state.isReadOnly)}>
            {state => <>
                <ToggleIndicator kind="switch" material={material} theme={theme} selected={state.isSelected} focused={state.isFocusVisible} invalid={state.isInvalid}
                    hovered={!state.isDisabled && !state.isReadOnly && state.isHovered}
                    pressed={!state.isDisabled && !state.isReadOnly && state.isPressed} />
                {label}
            </>}
        </SwitchButton>
        <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
    </SwitchField>
})
