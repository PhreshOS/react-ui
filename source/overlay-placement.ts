import type { Placement } from "react-aria-components"
import type { Direction } from "./direction.js"

/** Resolves logical placement before it reaches the overlay primitive. */
export function resolveDirectionalPlacement(placement: Placement, direction: Direction): Placement {
  const start = direction === "rtl" ? "right" : "left"
  const end = direction === "rtl" ? "left" : "right"
  return placement.replace(/\bstart\b/g, start).replace(/\bend\b/g, end) as Placement
}
