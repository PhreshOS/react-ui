import type { CSSProperties, ReactNode } from "react"
import { Button as AriaButton, type ButtonProps as AriaButtonProps, type ButtonRenderProps } from "react-aria-components"
import type { ControlMetrics } from "./control.js"
import { surfaceRender } from "./surface-render.js"

/**
 * A quiet button held at the end of a field's well, such as a date picker's
 * calendar or a number field's steppers. It veils like any quiet control and
 * sits the same distance from every edge of the well.
 */
export function FieldButton({ metrics, children, style, ...properties }: Readonly<Omit<AriaButtonProps, "children" | "render" | "style"> & {
  metrics: ControlMetrics
  children: ReactNode
  style?: CSSProperties
}>) {
  const size = metrics.height - 8

  return <AriaButton
    {...properties}
    render={surfaceRender<ButtonRenderProps>("button", state => ({
      color: "transparent",
      radius: metrics.radius,
      interaction: { hovered: state.isHovered, pressed: state.isPressed, focusVisible: state.isFocusVisible, disabled: state.isDisabled }
    }))}
    style={{
      appearance: "none",
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto",
      width: size,
      height: size,
      padding: 0,
      border: 0,
      background: "none",
      cursor: "pointer",
      ...style
    }}
  >{children}</AriaButton>
}
