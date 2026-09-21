import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Label, ProgressBar as AriaProgressBar } from "react-aria-components"
import type { ProgressBarProps as AriaProgressBarProps } from "react-aria-components"
import { motion } from "motion/react"
import { controlFontWeight, controlOpacity, fieldStyle, useControlTheme } from "./control.js"
import type { ControlColor } from "./control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { ScaleLevel } from "./scale.js"

type NativeProgressBarProps = Omit<
  AriaProgressBarProps,
  "children" | "className" | "isIndeterminate" | "style"
>

export interface ProgressBarProps extends NativeProgressBarProps {
  /** Native class name applied without replacing the component contract. */
  readonly className?: string

  /** Color used for the completed or moving portion. */
  readonly color?: ControlColor

  /** Displays progress without asserting a current value. */
  readonly indeterminate?: boolean

  /** Visible label associated with the progress value. */
  readonly label?: ReactNode

  /** Derives typography and track thickness from Appearance. */
  readonly size?: ScaleLevel

  /** Native styles applied after ProgressBar defaults. */
  readonly style?: CSSProperties
}

/** Determinate or indeterminate progress for an operation over time. */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar({
  className,
  color = "default:base",
  indeterminate = false,
  label,
  size = "medium",
  style,
  value,
  minValue = 0,
  maxValue = 100,
  ...properties
}, ref) {
  const theme = useControlTheme({ color, size })
  const direction = resolveDirection(properties.dir, useDirection())
  const thickness = Math.max(2, Math.round(theme.spacing / 2))
  const sweep = direction === "rtl" ? ["100%", "-350%"] : ["-100%", "350%"]
  const duration = typeof theme.motionTransition.duration === "number"
    ? theme.motionTransition.duration * 10
    : 1.2

  return <AriaProgressBar
    {...properties}
    ref={ref}
    className={className}
    value={value}
    minValue={minValue}
    maxValue={maxValue}
    isIndeterminate={indeterminate}
    style={{
      ...fieldStyle(theme, false),
      width: "100%",
      ...style
    }}
  >{state => {
    const output = properties.valueLabel ?? state.valueText
    const showHeading = label != null || (!state.isIndeterminate && output != null)
    const moving = state.isIndeterminate && theme.animations

    return <>
      {showHeading && <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: theme.gap }}>
        {label != null && <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>}
        {!state.isIndeterminate && output != null && <span style={{ fontVariantNumeric: "tabular-nums", opacity: controlOpacity.secondary }}>{output}</span>}
      </span>}
      <span
        data-progress-track=""
        aria-hidden="true"
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          height: thickness,
          overflow: "hidden",
          borderRadius: thickness,
          background: theme.paints.subtle.rest.background
        }}
      >
        <motion.span
          data-progress-fill=""
          initial={false}
          animate={{ x: moving ? sweep : "0%" }}
          transition={moving
            ? { ...theme.motionTransition, duration, repeat: Infinity }
            : theme.motionTransition}
          style={{
            ...theme.transition,
            position: "absolute",
            insetBlock: 0,
            insetInlineStart: state.isIndeterminate && !moving ? "30%" : 0,
            display: "block",
            width: state.isIndeterminate ? "40%" : `${state.percentage ?? 0}%`,
            borderRadius: "inherit",
            background: theme.paints.palette.rest.background,
            transitionProperty: "width"
          }}
        />
      </span>
    </>
  }}</AriaProgressBar>
})
