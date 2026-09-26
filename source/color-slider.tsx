import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ColorSlider as AriaColorSlider, Label, SliderOutput, SliderTrack } from "react-aria-components"
import type { ColorSliderProps as AriaColorSliderProps } from "react-aria-components"
import { colorEdge, ColorThumb } from "./control/color-thumb.js"
import { colorValue } from "./control/color-value.js"
import { controlFontWeight, controlOpacity, useControlMetrics, type FieldProps } from "./control/control.js"
import { fieldStyle } from "./control/field.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { dimmedClass } from "./surface/surface.js"

export interface ColorSliderProps extends
  Omit<AriaColorSliderProps, "value" | "defaultValue" | "onChange" | "onChangeEnd" | "isDisabled" | "className" | "style" | "children">,
  Pick<FieldProps, "label" | "description"> {
  readonly value?: string
  readonly defaultValue?: string
  readonly onChange?: (value: string) => void
  readonly onChangeEnd?: (value: string) => void
  readonly disabled?: boolean
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * One channel of a color, such as hue or alpha, on a track painted with that
 * channel's range. Inside a ColorPicker it edits the picker's color.
 */
export const ColorSlider = forwardRef<HTMLDivElement, ColorSliderProps>(function ColorSlider({
  label, description, value, defaultValue, onChange, onChangeEnd, disabled, size, className, style, orientation = "horizontal", ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const direction = resolveDirection(properties.dir, useDirection())
  const vertical = orientation === "vertical"

  return <AriaDirectionBoundary direction={direction}><AriaColorSlider
    {...properties}
    ref={ref}
    dir={direction}
    orientation={orientation}
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    {...(onChange !== undefined ? { onChange: (color: Parameters<NonNullable<AriaColorSliderProps["onChange"]>>[0]) => onChange(colorValue(color)) } : {})}
    {...(onChangeEnd !== undefined ? { onChangeEnd: (color: Parameters<NonNullable<AriaColorSliderProps["onChangeEnd"]>>[0]) => onChangeEnd(colorValue(color)) } : {})}
    isDisabled={disabled}
    className={dimmedClass(disabled ?? false, className)}
    style={fieldStyle(metrics, style)}
  >
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: metrics.gap }}>
      {label != null && <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>}
      <SliderOutput style={{ fontVariantNumeric: "tabular-nums", opacity: controlOpacity.secondary }} />
    </div>
    <SliderTrack style={({ defaultStyle }) => ({
      ...defaultStyle,
      position: "relative",
      boxSizing: "border-box",
      width: vertical ? metrics.indicator : "100%",
      height: vertical ? metrics.height * 4 : metrics.indicator,
      // A track is round by its form.
      borderRadius: 9999,
      boxShadow: colorEdge(metrics)
    })}>
      <ColorThumb metrics={metrics} center={vertical ? "left" : "top"} />
    </SliderTrack>
    {description != null && <span style={{ fontSize: "0.92em", opacity: controlOpacity.secondary }}>{description}</span>}
  </AriaColorSlider></AriaDirectionBoundary>
})
