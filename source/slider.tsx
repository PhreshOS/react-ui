import { forwardRef, useId } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Slider as AriaSlider, SliderTrack, SliderThumb, SliderFill, SliderOutput } from "react-aria-components"
import type { SliderProps as AriaSliderProps } from "react-aria-components"
import { FieldLabel, fieldStyle, useControlTheme } from "./control.js"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import { useControlTransition } from "./motion-style.js"

export interface SliderProps extends Omit<AriaSliderProps<number>, ControlOverrides>, ControlProps, Pick<FieldProps, "label" | "description"> {
    readonly name?: string
}

/** One numeric value with pointer, touch, keyboard, and form support. */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider({
    label, description, name, disabled, size, color, style, orientation = "horizontal", ...properties
}, ref) {

    const theme = useControlTheme({ size, color })
    const descriptionId = useId()
    const vertical = orientation === "vertical"
    const diameter = theme.fontSize + 6
    const reduced = useReducedMotion()
    const transition = useControlTransition(Boolean(reduced))
    const rail = Math.max(4, Math.round(diameter / 3))

    return <AriaSlider {...properties} ref={ref} isDisabled={disabled} orientation={orientation} style={fieldStyle(theme, disabled, style)}
        aria-describedby={[properties["aria-describedby"], description != null ? descriptionId : null].filter(Boolean).join(" ") || undefined}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: theme.gap }}>
            <FieldLabel label={label} />
            <SliderOutput style={{ fontVariantNumeric: "tabular-nums", opacity: 0.7 }} />
        </div>
        <SliderTrack style={{
            position: "relative", touchAction: "none",
            width: vertical ? theme.height : "100%", height: vertical ? 160 : theme.height
        }}>
            <div aria-hidden="true" style={{
                ...theme.transition,
                position: "absolute", borderRadius: rail,
                ...(vertical ? { width: rail, height: "100%", left: "50%", transform: "translateX(-50%)" } : { height: rail, width: "100%", top: "50%", transform: "translateY(-50%)" }),
                background: theme.paints.neutral.rest.background
            }} />
            <SliderFill style={{
                ...theme.transition,
                position: "absolute", background: theme.paints.palette.rest.background, borderRadius: rail,
                ...(vertical ? { width: rail, left: "50%", transform: "translateX(-50%)" } : { height: rail, top: "50%", transform: "translateY(-50%)" })
            }} />
            <SliderThumb name={name} style={state => ({
                width: diameter, height: diameter, borderRadius: "50%", boxSizing: "border-box",
                ...(vertical ? { left: "50%" } : { top: "50%" }),
                outline: state.isFocusVisible ? `2px solid ${theme.foreground}` : "none", outlineOffset: 2,
                cursor: state.isDisabled ? "not-allowed" : state.isDragging ? "grabbing" : "grab"
            })}>
                {state => <motion.span aria-hidden="true" initial={false}
                    animate={{ scale: reduced || state.isDisabled ? 1 : state.isDragging ? 0.92 : state.isHovered ? 1.08 : 1 }}
                    transition={transition}
                    style={{ ...theme.transition, position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
                        background: (state.isDragging ? theme.paints.palette.pressed : state.isHovered ? theme.paints.palette.hover : theme.paints.palette.rest).color,
                        border: `3px solid ${(state.isDragging ? theme.paints.palette.pressed : state.isHovered ? theme.paints.palette.hover : theme.paints.palette.rest).background}`,
                        boxSizing: "border-box" }} />}
            </SliderThumb>
        </SliderTrack>
        {description != null && <span id={descriptionId} style={{ fontSize: "0.92em", opacity: 0.7 }}>{description}</span>}
    </AriaSlider>
})
