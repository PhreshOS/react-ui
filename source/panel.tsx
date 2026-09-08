import { forwardRef, type ReactNode } from "react"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { scale } from "./scale.js"
import { Surface, type SurfaceProps } from "./surface.js"

/** A Surface with an optional header and an inset content Surface. */
export interface PanelProps extends SurfaceProps {
  readonly header?: ReactNode
  readonly contentProps?: Omit<SurfaceProps, "children">
}

/** Owns the shared shell layout, not positioning, interaction, or lifecycle. */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { header, children, contentProps, style, ...properties },
  ref
) {
  const appearance = useAppearance()
  const inset = scale(useResolveTheme(appearance.spacing), "small")
  const hasHeader = header !== undefined && header !== null && header !== false

  return <Surface
    {...properties}
    ref={ref}
    style={{
      display: "grid",
      gridTemplateRows: hasHeader ? "auto minmax(0, 1fr)" : "minmax(0, 1fr)",
      minWidth: 0,
      minHeight: 0,
      maxHeight: "inherit",
      ...style
    }}
  >
    {header}
    <Surface
      {...contentProps}
      style={{
        position: "relative",
        minWidth: 0,
        minHeight: 0,
        margin: inset,
        marginTop: hasHeader ? 0 : inset,
        overflow: "hidden",
        ...contentProps?.style
      }}
    >{children}</Surface>
  </Surface>
})
