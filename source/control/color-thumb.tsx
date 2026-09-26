import { ColorThumb as AriaColorThumb } from "react-aria-components"
import { colorOpacity, darkCanvas, lightColor } from "../foundation/color.js"
import { transition, type ControlMetrics } from "./control.js"

/**
 * The handle of a ColorSlider or ColorArea: the chosen color inside a ring of
 * the light Appearance color, like every thumb, set apart from any gradient by
 * a hairline in the dark Appearance color.
 */
export function ColorThumb({ metrics, center }: Readonly<{
  metrics: ControlMetrics
  /** The axis React Aria leaves unpositioned on a one-channel track. */
  center?: "top" | "left"
}>) {
  const { colors } = metrics.visual
  const dark = darkCanvas(colors) ? colors.background : colors.foreground
  const size = metrics.indicator + 4

  return <AriaColorThumb style={({ defaultStyle, isDragging, isFocusVisible, isDisabled }) => ({
    ...defaultStyle,
    ...transition(metrics.visual, "scale, outline-color"),
    ...(center === undefined ? {} : { [center]: "50%" }),
    boxSizing: "border-box",
    width: size,
    height: size,
    borderRadius: "50%",
    border: `3px solid ${lightColor(colors)}`,
    boxShadow: `0 0 0 1px ${colorOpacity(dark, 0.3)}, 0 1px 3px ${colorOpacity(dark, 0.3)}`,
    outline: `3px solid ${isFocusVisible ? colorOpacity(colors.primary, 0.34) : "transparent"}`,
    outlineOffset: 1,
    scale: isDragging ? "0.92" : "1",
    cursor: isDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab"
  })} />
}

/** The edge that sets a color gradient apart from whatever it sits on. */
export function colorEdge(metrics: ControlMetrics): string {
  return `inset 0 0 0 1px ${colorOpacity(metrics.visual.colors.foreground, 0.12)}`
}
