import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"
import { FieldError, Label, Text } from "react-aria-components"
import { useResolvedAppearance } from "./appearance-context.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { scale, type ScaleLevel } from "./scale.js"
import { colorOpacity, solidColors } from "./color.js"
import { resolveSolidColor, type Color } from "./color.js"
import { controlTransition, visualTransition } from "./motion-style.js"
import type { Transition } from "motion/react"

/** Semantic Appearance colors accepted by interactive controls. */
export type ControlColor = Color

export interface ControlProps {
    readonly size?: ScaleLevel
    readonly color?: ControlColor
    readonly className?: string
    readonly style?: CSSProperties
    readonly disabled?: boolean
}

export interface FieldProps {
    /** Visible accessible label. Otherwise supply aria-label or aria-labelledby. */
    readonly label?: ReactNode
    readonly description?: ReactNode
    readonly errorMessage?: ReactNode
    readonly required?: boolean
    readonly invalid?: boolean
}

/** Names owned by our contract, not a second set of primitive-specific aliases. */
export type ControlOverrides = keyof ControlProps | keyof FieldProps | "children" | "isDisabled" | "isRequired" | "isInvalid"

export const controlFontSizes: Readonly<Record<ScaleLevel, CSSProperties["fontSize"]>> = Object.freeze({
    xsmall: "0.8125em",
    small: "0.875em",
    medium: "1em",
    large: "1.125em",
    xlarge: "1.25em"
})

/** Shared interaction attenuation, derived consistently across control families. */
export const controlOpacity = Object.freeze({
    disabled: 0.46,
    pending: 0.68,
    secondary: 0.7,
    placeholder: 0.6,
    separator: 0.14
})

/** Shared emphasis used by labels and control-owned headings. */
export const controlFontWeight = 600

type SolidColors = ReturnType<typeof solidColors>

export interface ControlTheme {
    readonly transition: CSSProperties
    readonly motionTransition: Transition
    readonly animations: boolean
    readonly spacing: number
    readonly foreground: string
    readonly background: string
    readonly tint: string
    readonly focusColor: string
    readonly danger: string
    readonly paints: {
        readonly palette: SolidColors
        readonly neutral: SolidColors
        readonly danger: SolidColors
    }
    readonly radius: CSSProperties["borderRadius"]
    readonly fontSize: CSSProperties["fontSize"]
    readonly indicatorSize: number
    readonly height: number
    readonly gap: number
}

export function useControlTheme({ size = "medium", color, radius = "medium" }: ControlProps & RadiusProps): ControlTheme {

    const resolved = useResolvedAppearance()
    const { appearance, colors } = resolved
    const transition = useMemo(
        () => visualTransition(resolved.transaction, resolved.preferences.animations),
        [resolved.transaction, resolved.preferences.animations]
    )
    const motionTransition = useMemo(
        () => controlTransition(resolved.transaction, resolved.preferences.animations),
        [resolved.transaction, resolved.preferences.animations]
    )
    const spacing = scale(appearance.spacing, size)
    const foreground = colors.foreground
    const background = colors.background
    const tint = resolveSolidColor(color ?? "default:base", colors)
    const neutral = resolveSolidColor("default:base", colors)
    const focus = resolveSolidColor("warning:base", colors)
    const danger = resolveSolidColor("danger:base", colors)
    const paints = useMemo(() => ({
        palette: solidColors(tint, background, foreground),
        neutral: solidColors(neutral, background, foreground),
        danger: solidColors(danger, background, foreground)
    }), [tint, neutral, background, foreground, danger])

    return useMemo(() => ({
        transition,
        motionTransition,
        animations: resolved.preferences.animations,
        spacing,
        foreground,
        background,
        tint,
        focusColor: colorOpacity(focus, 0.2),
        danger,
        paints,
        radius: resolveRadius(radius, appearance),
        fontSize: controlFontSizes[size],
        indicatorSize: Math.max(16, 16 + spacing / 4),
        height: Math.max(24, 24 + spacing),
        gap: Math.max(4, spacing / 2)
    }), [appearance, colors, transition, motionTransition, resolved.preferences.animations, spacing, foreground, background, tint, focus, danger, paints, radius, size])
}

export function fieldStyle(theme: ControlTheme, disabled = false, style?: CSSProperties): CSSProperties {

    return {
        ...style,
        ...theme.transition,
        display: "grid",
        gap: theme.gap,
        minWidth: 0,
        color: theme.foreground,
        fontFamily: "inherit",
        fontSize: theme.fontSize,
        lineHeight: 1.5,
        opacity: disabled ? controlOpacity.disabled : 1
    }
}

export function controlPaint(theme: ControlTheme, focused: boolean, invalid: boolean, hovered = false) {
    const paints = invalid ? theme.paints.danger : theme.paints.palette
    return focused ? paints.pressed : hovered ? paints.hover : paints.rest
}

export function controlStyle(theme: ControlTheme, focused: boolean, invalid: boolean, hovered = false, focusVisible = focused): CSSProperties {

    const paint = controlPaint(theme, focused, invalid, hovered)

    return {
        ...theme.transition,
        appearance: "none",
        boxSizing: "border-box",
        width: "100%",
        minWidth: 0,
        height: theme.height,
        paddingBlock: 0,
        paddingInline: Math.max(8, theme.spacing),
        border: 0,
        borderRadius: theme.radius,
        outline: focusVisible ? `1px solid ${theme.focusColor}` : "none",
        outlineOffset: 1,
        ...paint,
        caretColor: paint.color,
        font: "inherit",
        lineHeight: 1.5
    }
}

export function FieldLabel({ label }: Pick<FieldProps, "label">) {

    return label == null ? null : <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>
}

export function FieldFeedback({ description, errorMessage, theme }: Pick<FieldProps, "description" | "errorMessage"> & { readonly theme: ControlTheme }) {

    return <>
        {description != null && <Text slot="description" style={{ fontSize: "0.92em", opacity: controlOpacity.secondary }}>{description}</Text>}
        <FieldError style={{ fontSize: "0.92em", color: theme.danger }}>{errorMessage}</FieldError>
    </>
}
