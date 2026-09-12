import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"
import { FieldError, Label, Text } from "react-aria-components"
import { useAppearance, useThemedValue } from "./appearance-provider.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { scale, type ScaleLevel } from "./scale.js"
import { solidColors } from "./color.js"
import { useResolveSolidColor, type Color } from "./color.js"
import { useVisualTransition } from "./motion-style.js"

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

export const controlFontSizes: Readonly<Record<ScaleLevel, number>> = Object.freeze({
    xsmall: 11,
    small: 12,
    medium: 13,
    large: 14,
    xlarge: 15
})

type SolidColors = ReturnType<typeof solidColors>

export interface ControlTheme {
    readonly transition: CSSProperties
    readonly spacing: number
    readonly foreground: string
    readonly background: string
    readonly tint: string
    readonly colored: boolean
    readonly danger: string
    readonly paints: {
        readonly palette: SolidColors
        readonly neutral: SolidColors
        readonly danger: SolidColors
    }
    readonly radius: CSSProperties["borderRadius"]
    readonly fontSize: number
    readonly height: number
    readonly gap: number
}

export function useControlTheme({ size = "medium", color, radius = "medium" }: ControlProps & RadiusProps): ControlTheme {

    const appearance = useAppearance()
    const transition = useVisualTransition()
    const spacing = scale(appearance.spacing, size)
    const colors = useThemedValue(appearance.colors)
    const foreground = colors.foreground
    const background = colors.background
    const tint = useResolveSolidColor(color ?? "primary:base")
    const danger = useResolveSolidColor("danger:base")
    const paints = useMemo(() => ({
        palette: solidColors(tint, background, foreground),
        neutral: solidColors(background, background, foreground),
        danger: solidColors(danger, background, foreground)
    }), [tint, background, foreground, danger])

    return {
        transition,
        spacing,
        foreground,
        background,
        tint,
        colored: color !== undefined,
        danger,
        paints,
        radius: resolveRadius(radius, appearance),
        fontSize: controlFontSizes[size],
        height: Math.max(24, 24 + spacing),
        gap: Math.max(4, spacing / 2)
    }
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
        opacity: disabled ? 0.46 : 1
    }
}

export function controlPaint(theme: ControlTheme, focused: boolean, invalid: boolean, hovered = false) {
    const paints = invalid ? theme.paints.danger : theme.colored ? theme.paints.palette : theme.paints.neutral
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
        outline: focusVisible ? `2px solid ${theme.foreground}` : "none",
        outlineOffset: 2,
        ...paint,
        caretColor: paint.color,
        font: "inherit",
        lineHeight: 1.5
    }
}

export function FieldLabel({ label }: Pick<FieldProps, "label">) {

    return label == null ? null : <Label style={{ fontWeight: 550 }}>{label}</Label>
}

export function FieldFeedback({ description, errorMessage, theme }: Pick<FieldProps, "description" | "errorMessage"> & { readonly theme: ControlTheme }) {

    return <>
        {description != null && <Text slot="description" style={{ fontSize: "0.92em", opacity: 0.7 }}>{description}</Text>}
        <FieldError style={{ fontSize: "0.92em", color: theme.danger }}>{errorMessage}</FieldError>
    </>
}
