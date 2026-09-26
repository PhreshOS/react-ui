import { forwardRef } from "react"
import type { ReactNode } from "react"
import { ColorPicker as AriaColorPicker, DialogTrigger as AriaDialogTrigger } from "react-aria-components"
import { Button, type ButtonProps } from "./button.js"
import { ColorSwatch } from "./color-swatch.js"
import { colorValue } from "./control/color-value.js"
import { useControlMetrics } from "./control/control.js"
import { ariaOpenState, type OpenStateProps } from "./control/open-state.js"
import { PopoverContent, PopoverDialog, type PopoverContentProps } from "./popover.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"

export type ColorPickerRootProps = OpenStateProps & Readonly<{
  /** A hex color. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  children: ReactNode
}>

/**
 * Owns one color and the popover that edits it. The picker draws nothing of
 * its own: its Trigger shows the color, and its Content holds whichever color
 * components edit it, which all follow the picker's color.
 */
function ColorPickerRoot({ value, defaultValue, onChange, children, ...state }: ColorPickerRootProps) {
  return <AriaColorPicker
    {...(value !== undefined ? { value } : {})}
    {...(defaultValue !== undefined ? { defaultValue } : {})}
    {...(onChange !== undefined ? { onChange: (color: Parameters<typeof colorValue>[0]) => onChange(colorValue(color)) } : {})}
  ><AriaDialogTrigger {...ariaOpenState(state)}>{children}</AriaDialogTrigger></AriaColorPicker>
}

export type ColorPickerTriggerProps = ButtonProps

/** A Button that shows the picker's color before its own label, if any. */
const ColorPickerTrigger = forwardRef<HTMLButtonElement, ColorPickerTriggerProps>(function ColorPickerTrigger({ children, size, ...properties }, ref) {
  const metrics = useControlMetrics(size)

  return <Button {...properties} ref={ref} size={size}>
    <ColorSwatch style={{ width: metrics.indicator, height: metrics.indicator }} />
    {children}
  </Button>
})

export type ColorPickerContentProps = PopoverContentProps

/** The popover that holds the editing components, stacked by the Appearance spacing. */
const ColorPickerContent = forwardRef<HTMLElement, ColorPickerContentProps>(function ColorPickerContent({ children, style, placement = "bottom start", ...properties }, ref) {
  const { spacing } = useVisual()

  return <PopoverContent {...properties} ref={ref} placement={placement} style={{ padding: scale(spacing, "medium"), ...style }}>
    <PopoverDialog aria-label="Color" style={{ display: "grid", gap: scale(spacing, "medium") }}>{children}</PopoverDialog>
  </PopoverContent>
})

export const ColorPicker = Object.assign(ColorPickerRoot, { Trigger: ColorPickerTrigger, Content: ColorPickerContent })
