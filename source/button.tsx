import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Button as AriaButton } from "react-aria-components"
import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { ScaleLevel } from "./scale.js"
import type { RadiusProps } from "./radius.js"
import { controlFontSizes, useControlTheme, type ControlColor, type ControlTheme } from "./control.js"
import { SurfaceButton } from "./control-surface.js"
import type { MaterialOverrides } from "./material-options.js"

type NativeButtonProps = Omit<AriaButtonProps, "children" | "className" | "color" | "isDisabled" | "isPending" | "onClick" | "onPress" | "style">

/** A semantic color from Appearance; omission uses background and foreground. */
export type ButtonColor = ControlColor

/** Properties accepted by the shared interactive button. */
export interface ButtonProps extends NativeButtonProps, RadiusProps, MaterialOverrides {
  /** Visible Button content. */
  readonly children?: ReactNode

  /** Base color for the material. Omission keeps the Button neutral. */
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

  /** Native styles applied after Button defaults. */
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
    material,
    type = "button",
    ...properties
  },
  ref
) {
  const theme = useControlTheme({ color, radius, size })

  return <AriaButton
    {...properties}
    ref={ref}
    type={type}
    isDisabled={disabled}
    isPending={pending}
    onPress={onPress}
    render={(native, state) => <SurfaceButton native={native} material={material} paint={buttonPaint(theme, !disabled && !pending, state.isHovered, state.isPressed)} />}
    style={({ isFocusVisible, isHovered, isPressed }) => buttonStyle({
      theme,
      disabled,
      isFocusVisible,
      isHovered,
      isPressed,
      pending,
      size,
      style
    })}
  >{children}</AriaButton>
})

function buttonStyle({
  theme,
  disabled,
  isFocusVisible,
  isHovered,
  isPressed,
  pending,
  size,
  style
}: Readonly<{
  theme: ControlTheme
  disabled: boolean
  isFocusVisible: boolean
  isHovered: boolean
  isPressed: boolean
  pending: boolean
  size: ScaleLevel
  style: CSSProperties | undefined
}>): CSSProperties {
  const fontSize = controlFontSizes[size]
  const { spacing, foreground } = theme
  const height = Math.max(24, 24 + spacing)
  const interactive = !disabled && !pending
  const paint = buttonPaint(theme, interactive, isHovered, isPressed)

  return {
    ...theme.transition,
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
    borderRadius: theme.radius,
    outline: isFocusVisible ? `2px solid ${foreground}` : "none",
    outlineOffset: 2,
    ...paint,
    opacity: disabled ? 0.46 : pending ? 0.68 : 1,
    cursor: disabled ? "not-allowed" : pending ? "progress" : "pointer",
    font: "inherit",
    fontSize,
    fontWeight: 550,
    lineHeight: 1,
    textAlign: "center",
    textDecoration: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    ...style
  }
}

function buttonPaint(theme: ControlTheme, interactive: boolean, hovered: boolean, pressed: boolean) {
  const paints = theme.colored ? theme.paints.palette : theme.paints.neutral
  return interactive && pressed ? paints.pressed : interactive && hovered ? paints.hover : paints.rest
}
