// Base UI accepts an explicit direction; React Aria derives slider geometry
// from the locale, which cannot follow a React UI direction boundary.
import { Slider as BaseSlider } from "@base-ui/react/slider"
import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react/direction-provider"
import { forwardRef, useEffect, useId, useRef, useState } from "react"
import type { HTMLAttributes, Ref } from "react"
import { controlFontWeight, controlOpacity, transition, useControlMetrics, type ControlProps, type FieldProps } from "./control/control.js"
import { fieldStyle } from "./control/field.js"
import { lightColor } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { SurfaceView, dimmedClass } from "./surface/surface.js"

export interface SliderProps extends
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "color" | "defaultValue" | "onChange" | "style">,
  ControlProps,
  MaterialOverrides,
  Pick<FieldProps, "label" | "description"> {
  readonly value?: number
  readonly defaultValue?: number
  readonly minValue?: number
  readonly maxValue?: number
  readonly step?: number
  readonly orientation?: "horizontal" | "vertical"
  readonly name?: string
  readonly form?: string
  readonly formatOptions?: Intl.NumberFormatOptions
  readonly onChange?: (value: number) => void
  readonly onChangeEnd?: (value: number) => void
}

/**
 * One numeric value, drawn as a long Switch: a recessed bed, a raised fill in
 * the owner's color up to the thumb, and the Switch thumb dragged along it.
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider({
  label, description, name, form, disabled, size, color = "primary", style, className,
  orientation = "horizontal", value, defaultValue, minValue = 0, maxValue = 100, step = 1,
  formatOptions, onChange, onChangeEnd, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const { colors } = metrics.visual
  const direction = resolveDirection(properties.dir, useDirection())
  const descriptionId = useId()
  const input = useRef<HTMLInputElement>(null)
  const initialValue = useRef(defaultValue ?? minValue)
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue.current)
  const vertical = orientation === "vertical"
  // The Switch's proportions: its bed height, and a thumb inset by the same gap.
  const bed = metrics.indicator
  const inset = 3
  const thumb = bed - inset * 2
  const describedBy = [properties["aria-describedby"], description != null ? descriptionId : null].filter(Boolean).join(" ") || undefined
  const controlled = value !== undefined

  useEffect(() => {
    const formElement = input.current?.form
    if (controlled || formElement == null) return
    const reset = () => setUncontrolledValue(initialValue.current)
    formElement.addEventListener("reset", reset)
    return () => formElement.removeEventListener("reset", reset)
  }, [controlled])

  return <BaseDirectionProvider direction={direction}><BaseSlider.Root
    {...properties}
    ref={ref}
    className={dimmedClass(disabled ?? false, className)}
    value={controlled ? value : uncontrolledValue}
    min={minValue}
    max={maxValue}
    step={step}
    name={name}
    form={form}
    disabled={disabled}
    orientation={orientation}
    format={formatOptions}
    onValueChange={next => {
      if (!controlled) setUncontrolledValue(next)
      onChange?.(next)
    }}
    onValueCommitted={next => onChangeEnd?.(next)}
    style={fieldStyle(metrics, style)}
  >
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: metrics.gap }}>
      {label != null && <BaseSlider.Label style={{ fontWeight: controlFontWeight }}>{label}</BaseSlider.Label>}
      <BaseSlider.Value style={{ fontVariantNumeric: "tabular-nums", opacity: controlOpacity.secondary }} />
    </div>
    <SurfaceView
      as="div"
      color="background"
      depth="recessed"
      material={material}
      radius="full"
      style={{
        display: "flex",
        boxSizing: "border-box",
        // The thumb center travels between the bed ends minus half a thumb,
        // so the thumb keeps the Switch inset at both ends.
        paddingBlock: vertical ? inset + thumb / 2 : inset,
        paddingInline: vertical ? inset : inset + thumb / 2,
        width: vertical ? bed : "100%",
        height: vertical ? metrics.height * 4 : bed
      }}
    >
      <BaseSlider.Control style={{ position: "relative", flex: 1, touchAction: "none", userSelect: "none" }}>
        <BaseSlider.Track style={{ position: "relative", width: "100%", height: "100%" }}>
          <BaseSlider.Indicator render={(fill, _state) => <SurfaceView
            {...fill}
            ref={(fill as { ref?: Ref<Element> }).ref}
            as="div"
            color={color}
            material={material}
            shadow={false}
            radius="full"
            style={{
              ...fill.style,
              position: "absolute",
              boxSizing: "content-box",
              // The fill starts at the bed's end and wraps the thumb with the
              // bed's inset, like an enabled Switch.
              ...(vertical
                ? { insetInlineStart: -inset, width: bed, marginBottom: -(inset + thumb / 2), paddingTop: thumb + inset * 2 }
                : { top: -inset, height: bed, marginInlineStart: -(inset + thumb / 2), paddingInlineEnd: thumb + inset * 2 })
            }}
          />} />
          <BaseSlider.Thumb
            inputRef={input}
            aria-label={properties["aria-label"]}
            aria-labelledby={properties["aria-labelledby"]}
            aria-describedby={describedBy}
            render={(native, state) => <SurfaceView
              {...native}
              ref={(native as { ref?: Ref<Element> }).ref}
              as="div"
              // A thumb is lit from above in every Theme.
              color={lightColor(colors)}
              radius="full"
              interaction={{ hovered: false, pressed: state.dragging, focusVisible: state.focused, disabled: state.disabled }}
              style={{
                ...native.style,
                ...transition(metrics.visual, "scale, outline-color, box-shadow"),
                zIndex: 2,
                width: thumb,
                height: thumb,
                cursor: state.disabled ? "not-allowed" : state.dragging ? "grabbing" : "grab",
                scale: state.dragging ? "0.92" : "1"
              }}
            />}
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </SurfaceView>
    {description != null && <span id={descriptionId} style={{ fontSize: "0.92em", opacity: controlOpacity.secondary }}>{description}</span>}
  </BaseSlider.Root></BaseDirectionProvider>
})
