import { Slider as BaseSlider } from "@base-ui/react/slider"
import { forwardRef, useEffect, useId, useRef, useState } from "react"
import type { HTMLAttributes } from "react"
import { fieldStyle, useControlTheme } from "./control.js"
import type { ControlProps, FieldProps } from "./control.js"
import { useDirection } from "./direction.js"

export interface SliderProps extends
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "color" | "defaultValue" | "onChange" | "style">,
  ControlProps,
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

/** One numeric value with pointer, touch, keyboard, and form support. */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider({
  label,
  description,
  name,
  form,
  disabled,
  size,
  color,
  style,
  orientation = "horizontal",
  value,
  defaultValue,
  minValue = 0,
  maxValue = 100,
  step = 1,
  formatOptions,
  onChange,
  onChangeEnd,
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color })
  const direction = useDirection()
  const descriptionId = useId()
  const input = useRef<HTMLInputElement>(null)
  const initialValue = useRef(defaultValue ?? minValue)
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue.current)
  const [hovered, setHovered] = useState(false)
  const vertical = orientation === "vertical"
  const diameter = theme.fontSize + 6
  const rail = Math.max(4, Math.round(diameter / 3))
  const describedBy = [properties["aria-describedby"], description != null ? descriptionId : null].filter(Boolean).join(" ") || undefined
  const controlled = value !== undefined
  const resolvedValue = controlled ? value : uncontrolledValue

  useEffect(() => {
    const formElement = input.current?.form
    if (controlled || formElement == null) return

    const reset = () => setUncontrolledValue(initialValue.current)
    formElement.addEventListener("reset", reset)
    return () => formElement.removeEventListener("reset", reset)
  }, [controlled])

  return <BaseSlider.Root
    {...properties}
    dir={properties.dir ?? direction}
    ref={ref}
    value={resolvedValue}
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
    style={fieldStyle(theme, disabled, style)}
  >
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: theme.gap }}>
      {label != null && <BaseSlider.Label style={{ fontWeight: 550 }}>{label}</BaseSlider.Label>}
      <BaseSlider.Value style={{ fontVariantNumeric: "tabular-nums", opacity: 0.7 }} />
    </div>
    <BaseSlider.Control style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      touchAction: "none",
      userSelect: "none",
      width: vertical ? theme.height : "100%",
      height: vertical ? 160 : theme.height
    }}>
      <BaseSlider.Track style={{
        position: "relative",
        width: vertical ? rail : "100%",
        height: vertical ? "100%" : rail,
        borderRadius: rail,
        background: theme.paints.neutral.rest.background
      }}>
        <BaseSlider.Indicator style={{
          ...theme.transition,
          borderRadius: rail,
          background: theme.paints.palette.rest.background
        }} />
        <BaseSlider.Thumb
          inputRef={input}
          aria-label={properties["aria-label"]}
          aria-labelledby={properties["aria-labelledby"]}
          aria-describedby={describedBy}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          style={state => {
            const paint = state.dragging ? theme.paints.palette.pressed : hovered ? theme.paints.palette.hover : theme.paints.palette.rest
            return {
              ...theme.transition,
              width: diameter,
              height: diameter,
              borderRadius: "50%",
              boxSizing: "border-box",
              background: paint.color,
              border: `3px solid ${paint.background}`,
              outline: state.focused ? `1px solid ${theme.focusColor}` : "none",
              outlineOffset: 1,
              cursor: state.disabled ? "not-allowed" : state.dragging ? "grabbing" : "grab",
              transform: `scale(${state.dragging ? 0.92 : hovered ? 1.08 : 1})`
            }
          }}
        />
      </BaseSlider.Track>
    </BaseSlider.Control>
    {description != null && <span id={descriptionId} style={{ fontSize: "0.92em", opacity: 0.7 }}>{description}</span>}
  </BaseSlider.Root>
})
