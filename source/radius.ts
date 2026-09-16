import type { CSSProperties } from "react"
import type { Appearance } from "@phreshos/core"
import { isScaleLevel, scale, type ScaleLevel } from "./scale.js"

/** An Appearance-derived level, fully rounded shape, pixel value, or explicit CSS corner radius. */
export type Radius = ScaleLevel | "full" | number | (string & {})

/** Shared semantic corner-radius capability for React UI components. */
export interface RadiusProps { readonly radius?: Radius }

/** Resolves a Radius while preserving explicit CSS and pixel values. */
export function resolveRadius(value: Radius | undefined, appearance: Appearance | null): CSSProperties["borderRadius"] {
  if (value === "full") return "9999px"

  if (!isScaleLevel(value)) return value

  if (!appearance) throw new Error("A semantic radius requires a UIProvider")

  return scale(appearance.radius, value)
}
