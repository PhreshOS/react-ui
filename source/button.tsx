import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Button as AriaButton, type ButtonProps as AriaButtonProps, type ButtonRenderProps } from "react-aria-components"
import { controlOpacity, transition, useControlMetrics, type ControlProps } from "./control/control.js"
import { surfaceRender } from "./control/surface-render.js"
import type { Color } from "./foundation/color.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import type { ShadowOverrides } from "./surface/shadow-options.js"

type NativeButtonProps = Omit<AriaButtonProps, "children" | "className" | "color" | "isDisabled" | "isPending" | "onClick" | "render" | "style">

/** A color from Appearance or CSS; omission keeps the Button neutral. */
export type ButtonColor = Color

export interface ButtonProps extends NativeButtonProps, ControlProps, RadiusProps, MaterialOverrides, ShadowOverrides {
  readonly children?: ReactNode
  /** Prevents activation while keeping the Button focusable. */
  readonly pending?: boolean
  /** Runs once for a normalized pointer, Enter, or Space activation. */
  readonly onPress?: () => void
}

/** A raised Surface you act on. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  color = "default",
  disabled,
  pending = false,
  radius,
  size,
  style,
  className,
  material,
  shadow,
  type = "button",
  ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)

  // Disabled state is read from React Aria, so a Button placed in a slot, such
  // as a calendar's month buttons, follows the owner that disables it.
  return <AriaButton
    {...properties}
    ref={ref}
    type={type}
    className={className}
    isDisabled={disabled}
    isPending={pending}
    render={surfaceRender<ButtonRenderProps>("button", state => ({
      color,
      material,
      shadow,
      radius: metrics.radius,
      interaction: {
        hovered: !state.isDisabled && !pending && state.isHovered,
        pressed: !state.isDisabled && !pending && state.isPressed,
        focusVisible: state.isFocusVisible,
        disabled: state.isDisabled
      }
    }))}
    style={state => buttonStyle(metrics, !state.isDisabled && !pending && state.isPressed, state.isDisabled, pending, style)}
  >{children}</AriaButton>
})

function buttonStyle(metrics: ReturnType<typeof useControlMetrics>, pressed: boolean, disabled: boolean, pending: boolean, style: CSSProperties | undefined): CSSProperties {
  return {
    ...transition(metrics.visual, "box-shadow, color, outline-color, opacity, scale"),
    appearance: "none",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: metrics.gap,
    flexShrink: 0,
    minWidth: 0,
    height: metrics.height,
    paddingBlock: 0,
    paddingInline: metrics.inset,
    border: 0,
    background: "none",
    font: "inherit",
    fontSize: metrics.fontSize,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: "nowrap",
    textDecoration: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    cursor: disabled ? "not-allowed" : pending ? "progress" : "pointer",
    scale: pressed ? "0.97" : "1",
    ...(pending ? { opacity: controlOpacity.pending } : {}),
    ...style
  }
}
