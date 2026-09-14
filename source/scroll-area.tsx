import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area"
import { forwardRef, useState } from "react"
import type { ComponentPropsWithoutRef, Ref, ReactNode, UIEventHandler } from "react"
import { useAppearance, useThemedValue } from "./appearance-provider.js"
import { colorOpacity } from "./color.js"
import { useTransitionTiming } from "./motion-style.js"

export type ScrollAreaAxis = "vertical" | "horizontal" | "both"

export interface ScrollAreaProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onScroll"> {
  readonly axis?: ScrollAreaAxis
  readonly children?: ReactNode
  readonly onScroll?: UIEventHandler<HTMLDivElement>
  readonly viewportRef?: Ref<HTMLDivElement>
}

/** A native scrolling viewport with locally owned React UI scrollbars. */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea({
  axis = "vertical",
  children,
  onScroll,
  style,
  viewportRef,
  ...properties
}, ref) {
  const appearance = useAppearance()
  const foreground = useThemedValue(appearance.colors).foreground
  const radius = Math.min(appearance.radius, 8)
  const vertical = axis === "vertical" || axis === "both"
  const horizontal = axis === "horizontal" || axis === "both"

  return <BaseScrollArea.Root
    {...properties}
    data-phreshos-scroll-area=""
    ref={ref}
    style={{
      ...style,
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

    {vertical && <Scrollbar orientation="vertical" foreground={foreground} radius={radius} />}
    {horizontal && <Scrollbar orientation="horizontal" foreground={foreground} radius={radius} />}
    {vertical && horizontal && <BaseScrollArea.Corner style={{ background: "transparent" }} />}
  </BaseScrollArea.Root>
})

function Scrollbar({ orientation, foreground, radius }: Readonly<{
  orientation: "vertical" | "horizontal"
  foreground: string
  radius: number
}>) {
  const [hovered, setHovered] = useState(false)
  const transition = useTransitionTiming()
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
        width: vertical ? 16 : undefined,
        height: vertical ? undefined : 16,
        padding: 5,
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
