import { forwardRef, useMemo } from "react"
import {
  Button,
  ComboBox as AriaComboBox,
  Group,
  Input as AriaInput
} from "react-aria-components"
import type { ComboBoxProps as AriaComboBoxProps } from "react-aria-components"
import { controlPaint, FieldFeedback, FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import { SurfaceField } from "./control-surface.js"
import { resolveDirection, useDirection } from "./direction.js"
import FieldStyle, { textControlClass } from "./field-style.js"
import { ListBox } from "./list-box.js"
import type { MaterialOverrides } from "./material-options.js"
import { PopoverContent } from "./popover.js"
import type { RadiusProps } from "./radius.js"
import { ScrollArea } from "./scroll-area.js"
import type { SelectOption } from "./select.js"
import type { ShadowOverrides } from "./shadow-options.js"

export type ComboBoxOption = SelectOption

export interface ComboBoxProps extends Omit<
  AriaComboBoxProps<ComboBoxOption>,
  | ControlOverrides
  | "allowsCustomValue"
  | "defaultItems"
  | "defaultInputValue"
  | "defaultSelectedKey"
  | "defaultValue"
  | "disabledKeys"
  | "inputValue"
  | "isReadOnly"
  | "items"
  | "onChange"
  | "onInputChange"
  | "onSelectionChange"
  | "selectedKey"
  | "selectionMode"
  | "value"
>, ControlProps, FieldProps, RadiusProps, MaterialOverrides, ShadowOverrides {
  readonly options: readonly ComboBoxOption[]
  readonly value?: string | null
  readonly defaultValue?: string | null
  readonly onChange?: (value: string | null) => void
  readonly inputValue?: string
  readonly defaultInputValue?: string
  readonly onInputChange?: (value: string) => void
  readonly placeholder?: string
  readonly readOnly?: boolean
}

/** A searchable single-selection field whose query filters string-valued options. */
export const ComboBox = forwardRef<HTMLDivElement, ComboBoxProps>(function ComboBox({
  label,
  description,
  errorMessage,
  disabled = false,
  readOnly = false,
  required = false,
  invalid = false,
  options,
  value,
  defaultValue,
  onChange,
  inputValue,
  defaultInputValue,
  onInputChange,
  placeholder,
  size = "medium",
  color,
  radius = "medium",
  style,
  material,
  shadow,
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color, radius })
  const direction = resolveDirection(properties.dir, useDirection())
  const disabledValues = useMemo(
    () => options.filter(option => option.disabled).map(option => option.value),
    [options]
  )

  return <AriaComboBox
    {...properties}
    ref={ref}
    dir={direction}
    value={value}
    defaultValue={defaultValue}
    onChange={key => onChange?.(key == null ? null : String(key))}
    inputValue={inputValue}
    defaultInputValue={defaultInputValue}
    onInputChange={onInputChange}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    style={fieldStyle(theme, disabled, style)}
  >{state => <>
    <FieldStyle />
    <FieldLabel label={label} />
    <Group style={group => ({
      position: "relative",
      minWidth: 0,
      height: theme.height,
      borderRadius: theme.radius,
      outline: group.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: 1
    })}>
      {group => <SurfaceField
        material={material}
        shadow={shadow}
        radius={theme.radius}
        paint={controlPaint(theme, group.isFocusWithin, group.isInvalid, group.isHovered)}
        style={{
          position: "absolute",
          inset: 0,
          gridTemplateColumns: "minmax(0, 1fr) auto"
        }}
      >
        <AriaInput
          className={textControlClass}
          placeholder={placeholder}
          style={{
            appearance: "none",
            boxSizing: "border-box",
            width: "100%",
            minWidth: 0,
            height: theme.height,
            paddingBlock: 0,
            paddingInlineStart: Math.max(8, theme.spacing),
            paddingInlineEnd: theme.gap,
            border: 0,
            borderRadius: "inherit",
            outline: "none",
            background: "transparent",
            color: "inherit",
            caretColor: "currentColor",
            font: "inherit",
            lineHeight: 1.5
          }}
        />
        <Button
          aria-label="Show options"
          style={{
            ...theme.transition,
            display: "grid",
            placeItems: "center",
            width: theme.height,
            height: theme.height,
            padding: 0,
            border: 0,
            borderRadius: "inherit",
            outline: "none",
            background: "transparent",
            color: "inherit",
            cursor: disabled || readOnly ? "default" : "pointer"
          }}
        >
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{
              ...theme.transition,
              transitionProperty: "transform",
              transform: `rotate(${state.isOpen ? 180 : 0}deg)`
            }}
          ><path d="m2 4 4 4 4-4" /></svg>
        </Button>
      </SurfaceField>}
    </Group>
    <PopoverContent
      dir={direction}
      placement="bottom start"
      offset={theme.gap}
      style={{
        width: "var(--trigger-width)",
        maxHeight: `min(calc(100vh - ${theme.spacing * 2}px), ${theme.height * 8}px)`,
        padding: 0,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <ScrollArea style={{ flex: "1 1 auto", minHeight: 0 }}>
        <ListBox
          color={color}
          radius={radius}
          size={size}
          disabledValues={disabledValues}
        >
          {options.map(option => <ListBox.Item key={option.value} id={option.value} textValue={option.label} disabled={option.disabled}>
              {option.label}
          </ListBox.Item>)}
        </ListBox>
      </ScrollArea>
    </PopoverContent>
    <FieldFeedback theme={theme} description={description} errorMessage={errorMessage} />
  </>}
  </AriaComboBox>
})
