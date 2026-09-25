import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ProgressBar as AriaProgressBar } from "react-aria-components"
import type { ProgressBarProps as AriaProgressBarProps } from "react-aria-components"
import { motion } from "motion/react"
import { useAppearance } from "./appearance-context.js"
import { colorOpacity } from "./color.js"
import { useControlTheme } from "./control.js"
import type { ControlColor } from "./control.js"
import { scale, type ScaleLevel } from "./scale.js"

type NativeSpinnerProps = Omit<
  AriaProgressBarProps,
  | "aria-hidden"
  | "aria-label"
  | "aria-labelledby"
  | "children"
  | "className"
  | "formatOptions"
  | "isIndeterminate"
  | "maxValue"
  | "minValue"
  | "slot"
  | "style"
  | "value"
  | "valueLabel"
>

interface SpinnerVisualProps extends NativeSpinnerProps {
  /** Native class name applied without replacing the component contract. */
  readonly className?: string

  /** Color of the moving indicator. */
  readonly color?: ControlColor

  /** Derives the indicator diameter from Appearance. */
  readonly size?: ScaleLevel

  /** Native styles applied after Spinner defaults. */
  readonly style?: CSSProperties
}

type NamedSpinnerProps = Readonly<{
  /** Accessible operation name announced with indeterminate progress semantics. */
  label: string
  decorative?: false
}>

type DecorativeSpinnerProps = Readonly<{
  /** Hides the Spinner when surrounding content already communicates progress. */
  decorative: true
  label?: never
}>

export type SpinnerProps = SpinnerVisualProps & (NamedSpinnerProps | DecorativeSpinnerProps)

/** Compact indeterminate progress, either named or explicitly decorative. */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner({
  className,
  color = "default:base",
  decorative = false,
  label,
  size = "medium",
  style,
  ...properties
}, ref) {
  const appearance = useAppearance()
  const theme = useControlTheme({ color, size })
  // Spinner is a standalone status, so its scale must remain visibly distinct
  // instead of inheriting the compact indicator size used inside controls.
  const diameter = appearance.spacing + scale(appearance.spacing, size)
  const rootStyle: CSSProperties = {
    display: "inline-grid",
    placeItems: "center",
    boxSizing: "border-box",
    flexShrink: 0,
    width: diameter,
    height: diameter,
    verticalAlign: "middle",
    ...style
  }
  const indicator = <SpinnerIndicator contextualColor={color === "currentColor"} theme={theme} />

  if (decorative) return <div
    {...properties}
    ref={ref}
    aria-hidden="true"
    className={className}
    style={rootStyle}
  >{indicator}</div>

  return <AriaProgressBar
    {...properties}
    ref={ref}
    aria-label={label}
    className={className}
    isIndeterminate
    style={rootStyle}
  >{indicator}</AriaProgressBar>
})

function SpinnerIndicator({ contextualColor, theme }: Readonly<{
  contextualColor: boolean
  theme: ReturnType<typeof useControlTheme>
}>) {
  const duration = typeof theme.motionTransition.duration === "number"
    ? Math.max(0.6, theme.motionTransition.duration * 4)
    : 0.8
  // currentColor belongs to the surrounding surface, whose canvas is not the
  // Appearance canvas. Alpha preserves contrast against that actual owner.
  const track = contextualColor
    ? colorOpacity("currentColor", 0.25)
    : theme.paints.subtle.rest.background
  const fill = contextualColor ? "currentColor" : theme.paints.palette.rest.background

  return <motion.svg
    data-spinner-indicator=""
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    width="100%"
    height="100%"
    fill="none"
    initial={false}
    animate={{ rotate: theme.animations ? [0, 360] : 0 }}
    transition={theme.animations ? { duration, repeat: Infinity, ease: "linear" } : { duration: 0 }}
    style={{ display: "block", transformOrigin: "center" }}
  >
    <circle
      data-spinner-track=""
      cx="12"
      cy="12"
      r="9"
      stroke={track}
      strokeWidth="3"
    />
    <circle
      data-spinner-fill=""
      cx="12"
      cy="12"
      r="9"
      pathLength="100"
      stroke={fill}
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="68 32"
    />
  </motion.svg>
}
