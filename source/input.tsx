import { forwardRef } from "react"
import { Input as AriaInput, TextField } from "react-aria-components"
import type { TextFieldProps } from "react-aria-components"
import { controlPaint, controlStyle, FieldFeedback, FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import { SurfaceField } from "./control-material.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import type { RadiusProps } from "./radius.js"
import type { SurfaceOverrides } from "./use-surface.js"
import FieldStyle, { textControlClass } from "./field-style.js"

export interface InputProps extends Omit<TextFieldProps, ControlOverrides | "isReadOnly">, ControlProps, FieldProps, RadiusProps, SurfaceOverrides {
    readonly placeholder?: string
    readonly readOnly?: boolean
}

/** A labeled single-line text control. onChange receives the string value. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
    label, description, errorMessage, disabled, readOnly, required, invalid,
    size, color, radius, style, className, placeholder, surface, ...properties
}, ref) {

    const theme = useControlTheme({ size, color, radius })

    return <TextField {...properties} className={className} isDisabled={disabled} isReadOnly={readOnly}
        isRequired={required} isInvalid={invalid} style={fieldStyle(theme, disabled, style)}>
        <FieldStyle />
        <FieldLabel label={label} />
        <AriaInput ref={ref} placeholder={placeholder} className={textControlClass}
            render={(native, state) => <SurfaceField options={surface} radius={theme.radius} paint={controlPaint(theme, state.isFocused, state.isInvalid, state.isHovered)}>
                <input {...native} style={{ ...native.style, borderRadius: "inherit", background: "transparent" }} />
            </SurfaceField>}
            style={state => controlStyle(theme, state.isFocused, state.isInvalid, state.isHovered, state.isFocusVisible)} />
        <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
    </TextField>
})
