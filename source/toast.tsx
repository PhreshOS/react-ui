import type { CSSProperties, ReactNode } from "react"
import { Text, UNSTABLE_Toast as AriaToast, UNSTABLE_ToastContent as AriaToastContent, UNSTABLE_ToastQueue as AriaToastQueue, UNSTABLE_ToastRegion as AriaToastRegion } from "react-aria-components"
import { X } from "lucide-react"
import { controlFontSizes, controlFontWeight, controlOpacity, useControlMetrics } from "./control/control.js"
import { FieldButton } from "./control/field-button.js"
import { iconProps } from "./control/icon.js"
import { meaningIcon } from "./control/meaning.js"
import { colorLevel, resolveColor, type Color } from "./foundation/color.js"
import MotionStyle, { overlayLayer, overlayTransition } from "./foundation/motion-style.js"
import { resolveRadius } from "./foundation/radius.js"
import { scale } from "./foundation/scale.js"
import { Surface } from "./surface/surface.js"
import { floatingShadow } from "./surface/shadow-options.js"
import { containerPadding } from "./foundation/spacing.js"

export interface ToastContent {
  readonly title: ReactNode
  readonly description?: ReactNode
  /** The meaning, as a color role: `info` by default. It sets the icon. */
  readonly color?: Color
}

export interface ToastOptions {
  /**
   * Milliseconds before the Toast closes itself. Omitted, it stays until
   * closed. Keep at least five seconds, so it can be read.
   */
  readonly timeout?: number
}

const queue = new AriaToastQueue<ToastContent>({ maxVisibleToasts: 5 })

/**
 * Shows a brief message that does not interrupt, such as "Saved". It appears
 * in the ToastRegion and returns a key that closes it early.
 */
export const toast = Object.freeze({
  show(content: ToastContent, options: ToastOptions = {}): string {
    return queue.add(content, options.timeout === undefined ? {} : { timeout: options.timeout })
  },
  close(key: string): void {
    queue.close(key)
  }
})

export interface ToastRegionProps {
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * Where Toasts appear: stacked at the end of the viewport bottom, above the
 * interface, at the large spacing step from its edges. Render it once.
 */
export function ToastRegion({ className, style }: ToastRegionProps) {
  const metrics = useControlMetrics()
  const visual = metrics.visual
  const inset = scale(visual.spacing, "large")

  return <><MotionStyle /><AriaToastRegion queue={queue} className={className} style={{
    position: "fixed",
    insetBlockEnd: inset,
    insetInlineEnd: inset,
    zIndex: overlayLayer,
    display: "flex",
    flexDirection: "column-reverse",
    // Each Toast is as wide as its message, up to the width of a readable line.
    alignItems: "end",
    gap: metrics.gap,
    maxWidth: `min(28em, calc(100vw - ${inset * 2}px))`,
    outline: "none",
    ...style
  }}>{({ toast: item }) => {
    const color = item.content.color ?? "info"
    const Icon = meaningIcon(color)
    return <AriaToast toast={item} style={{ outline: "none", ...overlayTransition(visual), animation: `phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) both` }}>
      <Surface material="full" shadow={floatingShadow(visual.shadow)} radius={resolveRadius("medium", visual.radius)} style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "start",
        gap: metrics.gap * 2,
        padding: containerPadding(visual.spacing),
        // The close button carries its own padding, so the end keeps less.
        paddingInlineEnd: metrics.spacing / 2,
        fontSize: controlFontSizes.medium,
        lineHeight: 1.45
      }}>
        <span style={{ display: "grid", height: "1.45em", alignItems: "center", color: colorLevel(resolveColor(color, visual.colors), "strong", visual.colors) }}>
          <Icon {...iconProps(Math.round(metrics.height / 2))} />
        </span>
        <AriaToastContent style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <Text slot="title" style={{ fontWeight: controlFontWeight }}>{item.content.title}</Text>
          {item.content.description != null && <Text slot="description" style={{ opacity: controlOpacity.secondary }}>{item.content.description}</Text>}
        </AriaToastContent>
        <FieldButton slot="close" metrics={metrics} aria-label="Close"><X {...iconProps(Math.round(metrics.height / 2))} /></FieldButton>
      </Surface>
    </AriaToast>
  }}</AriaToastRegion></>
}
