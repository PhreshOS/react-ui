import { createContext, forwardRef, useContext } from "react"
import type { ReactNode } from "react"
import { RadioGroup as AriaRadioGroup, RadioField, RadioButton, Text } from "react-aria-components"
import type { RadioGroupProps as AriaRadioGroupProps, RadioFieldProps } from "react-aria-components"
import { FieldFeedback, FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import { ToggleIndicator, toggleStyle } from "./toggle-indicator.js"
import type { SurfaceOverrides } from "./use-surface.js"

const RadioStyle = createContext<Pick<ControlProps, "size" | "color" | "disabled"> & SurfaceOverrides>({})

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, ControlOverrides | "isReadOnly">, ControlProps, FieldProps, SurfaceOverrides {
    readonly children: ReactNode
    readonly readOnly?: boolean
}

export interface RadioProps extends Omit<RadioFieldProps, ControlOverrides>, ControlProps, Pick<FieldProps, "label" | "description">, SurfaceOverrides {}

/** One string value selected from its Radio children, with native arrow-key navigation. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup({
    label, description, errorMessage, children, disabled, readOnly, required, invalid,
    size, color, style, surface, orientation = "vertical", ...properties
}, ref) {

    const theme = useControlTheme({ size, color })

    return <AriaRadioGroup {...properties} ref={ref} isDisabled={disabled} isReadOnly={readOnly}
        isRequired={required} isInvalid={invalid} orientation={orientation} style={fieldStyle(theme, disabled, style)}>
        <FieldLabel label={label} />
        <RadioStyle.Provider value={{ size, color, disabled, surface }}>
            <div style={{ display: "flex", flexDirection: orientation === "vertical" ? "column" : "row", gap: theme.gap, flexWrap: "wrap" }}>
                {children}
            </div>
        </RadioStyle.Provider>
        <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
    </AriaRadioGroup>
})

/** An option in a RadioGroup. Selection and validation belong to the group. */
export const Radio = forwardRef<HTMLDivElement, RadioProps>(function Radio({ label, description, disabled, size, color, style, surface, ...properties }, ref) {

    const inherited = useContext(RadioStyle)
    const theme = useControlTheme({ size: size ?? inherited.size, color: color ?? inherited.color })

    return <RadioField {...properties} ref={ref} isDisabled={disabled} style={state => fieldStyle(theme, state.isDisabled && !inherited.disabled, style)}>
        <RadioButton style={state => toggleStyle(theme, state.isDisabled, state.isReadOnly)}>
            {state => <>
                <ToggleIndicator kind="radio" surface={surface ?? inherited.surface} theme={theme} selected={state.isSelected} focused={state.isFocusVisible} invalid={state.isInvalid}
                    hovered={!state.isDisabled && !state.isReadOnly && state.isHovered}
                    pressed={!state.isDisabled && !state.isReadOnly && state.isPressed} />
                {label}
            </>}
        </RadioButton>
        {description != null && <Text slot="description" style={{ fontSize: "0.92em", opacity: 0.7 }}>{description}</Text>}
    </RadioField>
})
