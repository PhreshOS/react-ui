import { motion } from "motion/react"
import type { CSSProperties } from "react"
import type { ControlTheme } from "./control.js"
import type { MaterialOverrides } from "./material-options.js"
import type { ShadowOverrides } from "./shadow-options.js"
import { Surface } from "./surface.js"
import type { Direction } from "./direction.js"

/** Shared paint only. Selection, focus, validation, and native input behavior belong to React Aria. */
export function ToggleIndicator({ kind, direction = "ltr", selected, indeterminate = false, focused, invalid = false, hovered = false, pressed = false, theme, material: options, shadow }: Readonly<{
    kind: "checkbox" | "radio" | "switch"
    direction?: Direction
    selected: boolean
    indeterminate?: boolean
    focused: boolean
    invalid?: boolean
    hovered?: boolean
    pressed?: boolean
    theme: ControlTheme
} & MaterialOverrides & ShadowOverrides>) {

    const { animations, motionTransition: transition } = theme
    const diameter = theme.indicatorSize
    const active = selected || indeterminate
    const paints = invalid ? theme.paints.danger : active ? theme.paints.palette : theme.paints.subtle
    const paint = pressed ? paints.pressed : hovered ? paints.hover : paints.rest
    const radius = kind === "checkbox" ? Math.min(diameter / 4, typeof theme.radius === "number" ? theme.radius : diameter / 4) : diameter
    const switching = kind === "switch"
    const thumbWidth = diameter - 6 + (pressed && animations ? 3 : 0)
    const travel = (diameter * 2 - thumbWidth) / 2 - 3

    return <Surface as={motion.span} material={options} shadow={shadow} color={paint.background} aria-hidden="true" initial={false}
        animate={{ scale: !animations || switching ? 1 : pressed ? 0.94 : hovered ? 1.03 : 1 }}
        transition={transition} style={{
        color: paint.color,
        ...theme.transition,
        display: "inline-grid",
        placeItems: "center",
        position: "relative",
        boxSizing: "border-box",
        flexShrink: 0,
        width: switching ? diameter * 2 : diameter,
        height: diameter,
        borderRadius: radius,
        border: "none",
        outline: focused ? `1px solid ${theme.focusColor}` : "none",
        outlineOffset: 1,
    }}>
        {switching ? <motion.span initial={false} animate={{ width: thumbWidth, x: (selected ? travel : -travel) * (direction === "rtl" ? -1 : 1) }}
            transition={transition} style={{
                ...theme.transition,
                height: diameter - 6, borderRadius: diameter,
                background: paint.color
            }} /> : <motion.span initial={false} animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.7 }}
            transition={transition} style={{ display: "grid", placeItems: "center" }}>
            {kind === "radio" ? <span style={{ ...theme.transition, width: diameter / 2, height: diameter / 2, borderRadius: "50%", background: "currentColor" }} />
                : <svg width={diameter - 4} height={diameter - 4} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="m3 8 3 3 7-7" initial={false}
                        animate={{ pathLength: selected && !indeterminate ? 1 : 0, opacity: selected && !indeterminate ? 1 : 0 }}
                        transition={transition} />
                    <motion.path d="M4 8h8" initial={false}
                        animate={{ pathLength: indeterminate ? 1 : 0, opacity: indeterminate ? 1 : 0 }}
                        transition={transition} />
                </svg>}
        </motion.span>}
    </Surface>
}

export function toggleStyle(theme: ControlTheme, disabled: boolean, readOnly: boolean): CSSProperties {

    return {
        // React Aria's focusable native input is visually hidden with absolute
        // positioning. Anchor it here so focus cannot scroll an ancestor viewport
        // toward a position outside the visible toggle.
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: theme.gap,
        minHeight: theme.height,
        width: "fit-content",
        cursor: disabled ? "not-allowed" : readOnly ? "default" : "pointer"
    }
}
