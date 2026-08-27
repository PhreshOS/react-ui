import type { CSSProperties } from "react"
import type { Appearance } from "@phreshos/core"
import { isScaleLevel, scale, type ScaleLevel } from "./scale.js"

/** An Appearance-derived level, pixel value, or explicit CSS spacing value. */
export type Spacing = ScaleLevel | number | (string & {})

/** Resolves spacing while preserving explicit CSS and pixel values. */
export function resolveSpacing(value: ScaleLevel, appearance: Appearance | null): number
export function resolveSpacing(value: Spacing | undefined, appearance: Appearance | null): CSSProperties["gap"]
export function resolveSpacing(value: Spacing | undefined, appearance: Appearance | null): CSSProperties["gap"] {
  if (!isScaleLevel(value)) return value

  if (!appearance) throw new Error("Semantic spacing requires an AppearanceProvider")

  return scale(appearance.spacing.light, value)
}
