import { Children, createContext, forwardRef, isValidElement, useContext } from "react"
import type { ComponentProps, CSSProperties, HTMLAttributes } from "react"
import { controlFontSizes, controlFontWeight } from "./control/control.js"
import type { Color } from "./foundation/color.js"
import { headerHeight } from "./foundation/layout.js"
import { resolveRadius } from "./foundation/radius.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { paintClass, paintClassesAvailable } from "./surface/paint-class.js"
import { Surface, type SurfaceProps } from "./surface/surface.js"

const PanelContext = createContext<{ color: Color | undefined, hasHeader: boolean, radius: CSSProperties["borderRadius"] }>({ color: undefined, hasHeader: false, radius: undefined })

/** Optional heading placed before the inset Panel content. */
export type PanelHeaderProps = HTMLAttributes<HTMLDivElement>

export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(function PanelHeader({ style, ...properties }, ref) {
  const { spacing } = useVisual()
  // The same header row as a Window: its height and its side padding.
  return <div {...properties} ref={ref} style={{
    boxSizing: "border-box",
    // A grid keeps the header's content full width and centers it in the row.
    display: "grid",
    alignContent: "center",
    minWidth: 0,
    minHeight: headerHeight(spacing),
    paddingInline: spacing,
    fontSize: controlFontSizes.medium,
    fontWeight: controlFontWeight,
    ...style
  }} />
})

/** The raised, frosted shell that owns a Panel's vertical composition. */
export type PanelRootProps = SurfaceProps

export const PanelRoot = forwardRef<HTMLDivElement, PanelRootProps>(function Panel({ children, style, ...properties }, ref) {
  const hasHeader = Children.toArray(children).some(child => isValidElement(child) && child.type === PanelHeader)

  // The shell and its content share one radius: the Appearance radius.
  const radius = resolveRadius(properties.radius ?? "medium", useVisual().radius)

  return <PanelContext.Provider value={{ color: properties.color, hasHeader, radius }}>
    <Surface material="full" {...properties} ref={ref} radius={radius} style={{
      display: "grid",
      gridTemplateRows: hasHeader ? "auto minmax(0, 1fr)" : "minmax(0, 1fr)",
      minWidth: 0,
      minHeight: 0,
      maxHeight: "inherit",
      ...style
    }}>{children}</Surface>
  </PanelContext.Provider>
})

/**
 * The inset region that holds a Panel's content. It is the Panel's own color,
 * raised, with a more solid material than the frosted shell, so recessed
 * fields inside it stand out. It sits `small` spacing inside the frame and
 * pads its content by the Appearance spacing.
 */
export type PanelContentProps = SurfaceProps

export const PanelContent = forwardRef<HTMLDivElement, PanelContentProps>(function PanelContent({ className, style, ...properties }, ref) {
  const { spacing } = useVisual()
  const inset = scale(spacing, "small")
  const padding = scale(spacing, "medium")
  const { color, hasHeader, radius } = useContext(PanelContext)
  // A zero-specificity class keeps the padding a default: any consumer class
  // or style still sets its own.
  const padded = paintClassesAvailable ? paintClass(`padding: ${padding}px`) : undefined

  return <Surface color={color} material="extended" radius={radius} {...properties} ref={ref}
    className={[padded, className].filter(Boolean).join(" ") || undefined}
    style={{
      ...(padded === undefined ? { padding } : {}),
      minWidth: 0,
      minHeight: 0,
      margin: inset,
      marginTop: hasHeader ? 0 : inset,
      overflow: "hidden",
      ...style
    }} />
})

/** A raised shell with an optional header and one inset content region. */
export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Content: PanelContent
})

export type PanelProps = ComponentProps<typeof PanelRoot>
