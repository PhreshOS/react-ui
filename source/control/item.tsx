import type { CSSProperties } from "react"
import { colorLevel, resolveColor, type Color, type ColorLevel } from "../foundation/color.js"
import type { Visual } from "../foundation/visual.js"
import { surfacePaint, type SurfaceInteraction } from "../surface/surface.js"
import { transition, type ControlMetrics } from "./control.js"
import type { SurfaceRenderProps } from "./surface-render.js"
import { Check } from "lucide-react"
import { iconProps } from "./icon.js"

/**
 * The level that marks what is selected, in every collection and inside a
 * calendar range.
 */
export const selectionLevel = "subtle" satisfies ColorLevel

export type ItemState = Readonly<{
  selected: boolean
  hovered: boolean
  pressed: boolean
  focusVisible: boolean
  disabled: boolean
}>

/**
 * One entry of a collection. At rest it has no paint of its own; hover and
 * press veil it, and selection lays the selection level of the collection
 * color beneath it. Every collection uses this same treatment.
 */
export function itemSurface(visual: Visual, color: Color, state: ItemState, radius: CSSProperties["borderRadius"]): SurfaceRenderProps {
  return {
    color: state.selected ? colorLevel(resolveColor(color, visual.colors), selectionLevel, visual.colors) : "transparent",
    depth: "flat",
    material: "none",
    radius,
    interaction: itemInteraction(state)
  }
}

/** The same treatment as a plain paint, for elements that cannot host a Surface. */
export function itemPaint(visual: Visual, color: Color, state: ItemState): Readonly<{ background: string, color: string }> {
  const paint = surfacePaint(visual, state.selected ? colorLevel(resolveColor(color, visual.colors), selectionLevel, visual.colors) : "transparent", "flat", "none", false, itemInteraction(state))
  return { background: paint.fill, color: paint.text }
}

function itemInteraction(state: ItemState): SurfaceInteraction {
  return { hovered: state.hovered, pressed: state.pressed, focusVisible: state.focusVisible, disabled: state.disabled }
}

/** Layout shared by list, menu, and tree entries. */
export function itemStyle(metrics: ControlMetrics, disabled: boolean): CSSProperties {
  return {
    ...transition(metrics.visual, "box-shadow, color, outline-color, opacity"),
    display: "flex",
    alignItems: "center",
    gap: metrics.gap,
    minWidth: 0,
    minHeight: metrics.height,
    paddingInline: metrics.inset,
    boxSizing: "border-box",
    cursor: disabled ? "not-allowed" : "pointer",
    userSelect: "none",
    outlineOffset: -1
  }
}

/** The selection mark drawn at the end of a selected entry. */
export function SelectionMark({ visible }: Readonly<{ visible: boolean }>) {
  return <Check {...iconProps(14)} style={{ flexShrink: 0, marginInlineStart: "auto", opacity: visible ? 1 : 0 }} />
}
