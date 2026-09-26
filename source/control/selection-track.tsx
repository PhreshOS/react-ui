import { useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { colorOpacity, readableColor, resolveColor, type Color } from "../foundation/color.js"
import type { MaterialOverrides } from "../surface/material-options.js"
import { Surface, SurfaceView } from "../surface/surface.js"
import { controlOpacity, transition, type ControlMetrics } from "./control.js"

type Orientation = "horizontal" | "vertical"

/** The track's padding around the items it holds. */
export const selectionTrackInset = 3

/**
 * A recessed track holding a row of mutually exclusive items, such as Tabs or
 * a SegmentedControl; the selection rises out of it as one raised Surface that
 * slides to whichever item is selected. The list inside marks itself with
 * `data-selection-list`, and React Aria marks the selected item `data-selected`.
 */
export function SelectionTrack({ metrics, color, material, orientation, selectedKey, className, style, children }: Readonly<{
  metrics: ControlMetrics
  color: Color
  material: MaterialOverrides["material"]
  orientation: Orientation
  selectedKey: unknown
  className?: string
  style?: CSSProperties
  children: ReactNode
}>) {
  const track = useRef<HTMLDivElement>(null)
  const selection = useSelectionPlacement(track, selectedKey, orientation)

  return <SurfaceView ref={track} color="background" depth="recessed" material={material} radius={metrics.radius} className={className}
    style={{ padding: selectionTrackInset, width: orientation === "horizontal" ? "100%" : undefined, boxSizing: "border-box", ...style }}>
    {selection !== null && <Surface
      data-selection-indicator=""
      aria-hidden="true"
      color={color}
      material={material}
      radius={metrics.radius}
      style={{
        ...(selection.moving ? transition(metrics.visual, "translate, width, height") : {}),
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        width: selection.width,
        height: selection.height,
        translate: `${selection.x}px ${selection.y}px`
      }}
    />}
    {children}
  </SurfaceView>
}

/** Layout of the list inside a SelectionTrack: equal columns across, or a stack. */
export function selectionListStyle(orientation: Orientation): CSSProperties {
  return {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridAutoFlow: orientation === "horizontal" ? "column" : "row",
    gridAutoColumns: orientation === "horizontal" ? "minmax(0, 1fr)" : undefined,
    alignContent: "start",
    gap: 2,
    minWidth: 0
  }
}

type ItemState = Readonly<{ isSelected: boolean, isFocusVisible: boolean, isDisabled: boolean }>

/** One item of a SelectionTrack; its label reads against the selection when selected. */
export function selectionItemStyle(metrics: ControlMetrics, color: Color, orientation: Orientation, state: ItemState): CSSProperties {
  const { colors } = metrics.visual
  return {
    ...transition(metrics.visual, "color, outline-color"),
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: orientation === "vertical" ? "start" : "center",
    minWidth: 0,
    minHeight: metrics.height - selectionTrackInset * 2,
    paddingInline: metrics.inset,
    boxSizing: "border-box",
    border: 0,
    background: "none",
    font: "inherit",
    borderRadius: metrics.radius,
    outline: `3px solid ${state.isFocusVisible ? colorOpacity(colors.primary, 0.34) : "transparent"}`,
    outlineOffset: 1,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    userSelect: "none",
    fontWeight: 500,
    color: state.isSelected ? readableColor(resolveColor(color, colors), colors) : colors.foreground
  }
}

/** An item's label: an optional leading icon and text, centered a gap apart. */
export function SelectionItemLabel({ metrics, emphasized, children }: Readonly<{ metrics: ControlMetrics, emphasized: boolean, children: ReactNode }>) {
  return <span style={{
    ...transition(metrics.visual, "opacity"),
    display: "flex",
    alignItems: "center",
    gap: metrics.gap,
    minWidth: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    opacity: emphasized ? 1 : controlOpacity.secondary
  }}>{children}</span>
}

type SelectionPlacement = Readonly<{ x: number, y: number, width: number, height: number, moving: boolean }>

/**
 * Where the selected item sits inside the track. The first placement appears
 * in place; later ones slide.
 */
function useSelectionPlacement(
  track: { readonly current: HTMLDivElement | null },
  selectedKey: unknown,
  orientation: Orientation
): SelectionPlacement | null {
  const [placement, setPlacement] = useState<SelectionPlacement | null>(null)

  useLayoutEffect(() => {
    const element = track.current
    const list = element?.querySelector<HTMLElement>("[data-selection-list]")
    if (element == null || list == null) return
    const measure = () => {
      const item = list.querySelector<HTMLElement>("[data-selected]")
      if (item == null) return setPlacement(null)
      const outer = element.getBoundingClientRect()
      const inner = item.getBoundingClientRect()
      // Rectangles keep subpixel precision; dividing by the track's own
      // scale undoes any transform, such as an entering overlay's.
      const scale = element.offsetWidth > 0 ? outer.width / element.offsetWidth : 1
      const next = {
        x: (inner.left - outer.left) / scale - element.clientLeft,
        y: (inner.top - outer.top) / scale - element.clientTop,
        width: inner.width / scale,
        height: inner.height / scale
      }
      setPlacement(previous => previous !== null && previous.x === next.x && previous.y === next.y
        && previous.width === next.width && previous.height === next.height
        ? previous
        : { ...next, moving: previous !== null })
    }
    measure()
    // Items render after the list itself, and selection is written onto them.
    const mutations = new MutationObserver(measure)
    mutations.observe(list, { subtree: true, childList: true, attributeFilter: ["data-selected"] })
    const resizes = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null
    resizes?.observe(list)
    return () => {
      mutations.disconnect()
      resizes?.disconnect()
    }
  }, [track, selectedKey, orientation])

  return placement
}
