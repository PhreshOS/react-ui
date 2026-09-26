import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ColorSwatch as AriaColorSwatch } from "react-aria-components"
import type { ColorSwatchProps as AriaColorSwatchProps } from "react-aria-components"
import { colorEdge } from "./control/color-thumb.js"
import { useControlMetrics } from "./control/control.js"
import { resolveColor, type Color } from "./foundation/color.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"

export interface ColorSwatchProps extends Omit<AriaColorSwatchProps, "color" | "className" | "style">, RadiusProps {
  /**
   * The color shown: a role, a level, or any CSS color. Inside a ColorPicker
   * or a ColorSwatchPicker Item it defaults to that owner's color.
   */
  readonly color?: Color
  /** A control-sized square at each level. */
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

/** One color shown as a square, with a checkerboard beneath translucent colors. */
export const ColorSwatch = forwardRef<HTMLDivElement, ColorSwatchProps>(function ColorSwatch({
  color, size, radius, className, style, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)

  return <AriaColorSwatch
    {...properties}
    ref={ref}
    {...(color === undefined ? {} : { color: resolveColor(color, metrics.visual.colors) })}
    className={className}
    style={({ defaultStyle }) => ({
      ...defaultStyle,
      boxSizing: "border-box",
      flexShrink: 0,
      width: metrics.height,
      height: metrics.height,
      borderRadius: metrics.radius,
      boxShadow: colorEdge(metrics),
      ...style
    })}
  />
})
