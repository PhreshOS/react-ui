import type { CSSProperties } from "react"
import { isScaleLevel, scale, type ScaleLevel } from "./scale.js"

/** An Appearance-derived level, pixel value, or explicit CSS spacing value. */
export type Spacing = ScaleLevel | number | (string & {})

/**
 * Resolves a spacing value against a base spacing: a level scales the base,
 * while pixels and CSS pass through. Only the base is needed, so it can come
 * from an Appearance or from anywhere else.
 */
export function resolveSpacing(value: ScaleLevel, spacing: number): number
export function resolveSpacing(value: Spacing | undefined, spacing: number): CSSProperties["gap"]
export function resolveSpacing(value: Spacing | undefined, spacing: number): CSSProperties["gap"] {
  return isScaleLevel(value) ? scale(spacing, value) : value
}

/**
 * The padding of a Surface that holds content, such as a dialog, a panel's
 * content, or an alert: one level above the spacing a control pads with, so a
 * container never wraps its content as tightly as a button wraps its label.
 */
export function containerPadding(spacing: number): number {
  return scale(spacing, "large")
}
