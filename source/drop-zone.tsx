import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { DropZone as AriaDropZone } from "react-aria-components"
import type { DropZoneProps as AriaDropZoneProps, DropZoneRenderProps, FileDropItem } from "react-aria-components"
import { useControlMetrics } from "./control/control.js"
import { surfaceRender } from "./control/surface-render.js"
import { colorLevel } from "./foundation/color.js"
import { resolveRadius, type RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface DropZoneProps extends
  Omit<AriaDropZoneProps, "onDrop" | "getDropOperation" | "isDisabled" | "className" | "style" | "children">,
  RadiusProps,
  MaterialOverrides {
  readonly children?: ReactNode
  /** MIME types it accepts, such as `image/png`, or a family such as `image/*`. Anything, when absent. */
  readonly accept?: readonly string[]
  readonly onDrop?: (files: File[]) => void
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * An area that takes files dragged onto it. It recesses like every value
 * holder, and takes the subtle `primary` level while files hover it.
 */
export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(function DropZone({
  children, accept, onDrop, disabled, radius, material, className, style, ...properties
}, ref) {
  const metrics = useControlMetrics()
  const { colors } = metrics.visual
  const accepts = (type: string) => accept === undefined || accept.some(pattern => pattern.endsWith("/*") ? type.startsWith(pattern.slice(0, -1)) : type === pattern)

  return <AriaDropZone
    {...properties}
    ref={ref}
    isDisabled={disabled}
    // A drag names exact types only, so a family such as `image/*` is checked on drop.
    getDropOperation={types => accept === undefined || accept.some(pattern => pattern.endsWith("/*") || types.has(pattern)) ? "copy" : "cancel"}
    onDrop={async event => {
      const files = await Promise.all(event.items
        .filter((item): item is FileDropItem => item.kind === "file" && accepts(item.type))
        .map(item => item.getFile()))
      if (files.length > 0) onDrop?.(files)
    }}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    render={surfaceRender<DropZoneRenderProps>("div", state => ({
      color: state.isDropTarget ? colorLevel(colors.primary, "subtle", colors) : "background",
      depth: "recessed",
      material,
      radius: resolveRadius(radius ?? "medium", metrics.visual.radius),
      interaction: { hovered: false, focusVisible: state.isFocusVisible || state.isDropTarget, disabled: state.isDisabled }
    }))}
    style={{ display: "grid", placeItems: "center", gap: metrics.gap, padding: metrics.spacing * 2, textAlign: "center", ...style }}
  >{children}</AriaDropZone>
})
