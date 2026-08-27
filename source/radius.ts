import type { CSSProperties } from "react"
import type { Appearance, Shapeable } from "@phreshos/core"
import { isScaleLevel, scale, type ScaleLevel } from "./scale.js"

/** An Appearance-derived level, pixel value, or explicit CSS corner radius. */
export type Radius = ScaleLevel | number | (string & {})

/** Shared semantic corner-radius capability for React UI components. */
export interface RadiusProps extends Shapeable<Radius> {}

/** Resolves a Radius while preserving explicit CSS and pixel values. */
export function resolveRadius(value: Radius | undefined, appearance: Appearance | null): CSSProperties["borderRadius"] {
  if (!isScaleLevel(value)) return value

  if (!appearance) throw new Error("A semantic radius requires an AppearanceProvider")

  return scale(appearance.radius.light, value)
}
