import { forwardRef } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Select as AriaSelect, Button, SelectValue, Popover, ListBox, ListBoxItem } from "react-aria-components"
import type { SelectProps as AriaSelectProps } from "react-aria-components"
import { controlPaint, controlStyle, FieldFeedback, FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import { SurfaceButton } from "./control-material.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import type { RadiusProps } from "./radius.js"
import { Surface } from "./surface.js"
import type { SurfaceOverrides } from "./use-surface.js"
import { overlayMotionClass, visualTransition } from "./motion-style.js"

export interface SelectOption {
    readonly value: string
    readonly label: string
    readonly disabled?: boolean
}

export interface SelectProps extends Omit<AriaSelectProps<SelectOption>, ControlOverrides | "value" | "defaultValue" | "onChange" | "selectedKey" | "defaultSelectedKey" | "onSelectionChange" | "disabledKeys" | "selectionMode">, ControlProps, FieldProps, RadiusProps, SurfaceOverrides {
    readonly options: readonly SelectOption[]
    readonly value?: string | null
    readonly defaultValue?: string | null
    readonly onChange?: (value: string | null) => void
}

/** Single selection from string-valued options; keyboard navigation and typeahead stay native to React Aria. */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select({
    label, description, errorMessage, disabled, required, invalid, options, value, defaultValue, onChange,
    size, color, radius, style, surface, ...properties
}, ref) {

    const theme = useControlTheme({ size, color, radius })
    const reduced = useReducedMotion()

    return <AriaSelect {...properties} ref={ref} value={value} defaultValue={defaultValue}
        onChange={key => onChange?.(key == null ? null : String(key))}
        disabledKeys={options.filter(option => option.disabled).map(option => option.value)}
        isDisabled={disabled} isRequired={required} isInvalid={invalid} style={fieldStyle(theme, disabled, style)}>
        {state => <>
            <FieldLabel label={label} />
            <Button render={(native, button) => <SurfaceButton native={native} options={surface} paint={controlPaint(theme, state.isOpen || button.isFocused, state.isInvalid, button.isHovered)} />}
                style={button => ({
                ...controlStyle(theme, state.isOpen || button.isFocused, state.isInvalid, button.isHovered, button.isFocusVisible),
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: theme.gap,
                cursor: disabled ? "not-allowed" : "pointer", textAlign: "start"
            })}>
                <SelectValue style={({ isPlaceholder }) => ({ opacity: isPlaceholder ? 0.6 : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })} />
                <motion.svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                    initial={false} animate={{ rotate: state.isOpen ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.18, ease: "easeOut" }}
                    style={{ flexShrink: 0 }}><path d="m2 4 4 4 4-4" /></motion.svg>
            </Button>
            <Popover className={overlayMotionClass} placement="bottom start" offset={theme.gap} style={{ width: "var(--trigger-width)", maxWidth: "calc(100vw - 16px)" }}>
                <Surface style={{ padding: theme.gap }}>
                    <ListBox items={options} style={{ display: "grid", gap: theme.gap, maxHeight: `min(280px, calc(var(--available-height) - ${theme.gap * 2}px))`, overflow: "auto", outline: "none", fontSize: theme.fontSize, color: theme.foreground }}>
                        {option => <ListBoxItem id={option.value} textValue={option.label} style={item => ({
                            ...visualTransition,
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: theme.gap,
                            minHeight: theme.height, paddingInline: Math.max(8, theme.spacing), boxSizing: "border-box",
                            borderRadius: theme.radius,
                            outline: item.isFocused && !item.isSelected ? `2px solid ${theme.foreground}` : "none", outlineOffset: -2,
                            cursor: item.isDisabled ? "not-allowed" : "pointer",
                            opacity: item.isDisabled ? 0.46 : 1,
                            ...(item.isSelected ? item.isFocused ? theme.paints.palette.hover : theme.paints.palette.rest
                                : { background: "transparent", color: theme.foreground })
                        })}>
                            {item => <>{option.label}<span aria-hidden="true">{item.isSelected ? "✓" : null}</span></>}
                        </ListBoxItem>}
                    </ListBox>
                </Surface>
            </Popover>
            <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
        </>}
    </AriaSelect>
})
