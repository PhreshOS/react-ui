import { forwardRef } from "react"
import type { ReactNode } from "react"
import { Button as AriaButton, ComboBox as AriaComboBox, Group, Input as AriaInput } from "react-aria-components"
import type { ComboBoxProps as AriaComboBoxProps, GroupRenderProps } from "react-aria-components"
import { useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { surfaceRender } from "./control/surface-render.js"
import { nativeTextStyle } from "./control/text-control.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import MotionStyle, { textControlClass } from "./foundation/motion-style.js"
import { resolveRadius, type RadiusProps } from "./foundation/radius.js"
import { ListBox } from "./list-box.js"
import { PopoverContent } from "./popover.js"
import { ScrollArea } from "./scroll-area.js"
import { Chevron } from "./select.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface ComboBoxProps extends Omit<
  AriaComboBoxProps<object>,
  | ControlOverrides
  | "allowsCustomValue" | "defaultItems" | "defaultInputValue" | "defaultSelectedKey" | "defaultValue" | "disabledKeys"
  | "inputValue" | "items" | "onChange" | "onInputChange" | "onSelectionChange" | "selectedKey" | "selectionMode" | "value"
  | "onOpenChange" | "allowsEmptyCollection" | "shouldFocusWrap"
>, ControlProps, FieldProps, RadiusProps, MaterialOverrides {
  /** `ComboBox.Item` and `ComboBox.Section` entries filtered by the typed query. */
  readonly children: ReactNode
  readonly value?: string | null
  readonly defaultValue?: string | null
  readonly onChange?: (value: string | null) => void
  readonly inputValue?: string
  readonly defaultInputValue?: string
  readonly onInputChange?: (value: string) => void
  readonly placeholder?: string
  readonly readOnly?: boolean
  // The list opens from typing, so a ComboBox reports its open state but
  // cannot be opened from outside like the other overlays.
  readonly onOpenChange?: (open: boolean) => void
  /** Whether the list can open while no Item matches. */
  readonly openWhenEmpty?: boolean
  /** Whether arrow keys wrap from the last Item to the first. */
  readonly focusWrap?: boolean
}

/** A searchable single-choice field whose options are its Items. */
const ComboBoxRoot = forwardRef<HTMLDivElement, ComboBoxProps>(function ComboBox({
  label, description, errorMessage, disabled = false, readOnly = false, required = false, invalid = false,
  children, value, defaultValue, onChange, inputValue, defaultInputValue, onInputChange, placeholder,
  size, color = "background", radius, style, className, material, onOpenChange, openWhenEmpty, focusWrap, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  // The list shell keeps the Appearance radius at the chosen level.
  const shell = resolveRadius(radius ?? "medium", metrics.visual.radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaComboBox
    {...properties}
    onOpenChange={onOpenChange === undefined ? undefined : open => onOpenChange(open)}
    allowsEmptyCollection={openWhenEmpty}
    shouldFocusWrap={focusWrap}
    ref={ref}
    dir={direction}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    onChange={key => onChange?.(key == null ? null : String(key))}
    inputValue={inputValue}
    defaultInputValue={defaultInputValue}
    onInputChange={onInputChange}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    className={dimmedClass(disabled, className)}
    style={fieldStyle(metrics, style)}
  >{state => <>
    <MotionStyle />
    <FieldLabel label={label} />
    <Group
      render={surfaceRender<GroupRenderProps>("div", group => ({
        color,
        depth: "recessed",
        material,
        radius: metrics.radius,
        interaction: { hovered: group.isHovered, focusVisible: group.isFocusWithin, invalid: group.isInvalid, disabled: group.isDisabled }
      }))}
      style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", minWidth: 0, height: metrics.height }}
    >
      <AriaInput className={textControlClass} placeholder={placeholder} style={{ ...nativeTextStyle(metrics, false), paddingInlineEnd: metrics.gap }} />
      <AriaButton aria-label="Show options" style={{
        display: "grid",
        placeItems: "center",
        width: metrics.height,
        height: metrics.height,
        padding: 0,
        border: 0,
        borderRadius: "inherit",
        outline: "none",
        background: "transparent",
        color: "inherit",
        cursor: disabled || readOnly ? "default" : "pointer"
      }}>
        <Chevron metrics={metrics} open={state.isOpen} />
      </AriaButton>
    </Group>
    <PopoverContent dir={direction} placement="bottom start" offset={metrics.gap} radius={shell} style={{
      width: "var(--trigger-width)",
      maxHeight: `min(calc(100vh - ${metrics.spacing * 2}px), ${metrics.height * 8}px)`,
      padding: 0,
      display: "flex",
      flexDirection: "column"
    }}>
      <ScrollArea style={{ flex: "1 1 auto", minHeight: 0 }}>
        <ListBox size={size}>{children}</ListBox>
      </ScrollArea>
    </PopoverContent>
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </>}</AriaComboBox>
})

/** A searchable single-choice field whose options are its Items. */
export const ComboBox = Object.assign(ComboBoxRoot, {
  Item: ListBox.Item,
  Section: ListBox.Section,
  Header: ListBox.Header
})
