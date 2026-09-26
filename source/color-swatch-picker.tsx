import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties } from "react"
import { ColorSwatchPicker as AriaColorSwatchPicker, ColorSwatchPickerItem as AriaColorSwatchPickerItem } from "react-aria-components"
import type { ColorSwatchPickerItemProps as AriaColorSwatchPickerItemProps, ColorSwatchPickerProps as AriaColorSwatchPickerProps } from "react-aria-components"
import { colorValue } from "./control/color-value.js"
import { transition, useControlMetrics, type ControlMetrics } from "./control/control.js"
import { ColorSwatch } from "./color-swatch.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { colorOpacity } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { dimmedClass } from "./surface/surface.js"

type SwatchPickerContext = Readonly<{ metrics: ControlMetrics, size: ScaleLevel | undefined, radius: RadiusProps["radius"] }>

const SwatchPickerStyleContext = createContext<SwatchPickerContext | null>(null)

export interface ColorSwatchPickerProps extends
  Omit<AriaColorSwatchPickerProps, "value" | "defaultValue" | "onChange" | "className" | "style">,
  RadiusProps {
  /** The selected Item's value. */
  readonly value?: string
  readonly defaultValue?: string
  readonly onChange?: (value: string) => void
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

/** One color chosen from a set of swatches; arrow keys move between them. */
const ColorSwatchPickerRoot = forwardRef<HTMLDivElement, ColorSwatchPickerProps>(function ColorSwatchPicker({
  value, defaultValue, onChange, size, radius, className, style, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(properties.dir, useDirection())
  const context = useMemo(() => ({ metrics, size, radius }), [metrics, size, radius])

  return <AriaDirectionBoundary direction={direction}><SwatchPickerStyleContext.Provider value={context}><AriaColorSwatchPicker
    {...properties}
    ref={ref}
    dir={direction}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    onChange={color => onChange?.(colorValue(color))}
    className={className}
    style={{ display: "flex", flexWrap: "wrap", gap: metrics.gap, ...style }}
  /></SwatchPickerStyleContext.Provider></AriaDirectionBoundary>
})

export interface ColorSwatchPickerItemProps extends Omit<AriaColorSwatchPickerItemProps, "color" | "isDisabled" | "className" | "style" | "children"> {
  /** The color this Item stands for; it is also the value it selects. */
  readonly value: string
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

/** One selectable swatch. Selection draws a ring in the text color around it. */
const ColorSwatchPickerItem = forwardRef<HTMLDivElement, ColorSwatchPickerItemProps>(function ColorSwatchPickerItem({
  value, disabled, className, style, ...properties
}, ref) {
  const inherited = useContext(SwatchPickerStyleContext)
  if (inherited == null) throw new Error("ColorSwatchPicker.Item must be used inside ColorSwatchPicker")
  const { metrics, size, radius } = inherited
  const { colors } = metrics.visual

  return <AriaColorSwatchPickerItem
    {...properties}
    ref={ref}
    color={value}
    isDisabled={disabled}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    style={({ isSelected, isFocusVisible, isDisabled }) => ({
      ...transition(metrics.visual, "outline-color"),
      display: "flex",
      borderRadius: metrics.radius,
      outline: `2px solid ${isFocusVisible ? colorOpacity(colors.primary, 0.6) : isSelected ? colors.foreground : "transparent"}`,
      outlineOffset: 2,
      cursor: isDisabled ? "not-allowed" : "pointer",
      ...style
    })}
  ><ColorSwatch size={size} radius={radius} /></AriaColorSwatchPickerItem>
})

export const ColorSwatchPicker = Object.assign(ColorSwatchPickerRoot, { Item: ColorSwatchPickerItem })
