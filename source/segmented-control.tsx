import { createContext, forwardRef, useContext, useId, useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import { ToggleButton as AriaToggleButton, ToggleButtonGroup as AriaToggleButtonGroup } from "react-aria-components"
import type { ToggleButtonGroupProps as AriaToggleButtonGroupProps, ToggleButtonProps as AriaToggleButtonProps } from "react-aria-components"
import { controlFontWeight, controlOpacity, useControlMetrics, type ControlMetrics, type ControlProps, type FieldProps } from "./control/control.js"
import { fieldStyle } from "./control/field.js"
import { SelectionItemLabel, selectionItemStyle, selectionListStyle, SelectionTrack } from "./control/selection-track.js"
import { stringKey } from "./control/selection.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import type { Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

type SegmentedContext = Readonly<{ color: Color, metrics: ControlMetrics, orientation: "horizontal" | "vertical" }>

const SegmentedStyleContext = createContext<SegmentedContext | null>(null)

export interface SegmentedControlProps extends
  Omit<AriaToggleButtonGroupProps, "selectionMode" | "selectedKeys" | "defaultSelectedKeys" | "onSelectionChange" | "disallowEmptySelection" | "isDisabled" | "children" | "className" | "style">,
  ControlProps,
  Pick<FieldProps, "label" | "description">,
  RadiusProps,
  MaterialOverrides {
  readonly children: ReactNode
  /** The selected Item's id. */
  readonly value?: string
  readonly defaultValue?: string
  readonly onChange?: (value: string) => void
}

/**
 * One value chosen from a few options that stay visible. It shares the Tabs
 * track: the selection slides to the chosen Item. Use it where Tabs would
 * switch views, but the choice is a value instead.
 */
const SegmentedControlRoot = forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl({
  label, description, children, value, defaultValue, onChange, disabled, size, color = "default", radius, material,
  orientation = "horizontal", className, style, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())
  const context = useMemo(() => ({ color, metrics, orientation }), [color, metrics, orientation])
  const labelId = useId()
  const descriptionId = useId()
  const selected = value ?? defaultValue

  return <AriaDirectionBoundary direction={direction}><div className={dimmedClass(disabled ?? false, className)} style={fieldStyle(metrics, style)}>
    {label != null && <span id={labelId} style={{ fontWeight: controlFontWeight }}>{label}</span>}
    <SegmentedStyleContext.Provider value={context}>
      <SelectionTrack metrics={metrics} color={color} material={material} orientation={orientation} selectedKey={selected}>
        <AriaToggleButtonGroup
          {...properties}
          ref={ref}
          dir={direction}
          data-selection-list=""
          aria-labelledby={properties["aria-labelledby"] ?? (label != null ? labelId : undefined)}
          aria-describedby={properties["aria-describedby"] ?? (description != null ? descriptionId : undefined)}
          orientation={orientation}
          selectionMode="single"
          disallowEmptySelection
          {...(value !== undefined ? { selectedKeys: [value] } : {})}
          {...(defaultValue !== undefined ? { defaultSelectedKeys: [defaultValue] } : {})}
          onSelectionChange={keys => {
            const [key] = keys
            if (key !== undefined) onChange?.(stringKey(key))
          }}
          isDisabled={disabled}
          style={selectionListStyle(orientation)}
        >{children}</AriaToggleButtonGroup>
      </SelectionTrack>
    </SegmentedStyleContext.Provider>
    {description != null && <span id={descriptionId} style={{ fontSize: "0.92em", opacity: controlOpacity.secondary }}>{description}</span>}
  </div></AriaDirectionBoundary>
})

export interface SegmentedControlItemProps extends Omit<AriaToggleButtonProps, "id" | "isDisabled" | "className" | "style" | "children"> {
  /** Identity of this Item; it is the value it selects. */
  readonly id: string
  readonly children: ReactNode
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

/** One option; its label may lead with an icon. */
const SegmentedControlItem = forwardRef<HTMLButtonElement, SegmentedControlItemProps>(function SegmentedControlItem({
  children, disabled, className, style, ...properties
}, ref) {
  const inherited = useContext(SegmentedStyleContext)
  if (inherited == null) throw new Error("SegmentedControl.Item must be used inside SegmentedControl")
  const { color, metrics, orientation } = inherited

  return <AriaToggleButton
    {...properties}
    ref={ref}
    isDisabled={disabled}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    style={state => ({ ...selectionItemStyle(metrics, color, orientation, state), ...style })}
  >{state => <SelectionItemLabel metrics={metrics} emphasized={state.isSelected || state.isHovered}>{children}</SelectionItemLabel>}</AriaToggleButton>
})

export const SegmentedControl = Object.assign(SegmentedControlRoot, { Item: SegmentedControlItem })
