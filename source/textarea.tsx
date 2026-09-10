import { forwardRef } from "react"
import { TextArea as AriaTextarea, TextField } from "react-aria-components"
import { controlPaint, controlStyle, FieldFeedback, FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import { SurfaceField } from "./control-material.js"
import type { InputProps } from "./input.js"
import FieldStyle, { textControlClass } from "./field-style.js"

export interface TextareaProps extends Omit<InputProps, "type" | "pattern"> {
    readonly rows?: number
}

/** A labeled multiline text control, vertically resizable without escaping its width. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
    label, description, errorMessage, disabled, readOnly, required, invalid,
    size, color, radius, style, className, placeholder, rows = 4, surface, ...properties
}, ref) {

    const theme = useControlTheme({ size, color, radius })

    return <TextField {...properties} className={className} isDisabled={disabled} isReadOnly={readOnly}
        isRequired={required} isInvalid={invalid} style={fieldStyle(theme, disabled, style)}>
        <FieldStyle />
        <FieldLabel label={label} />
        <AriaTextarea ref={ref} placeholder={placeholder} rows={rows} className={textControlClass}
            render={(native, state) => <SurfaceField options={surface} radius={theme.radius} paint={controlPaint(theme, state.isFocused, state.isInvalid, state.isHovered)}>
                <textarea {...native} style={{ ...native.style, borderRadius: "inherit", background: "transparent" }} />
            </SurfaceField>}
            style={state => ({
            ...controlStyle(theme, state.isFocused, state.isInvalid, state.isHovered, state.isFocusVisible),
            height: "auto",
            minHeight: theme.height,
            paddingBlock: Math.max(6, theme.spacing / 2),
            resize: "vertical"
        })} />
        <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
    </TextField>
})
