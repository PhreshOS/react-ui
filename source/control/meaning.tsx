import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"
import type { Color } from "../foundation/color.js"

const meaningIcons = { danger: CircleAlert, warning: TriangleAlert, success: CircleCheck } as const

/** The icon of a message's meaning: its color role, or `i` for anything else. */
export function meaningIcon(color: Color) {
  return meaningIcons[color as keyof typeof meaningIcons] ?? Info
}

/** Whether a message of this meaning interrupts, and is announced as it appears. */
export function urgentMeaning(color: Color) {
  return color === "danger" || color === "warning"
}
