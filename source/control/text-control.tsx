import type { CSSProperties, ReactNode } from "react"
import type { TextFieldProps } from "react-aria-components"
import type { RadiusProps } from "../foundation/radius.js"
import type { MaterialOverrides } from "../surface/material-options.js"
import { SurfaceView } from "../surface/surface.js"
import type { Color } from "../foundation/color.js"
import type { ControlMetrics, ControlOverrides, ControlProps, FieldProps } from "./control.js"

/** Shared contract for native text-entry fields. */
export interface TextControlProps extends Omit<TextFieldProps, ControlOverrides>, ControlProps, FieldProps, RadiusProps, MaterialOverrides {
  readonly placeholder?: string
  readonly readOnly?: boolean
}

type FieldState = Readonly<{ isFocused: boolean, isHovered: boolean, isInvalid: boolean, isDisabled?: boolean }>

/**
 * The recessed well that holds typed content. Native text elements cannot host
 * Surface layers, so the well wraps the element that React Aria renders.
 */
export function TextWell({ children, color, material, metrics, state, style }: Readonly<{
  children: ReactNode
  color: Color
  material: MaterialOverrides["material"]
  metrics: ControlMetrics
  state: FieldState
  style?: CSSProperties
}>) {
  return <SurfaceView
    as="span"
    color={color}
    depth="recessed"
    material={material}
    radius={metrics.radius}
    interaction={{ hovered: state.isHovered, focusVisible: state.isFocused, invalid: state.isInvalid }}
    style={{ display: "grid", minWidth: 0, ...style }}
  >{children}</SurfaceView>
}

/** Layout of the native element inside its well. */
export function nativeTextStyle(metrics: ControlMetrics, multiline: boolean): CSSProperties {
  return {
    appearance: "none",
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    height: multiline ? "auto" : metrics.height,
    minHeight: metrics.height,
    paddingBlock: multiline ? Math.max(6, metrics.spacing / 2) : 0,
    paddingInline: metrics.inset,
    border: 0,
    borderRadius: "inherit",
    outline: "none",
    background: "transparent",
    color: "inherit",
    caretColor: "currentColor",
    font: "inherit",
    lineHeight: 1.45,
    resize: multiline ? "vertical" : undefined
  }
}
