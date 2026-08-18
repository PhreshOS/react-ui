import type { CSSProperties } from "react"
import type { Shapeable, ThemeProperties } from "@phreshos/core"
import { isScaleLevel, scale, type ScaleLevel } from "@phreshos/core"

/** A Theme-derived level, pixel value, or explicit CSS corner radius. */
export type Radius = ScaleLevel | number | (string & {})

/** Shared semantic corner-radius capability for React UI components. */
export interface RadiusProps extends Shapeable<Radius> {}

/** Resolves a Radius while preserving explicit CSS and pixel values. */
export function resolveRadius(value: Radius | undefined, theme: ThemeProperties | null): CSSProperties["borderRadius"] {
  if (!isScaleLevel(value)) return value

  if (!theme) throw new Error("A semantic radius requires a ThemeProvider")

  return scale(theme.radius, value)
}
