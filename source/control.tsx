import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"
import { FieldError, Label, Text } from "react-aria-components"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { scale, type ScaleLevel } from "./scale.js"
import { colorShade, solidColors } from "./color.js"

/** Semantic Appearance colors accepted by interactive controls. */
export type ControlColor = "primary" | "secondary" | "success" | "warning" | "danger" | "info"

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

/** Shared response for small control movements, never value interpolation. */
export const controlSpring = { type: "spring", stiffness: 520, damping: 32, mass: 0.7 } as const

export function useControlTheme({ size = "medium", color, radius = "medium" }: ControlProps & RadiusProps) {

    const appearance = useAppearance()
    const spacing = scale(useResolveTheme(appearance.spacing), size)
    const foreground = useResolveTheme(appearance.foreground)
    const background = useResolveTheme(appearance.background)
    const tint = useResolveTheme(appearance[color ?? "primary"])
    const danger = useResolveTheme(appearance.danger)
    const paints = useMemo(() => ({
        palette: solidColors(tint, background, foreground),
        neutral: solidColors(colorShade(background, 0.08), background, foreground),
        danger: solidColors(danger, background, foreground)
    }), [tint, background, foreground, danger])

    return {
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

export type ControlTheme = ReturnType<typeof useControlTheme>

export function fieldStyle(theme: ControlTheme, disabled = false, style?: CSSProperties): CSSProperties {

    return {
        ...style,
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
