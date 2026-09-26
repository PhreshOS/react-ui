import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area"
import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react/direction-provider"
import { forwardRef, useState } from "react"
import type { ComponentPropsWithoutRef, Ref, ReactNode, UIEventHandler } from "react"
import { transition as timing } from "./control/control.js"
import { colorOpacity, resolveColor, type Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import { useVisual } from "./foundation/visual.js"

export type ScrollAreaAxis = "vertical" | "horizontal" | "both"

export interface ScrollAreaProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "color" | "onScroll"> {
  readonly axis?: ScrollAreaAxis
  readonly children?: ReactNode
  /** Base color from which scrollbar states are derived. */
  readonly color?: Color
  readonly onScroll?: UIEventHandler<HTMLDivElement>
  readonly viewportRef?: Ref<HTMLDivElement>
}

/** A native scrolling viewport with locally owned React UI scrollbars. */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea({
  axis = "vertical",
  children,
  color,
  onScroll,
  style,
  viewportRef,
  ...properties
}, ref) {
  const visual = useVisual()
  const { appearance } = visual
  const direction = resolveDirection(properties.dir, useDirection())
  const foreground = resolveColor(color ?? "foreground", visual.colors)
  // A scrollbar thumb is a pill at any thickness.
  const radius = 9999
  const thickness = Math.max(8, appearance.spacing)
  const inset = Math.max(2, thickness / 3)
  const vertical = axis === "vertical" || axis === "both"
  const horizontal = axis === "horizontal" || axis === "both"
  const transition = timing(visual, "opacity")

  const root = <BaseScrollArea.Root
    {...properties}
    data-phreshos-scroll-area=""
    ref={ref}
    style={{
      ...style,
      display: "flex",
      flexDirection: "column",
      position: style?.position ?? "relative",
      minWidth: style?.minWidth ?? 0,
      minHeight: style?.minHeight ?? 0,
      overflow: "hidden"
    }}
  >
    <BaseScrollArea.Viewport
      data-phreshos-scroll-area-viewport=""
      ref={viewportRef}
      onScroll={onScroll}
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        width: "100%",
        height: "100%",
        overflowX: horizontal ? "scroll" : "hidden",
        overflowY: vertical ? "scroll" : "hidden"
      }}
    >
      <BaseScrollArea.Content data-phreshos-scroll-area-content="" style={vertical && !horizontal ? { minWidth: "100%", width: "100%" } : undefined}>
        {children}
      </BaseScrollArea.Content>
    </BaseScrollArea.Viewport>

    {vertical && <Scrollbar orientation="vertical" foreground={foreground} radius={radius} thickness={thickness} inset={inset} transition={transition} />}
    {horizontal && <Scrollbar orientation="horizontal" foreground={foreground} radius={radius} thickness={thickness} inset={inset} transition={transition} />}
    {vertical && horizontal && <BaseScrollArea.Corner style={{ background: "transparent" }} />}
  </BaseScrollArea.Root>

  return <BaseDirectionProvider direction={direction}>{root}</BaseDirectionProvider>
})

function Scrollbar({ orientation, foreground, radius, thickness, inset, transition }: Readonly<{
  orientation: "vertical" | "horizontal"
  foreground: string
  radius: number
  thickness: number
  inset: number
  transition: ReturnType<typeof timing>
}>) {
  const [hovered, setHovered] = useState(false)
  const vertical = orientation === "vertical"

  return <BaseScrollArea.Scrollbar
    data-phreshos-scroll-area-scrollbar=""
    orientation={orientation}
    keepMounted
    onPointerEnter={() => setHovered(true)}
    onPointerLeave={() => setHovered(false)}
    style={state => {
      const present = vertical ? state.hasOverflowY : state.hasOverflowX

      return {
        boxSizing: "border-box",
        width: vertical ? thickness : undefined,
        height: vertical ? undefined : thickness,
        padding: inset,
        opacity: present && (state.hovering || state.scrolling) ? 1 : 0,
        pointerEvents: present && (state.hovering || state.scrolling) ? "auto" : "none",
        transitionDuration: transition.transitionDuration,
        transitionTimingFunction: transition.transitionTimingFunction,
        transitionProperty: "opacity"
      }
    }}
  >
    <BaseScrollArea.Thumb data-phreshos-scroll-area-thumb="" style={{
      borderRadius: radius,
      backgroundColor: colorOpacity(foreground, hovered ? 0.2 : 0.1),
      transitionDuration: transition.transitionDuration,
      transitionTimingFunction: transition.transitionTimingFunction,
      transitionProperty: "background-color"
    }} />
  </BaseScrollArea.Scrollbar>
}
