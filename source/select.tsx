import { forwardRef } from "react"
import type { ReactNode } from "react"
import { Button as AriaButton, Select as AriaSelect, SelectValue } from "react-aria-components"
import type { ButtonRenderProps, SelectProps as AriaSelectProps } from "react-aria-components"
import { controlOpacity, transition, useControlMetrics, type ControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { surfaceRender } from "./control/surface-render.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import { resolveRadius, type RadiusProps } from "./foundation/radius.js"
import { ListBox } from "./list-box.js"
import { ariaOpenState, type OpenStateProps } from "./control/open-state.js"
import { PopoverContent } from "./popover.js"
import { ScrollArea } from "./scroll-area.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"
import { ChevronDown } from "lucide-react"
import { iconProps } from "./control/icon.js"

export interface SelectProps extends
  Omit<AriaSelectProps<object>, ControlOverrides | "value" | "defaultValue" | "onChange" | "selectedKey" | "defaultSelectedKey" | "onSelectionChange" | "disabledKeys" | "selectionMode" | "isOpen" | "defaultOpen" | "onOpenChange" | "shouldCloseOnSelect" | "allowsEmptyCollection">,
  ControlProps, FieldProps, RadiusProps, MaterialOverrides, OpenStateProps {
  /** `Select.Item` and `Select.Section` entries. */
  readonly children: ReactNode
  readonly value?: string | null
  readonly defaultValue?: string | null
  readonly onChange?: (value: string | null) => void
  /** Whether the list can open while it has no Items. */
  readonly openWhenEmpty?: boolean
}

/** One value chosen from its Items; the field recesses like every value holder. */
const SelectRoot = forwardRef<HTMLDivElement, SelectProps>(function Select({
  label, description, errorMessage, disabled, required, className, invalid, children, value, defaultValue, onChange,
  size, color = "background", radius, style, material, open, defaultOpen, onOpenChange, openWhenEmpty, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  // The list shell keeps the Appearance radius at the chosen level.
  const shell = resolveRadius(radius ?? "medium", metrics.visual.radius)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaSelect {...properties} ref={ref}
    {...ariaOpenState({ open, defaultOpen, onOpenChange })}
    allowsEmptyCollection={openWhenEmpty}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    onChange={key => onChange?.(key == null ? null : String(key))}
    className={dimmedClass(disabled ?? false, className)}
    isDisabled={disabled} isRequired={required} isInvalid={invalid} style={fieldStyle(metrics, style)}>
    {state => <>
      <FieldLabel label={label} />
      <AriaButton
        render={surfaceRender<ButtonRenderProps>("button", button => ({
          color,
          depth: "recessed",
          material,
          radius: metrics.radius,
          interaction: {
            hovered: button.isHovered,
            focusVisible: state.isOpen || button.isFocusVisible,
            invalid: state.isInvalid,
            disabled: button.isDisabled
          }
        }))}
        style={fieldTriggerStyle(metrics, disabled)}
      >
        {/* The trigger shows the chosen Item's text, like ComboBox's field. Reusing the
            Item's rendered content would also bring its list-only selection mark, whose
            inline SVG makes the line taller than the trigger and lifts the text. */}
        <SelectValue style={({ isPlaceholder }) => ({ minWidth: 0, opacity: isPlaceholder ? controlOpacity.placeholder : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
          {({ isPlaceholder, selectedText, defaultChildren }) => isPlaceholder ? defaultChildren : selectedText}
        </SelectValue>
        <Chevron metrics={metrics} open={state.isOpen} />
      </AriaButton>
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
    </>}
  </AriaSelect>
})

/** Layout of a pressable field trigger shared by Select and ComboBox. */
export function fieldTriggerStyle(metrics: ControlMetrics, disabled?: boolean) {
  return {
    appearance: "none",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: metrics.gap,
    width: "100%",
    minWidth: 0,
    height: metrics.height,
    paddingInline: metrics.inset,
    border: 0,
    background: "none",
    font: "inherit",
    lineHeight: 1.45,
    textAlign: "start",
    cursor: disabled ? "not-allowed" : "pointer"
  } as const
}

/** The disclosure chevron shared by every field that opens a list. */
export function Chevron({ metrics, open }: Readonly<{ metrics: ControlMetrics, open: boolean }>) {
  return <ChevronDown {...iconProps(14)}
    style={{ ...transition(metrics.visual, "rotate"), flexShrink: 0, opacity: controlOpacity.secondary, rotate: open ? "180deg" : "0deg" }} />
}

/** A single-choice field whose options are its Items. */
export const Select = Object.assign(SelectRoot, {
  Item: ListBox.Item,
  Section: ListBox.Section,
  Header: ListBox.Header
})
