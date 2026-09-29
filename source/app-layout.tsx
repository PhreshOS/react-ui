import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { controlFontSizes, controlFontWeight } from "./control/control.js"
import { headerHeight } from "./foundation/layout.js"
import { resolveRadius } from "./foundation/radius.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { ScrollArea } from "./scroll-area.js"
import { Surface, type SurfaceDepth } from "./surface/surface.js"
import { containerPadding } from "./foundation/spacing.js"

const AppLayoutContext = createContext(false)

export interface AppLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode
  /** The sidebar's width; eighteen times the Appearance spacing by default. */
  readonly sidebarWidth?: CSSProperties["width"]
}

/**
 * The frame of a program's interface: a title above a sidebar, and a header,
 * the content, and an optional footer beside them. Only the content is a
 * Surface, the same inset region as a Panel's content; the other regions sit
 * on whatever holds the layout, separated by spacing alone.
 */
const AppLayoutRoot = forwardRef<HTMLDivElement, AppLayoutProps>(function AppLayout({ children, sidebarWidth, style, ...properties }, ref) {
  const visual = useVisual()
  const inset = scale(visual.spacing, "small")

  return <AppLayoutContext.Provider value>
    <div {...properties} ref={ref} style={{
      display: "grid",
      gridTemplateColumns: `${typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth ?? `${visual.spacing * 18}px`} minmax(0, 1fr)`,
      gridTemplateRows: "auto minmax(0, 1fr) auto",
      gridTemplateAreas: `"title header" "sidebar content" "sidebar footer"`,
      columnGap: inset,
      // The header row supplies the space above the content, as in a Panel.
      padding: inset,
      paddingTop: 0,
      boxSizing: "border-box",
      width: "100%",
      height: "100%",
      minWidth: 0,
      minHeight: 0,
      // The frame of a program: its text takes the Appearance text color.
      color: visual.colors.foreground,
      fontFamily: "inherit",
      ...style
    }}>{children}</div>
  </AppLayoutContext.Provider>
})

export type AppLayoutRegionProps = HTMLAttributes<HTMLElement>
export type AppLayoutContentProps = AppLayoutRegionProps & Readonly<{
  /** How the content's Surface stands in the layout: recessed into it by default, or raised. */
  depth?: SurfaceDepth
}>
export type AppLayoutSidebarProps = AppLayoutRegionProps & Readonly<{
  /** What stays at the foot of the sidebar while the rest scrolls, such as work in progress. */
  footer?: ReactNode
}>
export type AppLayoutTitleProps = HTMLAttributes<HTMLHeadingElement>

/** The program's title above the sidebar, in the header row. */
const AppLayoutTitle = forwardRef<HTMLHeadingElement, AppLayoutTitleProps>(function AppLayoutTitle({ style, ...properties }, ref) {
  const { spacing } = useLayout()

  return <h1 {...properties} ref={ref} style={{
    gridArea: "title",
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    minHeight: headerHeight(spacing),
    margin: 0,
    paddingInline: scale(spacing, "small"),
    fontSize: controlFontSizes.large,
    fontWeight: controlFontWeight,
    ...style
  }} />
})

/** The sidebar, such as a program's navigation. It scrolls on its own, above its footer. */
const AppLayoutSidebar = forwardRef<HTMLElement, AppLayoutSidebarProps>(function AppLayoutSidebar({ children, footer, style, ...properties }, ref) {
  const { spacing } = useLayout()
  const padding = scale(spacing, "small")

  return <aside {...properties} ref={ref} style={{ gridArea: "sidebar", minHeight: 0, display: "flex", flexDirection: "column", ...style }}>
    <ScrollArea style={{ flex: "1 1 auto", minHeight: 0 }}><div style={{ padding }}>{children}</div></ScrollArea>
    {footer != null && <div style={{ flex: "none", paddingInline: padding, paddingBottom: padding }}>{footer}</div>}
  </aside>
})

/** The header row above the content, as tall as a Window or Panel header. */
const AppLayoutHeader = forwardRef<HTMLElement, AppLayoutRegionProps>(function AppLayoutHeader({ style, ...properties }, ref) {
  const { spacing } = useLayout()

  return <header {...properties} ref={ref} style={{
    gridArea: "header",
    display: "flex",
    alignItems: "center",
    gap: scale(spacing, "small"),
    minWidth: 0,
    minHeight: headerHeight(spacing),
    ...style
  }} />
})

/** The content, on its Surface. It scrolls on its own, padded by the Appearance spacing. */
const AppLayoutContent = forwardRef<HTMLElement, AppLayoutContentProps>(function AppLayoutContent({ children, depth = "recessed", style, ...properties }, ref) {
  const { spacing, radius } = useLayout()

  return <Surface as="main" {...properties} ref={ref} depth={depth} material="extended" radius={resolveRadius("medium", radius)} style={{
    gridArea: "content",
    minWidth: 0,
    minHeight: 0,
    // The Surface owns its shape: what scrolls inside stays within its corners.
    overflow: "clip",
    ...style
  }}>
    <ScrollArea style={{ height: "100%" }}><div style={{ padding: containerPadding(spacing) }}>{children}</div></ScrollArea>
  </Surface>
})

/** An optional row below the content, such as the actions that apply to it. */
const AppLayoutFooter = forwardRef<HTMLElement, AppLayoutRegionProps>(function AppLayoutFooter({ style, ...properties }, ref) {
  const { spacing } = useLayout()

  return <footer {...properties} ref={ref} style={{
    gridArea: "footer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: scale(spacing, "small"),
    minWidth: 0,
    paddingTop: scale(spacing, "small"),
    ...style
  }} />
})

function useLayout() {
  if (!useContext(AppLayoutContext)) throw new Error("AppLayout parts must be used inside AppLayout")
  return useVisual()
}

export const AppLayout = Object.assign(AppLayoutRoot, {
  Title: AppLayoutTitle,
  Sidebar: AppLayoutSidebar,
  Header: AppLayoutHeader,
  Content: AppLayoutContent,
  Footer: AppLayoutFooter
})
