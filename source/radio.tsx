import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Label, RadioButton, RadioField, RadioGroup as AriaRadioGroup, Text } from "react-aria-components"
import type { RadioFieldProps, RadioGroupProps as AriaRadioGroupProps } from "react-aria-components"
import { controlFontWeight, controlOpacity, useControlMetrics, type ControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldFeedback, fieldStyle } from "./control/field.js"
import { ToggleIndicator, toggleRowStyle } from "./control/toggle.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import type { Color } from "./foundation/color.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

type RadioStyle = Readonly<{
  color: Color
  direction: Direction
  material: MaterialOverrides["material"]
  metrics: ControlMetrics
}>

const RadioStyleContext = createContext<RadioStyle | null>(null)

export interface RadioGroupProps extends
  Omit<AriaRadioGroupProps, ControlOverrides | "value" | "defaultValue" | "onChange">,
  ControlProps,
  FieldProps,
  MaterialOverrides {
  readonly children: ReactNode
  readonly value?: string | null
  readonly defaultValue?: string | null
  /** Receives the newly selected value; a radio selection cannot be cleared. */
  readonly onChange?: (value: string) => void
  readonly readOnly?: boolean
}

/** One string value chosen from its Items. */
const RadioGroupRoot = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup({
  label, description, errorMessage, children, disabled, readOnly, required, invalid,
  value, defaultValue, onChange, orientation = "vertical", size, color = "primary", style, className, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const direction = resolveDirection(properties.dir, useDirection())
  const context = useMemo(() => ({ color, direction, material, metrics }), [color, direction, material, metrics])

  return <AriaDirectionBoundary direction={direction}><AriaRadioGroup
    {...properties}
    ref={ref}
    dir={direction}
    className={dimmedClass(disabled ?? false, className)}
    orientation={orientation}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    onChange={next => onChange?.(next)}
    isDisabled={disabled}
    isReadOnly={readOnly}
    isRequired={required}
    isInvalid={invalid}
    style={fieldStyle(metrics, style)}
  >
    {label != null && <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>}
    <RadioStyleContext.Provider value={context}>
      <div style={{ display: "flex", flexDirection: orientation === "vertical" ? "column" : "row", flexWrap: "wrap", gap: metrics.gap }}>
        {children}
      </div>
    </RadioStyleContext.Provider>
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </AriaRadioGroup></AriaDirectionBoundary>
})

export interface RadioGroupItemProps extends Omit<RadioFieldProps, "children" | "className" | "isDisabled" | "style" | "value"> {
  readonly value: string
  readonly label?: ReactNode
  readonly description?: ReactNode
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

/** One option in a RadioGroup. Selection, validation, and paint belong to the group. */
const RadioGroupItem = forwardRef<HTMLDivElement, RadioGroupItemProps>(function RadioGroupItem({
  label, description, disabled, className, style, ...properties
}, ref) {
  const inherited = useContext(RadioStyleContext)
  if (inherited == null) throw new Error("RadioGroup.Item must be used inside RadioGroup")
  const { color, direction, material, metrics } = inherited

  // Items inherit the group's text scale; only the group root applies it.
  return <RadioField {...properties} ref={ref} className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""} isDisabled={disabled}
    style={{ display: "grid", gap: 2, minWidth: 0, ...style }}>
    <RadioButton style={state => toggleRowStyle(metrics, state.isDisabled, state.isReadOnly)}>
      {state => <>
        <ToggleIndicator kind="radio" direction={direction} color={color} material={material} metrics={metrics} state={{
          selected: state.isSelected,
          hovered: !state.isReadOnly && state.isHovered,
          pressed: !state.isReadOnly && state.isPressed,
          focusVisible: state.isFocusVisible,
          invalid: state.isInvalid,
          disabled: state.isDisabled
        }} />
        {label}
      </>}
    </RadioButton>
    {description != null && <Text slot="description" style={{ fontSize: "0.92em", opacity: controlOpacity.secondary, paddingInlineStart: metrics.indicator + metrics.gap }}>{description}</Text>}
  </RadioField>
})

/** One exclusive-choice field whose options are its Items. */
export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem
})
