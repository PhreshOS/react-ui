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
