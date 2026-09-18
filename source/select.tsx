import { forwardRef, useMemo } from "react"
import { Select as AriaSelect, Button, SelectValue, ListBox, ListBoxItem } from "react-aria-components"
import type { SelectProps as AriaSelectProps } from "react-aria-components"
import { controlOpacity, controlPaint, controlStyle, FieldFeedback, FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import { SurfaceButton } from "./control-surface.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import type { RadiusProps } from "./radius.js"
import { ScrollArea } from "./scroll-area.js"
import type { MaterialOverrides } from "./material-options.js"
import type { ShadowOverrides } from "./shadow-options.js"
import { PopoverContent } from "./popover.js"
import { resolveDirection, useDirection } from "./direction.js"

export interface SelectOption {
    readonly value: string
    readonly label: string
    readonly disabled?: boolean
}

export interface SelectProps extends Omit<AriaSelectProps<SelectOption>, ControlOverrides | "value" | "defaultValue" | "onChange" | "selectedKey" | "defaultSelectedKey" | "onSelectionChange" | "disabledKeys" | "selectionMode">, ControlProps, FieldProps, RadiusProps, MaterialOverrides, ShadowOverrides {
    readonly options: readonly SelectOption[]
    readonly value?: string | null
    readonly defaultValue?: string | null
    readonly onChange?: (value: string | null) => void
}

/** Single selection from string-valued options; keyboard navigation and typeahead stay native to React Aria. */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select({
    label, description, errorMessage, disabled, required, invalid, options, value, defaultValue, onChange,
    size, color, radius, style, material, shadow, ...properties
}, ref) {

    const theme = useControlTheme({ size, color, radius })
    const direction = resolveDirection(properties.dir, useDirection())
    const disabledKeys = useMemo(() => options.filter(option => option.disabled).map(option => option.value), [options])

    return <AriaSelect {...properties} ref={ref} value={value} defaultValue={defaultValue}
        onChange={key => onChange?.(key == null ? null : String(key))}
        disabledKeys={disabledKeys}
        isDisabled={disabled} isRequired={required} isInvalid={invalid} style={fieldStyle(theme, disabled, style)}>
        {state => <>
            <FieldLabel label={label} />
            <Button render={(native, button) => <SurfaceButton native={native} material={material} shadow={shadow} paint={controlPaint(theme, state.isOpen || button.isFocused, state.isInvalid, button.isHovered)} />}
                style={button => ({
                ...controlStyle(theme, state.isOpen || button.isFocused, state.isInvalid, button.isHovered, button.isFocusVisible),
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: theme.gap,
                cursor: disabled ? "not-allowed" : "pointer", textAlign: "start"
            })}>
                <SelectValue style={({ isPlaceholder }) => ({ opacity: isPlaceholder ? controlOpacity.placeholder : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })} />
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ ...theme.transition, transitionProperty: "transform", flexShrink: 0, transform: `rotate(${state.isOpen ? 180 : 0}deg)` }}><path d="m2 4 4 4 4-4" /></svg>
            </Button>
            <PopoverContent dir={direction} placement="bottom start" offset={theme.gap} style={{
                width: "var(--trigger-width)",
                maxHeight: `min(calc(100vh - ${theme.spacing * 2}px), ${theme.height * 8}px)`,
                padding: theme.gap,
                display: "flex",
                flexDirection: "column"
            }}>
                    <ScrollArea style={{ flex: "1 1 auto", minHeight: 0 }}>
                        <ListBox shouldFocusOnHover={false} style={{ display: "grid", gap: theme.gap, outline: "none", fontSize: theme.fontSize, color: theme.foreground }}>
                            {options.map(option => <ListBoxItem key={option.value} id={option.value} textValue={option.label} style={item => ({
                                ...theme.transition,
                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: theme.gap,
                                minHeight: theme.height, paddingInline: Math.max(8, theme.spacing), boxSizing: "border-box",
                                borderRadius: theme.radius,
                                outline: item.isFocusVisible && !item.isSelected ? `1px solid ${theme.focusColor}` : "none", outlineOffset: 1,
                                cursor: item.isDisabled ? "not-allowed" : "pointer",
                                opacity: item.isDisabled ? controlOpacity.disabled : 1,
                                ...(item.isSelected
                                    ? item.isPressed ? theme.paints.palette.pressed : item.isHovered ? theme.paints.palette.hover : theme.paints.palette.rest
                                    : item.isHovered ? theme.paints.neutral.hover : { background: "transparent", color: theme.foreground })
                            })}>
                                {item => <>{option.label}<span aria-hidden="true">{item.isSelected ? "✓" : null}</span></>}
                            </ListBoxItem>)}
                        </ListBox>
                    </ScrollArea>
            </PopoverContent>
            <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
        </>}
    </AriaSelect>
})
