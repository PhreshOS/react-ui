import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Button as AriaButton } from "react-aria-components"
import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import { scale, type ScaleLevel } from "./scale.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"

type NativeButtonProps = Omit<AriaButtonProps, "children" | "className" | "color" | "isDisabled" | "isPending" | "onClick" | "onPress" | "style">

/** A semantic color from Appearance; omission uses background and foreground. */
export type ButtonColor = "primary" | "secondary" | "success" | "warning" | "danger" | "info"

/** Properties accepted by the shared interactive button. */
export interface ButtonProps extends NativeButtonProps, RadiusProps {
  /** Visible Button content. */
  readonly children?: ReactNode

  /** Palette tint for the flat fill. Omission keeps the Button neutral. */
  readonly color?: ButtonColor

  /** Native class name applied without replacing the component contract. */
  readonly className?: string

  /** Prevents focus and activation. */
  readonly disabled?: boolean

  /** Prevents activation while keeping the Button focusable. */
  readonly pending?: boolean

  /** Runs once for a normalized pointer, Enter, or Space activation. */
  readonly onPress?: () => void

  /** Derives the Button's spacing from Appearance's concrete default. */
  readonly size?: ScaleLevel

  /** Additional native styles that do not replace the Button's identity. */
  readonly style?: CSSProperties

}

/** An Appearance-aware action with normalized pointer and keyboard behavior. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    color,
    disabled = false,
    pending = false,
    onPress,
    radius = "medium",
    size = "medium",
    style,
    type = "button",
    ...properties
  },
  ref
) {
  const appearance = useAppearance()
  const spacing = scale(useResolveTheme(appearance.spacing), size)
  const borderRadius = resolveRadius(radius, appearance)
  const foreground = useResolveTheme(appearance.foreground)
  const background = useResolveTheme(appearance.background)
  const tint = useResolveTheme(color === undefined ? appearance.foreground : appearance[color])

  return <AriaButton
    {...properties}
    ref={ref}
    type={type}
    isDisabled={disabled}
    isPending={pending}
    onPress={onPress}
    style={({ isFocusVisible, isHovered, isPressed }) => buttonStyle({
      borderRadius,
      disabled,
      isFocusVisible,
      isHovered,
      isPressed,
      pending,
      size,
      spacing,
      background,
      foreground,
      tint,
      colored: color !== undefined,
      style
    })}
  >{children}</AriaButton>
})

function buttonStyle({
  borderRadius,
  disabled,
  isFocusVisible,
  isHovered,
  isPressed,
  pending,
  size,
  spacing,
  background,
  foreground,
  tint,
  colored,
  style
}: Readonly<{
  borderRadius: CSSProperties["borderRadius"]
  disabled: boolean
  isFocusVisible: boolean
  isHovered: boolean
  isPressed: boolean
  pending: boolean
  size: ScaleLevel
  spacing: number
  background: string
  foreground: string
  tint: string
  colored: boolean
  style: CSSProperties | undefined
}>): CSSProperties {
  const fontSize = buttonFontSizes[size]
  const height = Math.max(24, 24 + spacing)
  const interactive = !disabled && !pending
  const emphasis = interactive && isPressed ? 8 : interactive && isHovered ? 4 : 0
  const fill = (colored ? 16 : 8) + emphasis

  return {
    ...style,
    appearance: "none",
    boxSizing: "border-box",
    display: "inline-grid",
    gridAutoFlow: "column",
    gridAutoColumns: "max-content",
    placeItems: "center",
    flexShrink: 0,
    minWidth: 0,
    height,
    paddingBlock: 0,
    paddingInline: Math.max(8, spacing),
    gap: Math.max(4, spacing / 2),
    border: "none",
    borderRadius,
    outline: isFocusVisible ? `2px solid ${foreground}` : "none",
    outlineOffset: 2,
    color: foreground,
    background: `color-mix(in srgb, ${tint} ${fill}%, ${background})`,
    opacity: disabled ? 0.46 : pending ? 0.68 : 1,
    cursor: disabled ? "not-allowed" : pending ? "progress" : "pointer",
    font: "inherit",
    fontSize,
    fontWeight: 550,
    lineHeight: 1,
    textAlign: "center",
    textDecoration: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent"
  }
}

const buttonFontSizes: Readonly<Record<ScaleLevel, number>> = Object.freeze({
  xsmall: 11,
  small: 12,
  medium: 13,
  large: 14,
  xlarge: 15
})
