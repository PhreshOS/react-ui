import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Button as AriaButton } from "react-aria-components"
import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import { scale, type ScaleLevel } from "@phreshos/core"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { useTheme } from "./theme-provider.js"

type NativeButtonProps = Omit<AriaButtonProps, "children" | "className" | "isDisabled" | "isPending" | "onClick" | "onPress" | "style">

/** Properties accepted by the shared interactive button. */
export interface ButtonProps extends NativeButtonProps, RadiusProps {
  /** Visible Button content. */
  readonly children?: ReactNode

  /** Native class name applied without replacing the component contract. */
  readonly className?: string

  /** Prevents focus and activation. */
  readonly disabled?: boolean

  /** Prevents activation while keeping the Button focusable. */
  readonly pending?: boolean

  /** Runs once for a normalized pointer, Enter, or Space activation. */
  readonly onPress?: () => void

  /** Derives the Button's spacing from the Theme's concrete default. */
  readonly size?: ScaleLevel

  /** Additional native styles that do not replace the Button's identity. */
  readonly style?: CSSProperties

}

/** A Theme-aware action with normalized pointer and keyboard behavior. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
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
  const theme = useTheme()
  const spacing = scale(theme.spacing, size)
  const borderRadius = resolveRadius(radius, theme)

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
      foreground: theme.foreground,
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
  foreground,
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
  foreground: string
  style: CSSProperties | undefined
}>): CSSProperties {
  const fontSize = buttonFontSizes[size]
  const height = Math.max(size === "xsmall" ? 24 : 28, 20 + spacing)

  return {
    ...style,
    appearance: "none",
    display: "inline-grid",
    gridAutoFlow: "column",
    gridAutoColumns: "max-content",
    placeItems: "center",
    flexShrink: 0,
    minWidth: 0,
    height,
    paddingBlock: 0,
    paddingInline: Math.max(8, spacing * 2 / 3),
    gap: Math.max(4, spacing / 2),
    border: "1px solid rgba(255, 255, 255, 0.45)",
    borderRadius,
    outline: "none",
    color: foreground,
    backgroundColor: `rgba(255, 255, 255, ${isPressed ? 0.42 : isHovered ? 0.5 : 0.3})`,
    boxShadow: isFocusVisible
      ? "0 0 0 2px rgba(255, 255, 255, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
    opacity: disabled ? 0.46 : pending ? 0.68 : 1,
    transform: isPressed ? "scale(0.95)" : "scale(1)",
    transition: "background-color 100ms ease, box-shadow 100ms ease, opacity 100ms ease, transform 100ms ease",
    cursor: disabled ? "not-allowed" : pending ? "progress" : "pointer",
    font: "inherit",
    fontSize,
    fontWeight: 650,
    lineHeight: 1,
    textAlign: "center",
    textDecoration: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent"
  }
}

const buttonFontSizes: Readonly<Record<ScaleLevel, number>> = Object.freeze({
  xsmall: 10,
  small: 11,
  medium: 12,
  large: 13,
  xlarge: 14
})
