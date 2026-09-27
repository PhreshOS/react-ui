import type { CSSProperties } from "react"
import type { AppearanceColors } from "../foundation/appearance.js"
import { colorLevel, mixColor, resolveColor, type Color } from "../foundation/color.js"
import type { Visual } from "../foundation/visual.js"
import { clearVeil, interactionShift, surfacePaint, type SurfaceInteraction } from "../surface/surface.js"
import { transition, type ControlMetrics } from "./control.js"
import type { SurfaceRenderProps } from "./surface-render.js"
import { Check } from "lucide-react"
import { iconProps } from "./icon.js"

/**
 * What marks a selection, in every collection and inside a calendar range:
 * the subtle level of its color under the same veil as hover. The veil keeps
 * a light color apart from its canvas, so a selection never shows less
 * clearly than hovering does.
 */
export function selectionColor(base: string, colors: AppearanceColors): string {
  return mixColor(colorLevel(base, "subtle", colors), colors.foreground, interactionShift.hovered * clearVeil)
}

export type ItemState = Readonly<{
  selected: boolean
  hovered: boolean
  pressed: boolean
  focusVisible: boolean
  disabled: boolean
}>

/**
 * One entry of a collection. At rest it has no paint of its own; hover and
 * press veil it, and selection lays the selection color of the collection
 * color beneath it. Every collection uses this same treatment.
 */
export function itemSurface(visual: Visual, color: Color, state: ItemState, radius: CSSProperties["borderRadius"]): SurfaceRenderProps {
  return {
    color: state.selected ? selectionColor(resolveColor(color, visual.colors), visual.colors) : "transparent",
    depth: "flat",
    material: "none",
    radius,
    interaction: itemInteraction(state)
  }
}

/** The same treatment as a plain paint, for elements that cannot host a Surface. */
export function itemPaint(visual: Visual, color: Color, state: ItemState): Readonly<{ background: string, color: string }> {
  const paint = surfacePaint(visual, state.selected ? selectionColor(resolveColor(color, visual.colors), visual.colors) : "transparent", "flat", "none", false, itemInteraction(state))
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
