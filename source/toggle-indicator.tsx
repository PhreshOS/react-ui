import { motion, useReducedMotion } from "motion/react"
import type { CSSProperties } from "react"
import { useLocale } from "react-aria-components"
import type { ControlTheme } from "./control.js"
import { MaterialLayer, useResolvedMaterial } from "./material.js"
import type { MaterialOptions } from "./material-options.js"
import { SurfaceEdge } from "./surface-edge.js"
import { controlTransition, visualTransition } from "./motion-style.js"

/** Shared paint only. Selection, focus, validation, and native input behavior belong to React Aria. */
export function ToggleIndicator({ kind, selected, indeterminate = false, focused, invalid = false, hovered = false, pressed = false, theme, material: options }: Readonly<{
    kind: "checkbox" | "radio" | "switch"
    selected: boolean
    indeterminate?: boolean
    focused: boolean
    invalid?: boolean
    hovered?: boolean
    pressed?: boolean
    theme: ControlTheme
    material?: MaterialOptions
}>) {

    const reduced = useReducedMotion()
    const { direction } = useLocale()
    const diameter = theme.fontSize + 6
    const active = selected || indeterminate
    const paints = invalid ? theme.paints.danger : active ? theme.paints.palette : theme.paints.neutral
    const paint = pressed ? paints.pressed : hovered ? paints.hover : paints.rest
    const radius = kind === "checkbox" ? Math.min(diameter / 4, typeof theme.radius === "number" ? theme.radius : diameter / 4) : diameter
    const switching = kind === "switch"
    const thumbWidth = diameter - 6 + (pressed && !reduced ? 3 : 0)
    const travel = (diameter * 2 - thumbWidth) / 2 - 3

    const material = useResolvedMaterial({ color: paint.background, material: options })

    return <motion.span aria-hidden="true" initial={false}
        animate={{ scale: reduced || switching ? 1 : pressed ? 0.94 : hovered ? 1.03 : 1 }}
        transition={{ ...controlTransition, duration: reduced ? 0 : controlTransition.duration }} style={{
        color: paint.color,
        ...visualTransition,
        background: "transparent",
        display: "inline-grid",
        placeItems: "center",
        position: "relative",
        boxSizing: "border-box",
        flexShrink: 0,
        width: switching ? diameter * 2 : diameter,
        height: diameter,
        borderRadius: radius,
        border: "none",
        outline: focused ? `2px solid ${theme.foreground}` : "none",
        outlineOffset: 2,
    }}>
        <MaterialLayer material={material} />
        <SurfaceEdge material={material} />
        {switching ? <motion.span initial={false} animate={{ width: thumbWidth, x: (selected ? travel : -travel) * (direction === "rtl" ? -1 : 1) }}
            transition={{ ...controlTransition, duration: reduced ? 0 : controlTransition.duration }} style={{
                ...visualTransition,
                height: diameter - 6, borderRadius: diameter,
                background: paint.color
            }} /> : <motion.span initial={false} animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.7 }}
            transition={{ ...controlTransition, duration: reduced ? 0 : controlTransition.duration }} style={{ display: "grid", placeItems: "center" }}>
            {kind === "radio" ? <span style={{ ...visualTransition, width: diameter / 2, height: diameter / 2, borderRadius: "50%", background: "currentColor" }} />
                : <svg width={diameter - 4} height={diameter - 4} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="m3 8 3 3 7-7" initial={false}
                        animate={{ pathLength: selected && !indeterminate ? 1 : 0, opacity: selected && !indeterminate ? 1 : 0 }}
                        transition={{ ...controlTransition, duration: reduced ? 0 : controlTransition.duration }} />
                    <motion.path d="M4 8h8" initial={false}
                        animate={{ pathLength: indeterminate ? 1 : 0, opacity: indeterminate ? 1 : 0 }}
                        transition={{ ...controlTransition, duration: reduced ? 0 : controlTransition.duration }} />
                </svg>}
        </motion.span>}
    </motion.span>
}

export function toggleStyle(theme: ControlTheme, disabled: boolean, readOnly: boolean): CSSProperties {

    return {
        display: "flex",
        alignItems: "center",
        gap: theme.gap,
        minHeight: theme.height,
        width: "fit-content",
        cursor: disabled ? "not-allowed" : readOnly ? "default" : "pointer"
    }
}
