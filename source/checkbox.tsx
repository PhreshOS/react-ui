import { forwardRef } from "react"
import { CheckboxField, CheckboxButton } from "react-aria-components"
import type { CheckboxFieldProps } from "react-aria-components"
import { FieldFeedback, fieldStyle, useControlTheme } from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import { ToggleIndicator, toggleStyle } from "./toggle-indicator.js"
import type { MaterialOverrides } from "./material-options.js"

export interface CheckboxProps extends Omit<CheckboxFieldProps, ControlOverrides | "isReadOnly" | "isSelected" | "defaultSelected" | "isIndeterminate">, ControlProps, FieldProps, MaterialOverrides {
    readonly checked?: boolean
    readonly defaultChecked?: boolean
    readonly indeterminate?: boolean
    readonly readOnly?: boolean
}

/** An independent boolean field with optional mixed-state presentation. */
export const Checkbox = forwardRef<HTMLDivElement, CheckboxProps>(function Checkbox({
    label, description, errorMessage, disabled, required, invalid, readOnly,
    checked, defaultChecked, indeterminate, size, color, style, material, ...properties
}, ref) {

    const theme = useControlTheme({ size, color })

    return <CheckboxField {...properties} ref={ref} isDisabled={disabled} isRequired={required} isInvalid={invalid}
        isReadOnly={readOnly} isSelected={checked} defaultSelected={defaultChecked} isIndeterminate={indeterminate}
        style={state => fieldStyle(theme, state.isDisabled, style)}>
        <CheckboxButton style={state => toggleStyle(theme, state.isDisabled, state.isReadOnly)}>
            {state => <>
                <ToggleIndicator kind="checkbox" material={material} theme={theme} selected={state.isSelected} indeterminate={state.isIndeterminate}
                    focused={state.isFocusVisible} invalid={state.isInvalid}
                    hovered={!state.isDisabled && !state.isReadOnly && state.isHovered}
                    pressed={!state.isDisabled && !state.isReadOnly && state.isPressed} />
                {label}
            </>}
        </CheckboxButton>
        <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
    </CheckboxField>
})
