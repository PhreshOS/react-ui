import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ColorArea as AriaColorArea } from "react-aria-components"
import type { ColorAreaProps as AriaColorAreaProps } from "react-aria-components"
import { colorEdge, ColorThumb } from "./control/color-thumb.js"
import { colorValue } from "./control/color-value.js"
import { useControlMetrics } from "./control/control.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import { resolveRadius, type RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { dimmedClass } from "./surface/surface.js"

export interface ColorAreaProps extends
  Omit<AriaColorAreaProps, "value" | "defaultValue" | "onChange" | "onChangeEnd" | "isDisabled" | "className" | "style" | "children">,
  RadiusProps {
  readonly value?: string
  readonly defaultValue?: string
  readonly onChange?: (value: string) => void
  readonly onChangeEnd?: (value: string) => void
  readonly disabled?: boolean
  /** Sets the thumb and the default extent of the area. */
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * Two channels of a color, such as saturation and brightness, on a square
 * painted with both ranges. Inside a ColorPicker it edits the picker's color.
 */
export const ColorArea = forwardRef<HTMLDivElement, ColorAreaProps>(function ColorArea({
  value, defaultValue, onChange, onChangeEnd, disabled, size, radius, className, style, ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const direction = resolveDirection(properties.dir, useDirection())

  return <AriaDirectionBoundary direction={direction}><AriaColorArea
    {...properties}
    ref={ref}
    dir={direction}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    {...(onChange !== undefined ? { onChange: (color: Parameters<NonNullable<AriaColorAreaProps["onChange"]>>[0]) => onChange(colorValue(color)) } : {})}
    {...(onChangeEnd !== undefined ? { onChangeEnd: (color: Parameters<NonNullable<AriaColorAreaProps["onChangeEnd"]>>[0]) => onChangeEnd(colorValue(color)) } : {})}
    isDisabled={disabled}
    className={dimmedClass(disabled ?? false, className)}
    style={({ defaultStyle }) => ({
      ...defaultStyle,
      position: "relative",
      boxSizing: "border-box",
      flexShrink: 0,
      width: metrics.height * 6,
      aspectRatio: "1",
      // An area is a region, not a control: it keeps the Appearance radius.
      borderRadius: resolveRadius(radius ?? "medium", metrics.visual.radius),
      boxShadow: colorEdge(metrics),
      ...style
    })}
  ><ColorThumb metrics={metrics} /></AriaColorArea></AriaDirectionBoundary>
})
