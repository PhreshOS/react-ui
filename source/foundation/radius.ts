import type { CSSProperties } from "react"
import { isScaleLevel, scale, type ScaleLevel } from "./scale.js"

/** An Appearance-derived level, fully rounded shape, pixel value, or explicit CSS corner radius. */
export type Radius = ScaleLevel | "full" | number | (string & {})

/** Shared semantic corner-radius capability for React UI components. */
export interface RadiusProps { readonly radius?: Radius }

/**
 * Resolves a Radius against a base radius: a level scales the base, `full`
 * rounds completely, and pixels and CSS pass through. Only the base is needed,
 * so it can come from an Appearance or from anywhere else.
 */
export function resolveRadius(value: Radius | undefined, radius: number): CSSProperties["borderRadius"] {
  if (value === "full") return "9999px"
  return isScaleLevel(value) ? scale(radius, value) : value
}
