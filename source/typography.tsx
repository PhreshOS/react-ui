import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Heading as AriaHeading, Keyboard as AriaKeyboard, Text as AriaText } from "react-aria-components"
import { controlFontSizes, controlFontWeight, controlOpacity, useControlMetrics } from "./control/control.js"
import { scale, scaleMultiplier, type ScaleLevel } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { Surface } from "./surface/surface.js"

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/** The size each heading level takes unless `size` says otherwise. */
const levelSizes: Readonly<Record<HeadingLevel, ScaleLevel>> = Object.freeze({ 1: "xlarge", 2: "large", 3: "medium", 4: "small", 5: "xsmall", 6: "xsmall" })

/**
 * Headings grow by the same ladder Appearance values scale by, anchored at the
 * large step: a medium heading is one and a half times its surrounding text,
 * an xlarge heading twice.
 */
const headingGrowth = scale(1, "large")

export interface HeadingProps {
  readonly children?: ReactNode
  /** The document level, from 1 to 6. */
  readonly level?: HeadingLevel
  /** The visual size, when it should differ from the level's. */
  readonly size?: ScaleLevel
  readonly id?: string
  readonly className?: string
  readonly style?: CSSProperties
}

/** A heading sized relative to the text around it, so it fits any context. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading({ level = 2, size, style, ...properties }, ref) {
  return <AriaHeading {...properties} ref={ref} level={level} style={{
    margin: 0,
    fontSize: `${scaleMultiplier(headingGrowth, size ?? levelSizes[level])}em`,
    fontWeight: controlFontWeight,
    lineHeight: 1.2,
    textWrap: "balance",
    ...style
  }} />
})

export interface TextProps {
  readonly children?: ReactNode
  /** `secondary` recedes to the strength of supporting text, like descriptions. */
  readonly tone?: "default" | "secondary"
  /** The control text scale; omitted, the text keeps the size around it. */
  readonly size?: ScaleLevel
  /** A slot name when the text describes a field or item, such as `description`. */
  readonly slot?: string
  readonly elementType?: string
  readonly id?: string
  readonly className?: string
  readonly style?: CSSProperties
}

/** Running text in the tone and scale of the interface. */
export const Text = forwardRef<HTMLElement, TextProps>(function Text({ tone = "default", size, style, ...properties }, ref) {
  return <AriaText {...properties} ref={ref} style={{
    fontSize: size === undefined ? undefined : controlFontSizes[size],
    lineHeight: textLineHeight,
    opacity: tone === "secondary" ? controlOpacity.secondary : undefined,
    ...style
  }} />
})

export interface KbdProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

/** Running text sets its lines at this height, relative to its size. */
const textLineHeight = 1.45

/**
 * A key to press, drawn as a small raised keycap. Its label takes the control
 * text scale, and the cap is as tall as the line of text around it, so it
 * never stretches the line.
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd({ children, className, style }, ref) {
  const metrics = useControlMetrics("xsmall")
  const label = Number.parseFloat(controlFontSizes.medium)
  const cap = `${textLineHeight / label}em`
  return <AriaKeyboard ref={ref} className={className} style={{ display: "inline-block", verticalAlign: "middle", lineHeight: 1 }}>
    <Surface as="span" radius={metrics.radius} shadow={false} style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: cap,
      height: cap,
      paddingInline: metrics.gap,
      boxSizing: "border-box",
      fontSize: controlFontSizes.medium,
      fontWeight: controlFontWeight,
      fontVariantNumeric: "tabular-nums",
      lineHeight: 1,
      ...style
    }}>{children}</Surface>
  </AriaKeyboard>
})

export interface CodeProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

/** Code inside text, set in the system monospace font in a shallow recess. */
export const Code = forwardRef<HTMLElement, CodeProps>(function Code({ children, className, style }, ref) {
  const visual = useVisual()
  return <Surface as="code" ref={ref} className={className} color="background" depth="recessed" radius={scale(visual.radius, "small")} style={{
    paddingInline: scale(visual.spacing, "xsmall"),
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.9em",
    ...style
  }}>{children}</Surface>
})
