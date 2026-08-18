import type { CSSProperties } from "react"
import type { ThemeProperties } from "@phreshos/core"
import { isScaleLevel, scale, type ScaleLevel } from "@phreshos/core"

/** A Theme-derived level, pixel value, or explicit CSS spacing value. */
export type Spacing = ScaleLevel | number | (string & {})

/** Resolves spacing while preserving explicit CSS and pixel values. */
export function resolveSpacing(value: ScaleLevel, theme: ThemeProperties | null): number
export function resolveSpacing(value: Spacing | undefined, theme: ThemeProperties | null): CSSProperties["gap"]
export function resolveSpacing(value: Spacing | undefined, theme: ThemeProperties | null): CSSProperties["gap"] {
  if (!isScaleLevel(value)) return value

  if (!theme) throw new Error("Semantic spacing requires a ThemeProvider")

  return scale(theme.spacing, value)
}
