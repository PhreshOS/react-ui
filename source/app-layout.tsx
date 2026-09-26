import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { useControlMetrics } from "./control/control.js"
import { separatorColor } from "./control/field.js"
import { headerHeight } from "./foundation/layout.js"
import { scale } from "./foundation/scale.js"
import { ScrollArea } from "./scroll-area.js"

const AppLayoutContext = createContext<Readonly<{ separator: string, spacing: number }> | null>(null)

export interface AppLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode
  /** The sidebar's width; eighteen times the Appearance spacing by default. */
  readonly sidebarWidth?: CSSProperties["width"]
}

/**
 * The frame of a program's interface: a sidebar beside a header, the content,
 * and an optional footer. It owns only the regions, their scrolling, and the
 * hairlines between them; the program places its own components inside.
 */
const AppLayoutRoot = forwardRef<HTMLDivElement, AppLayoutProps>(function AppLayout({ children, sidebarWidth, style, ...properties }, ref) {
  const metrics = useControlMetrics()
  const { spacing } = metrics.visual

  return <AppLayoutContext.Provider value={{ separator: separatorColor(metrics), spacing }}>
    <div {...properties} ref={ref} style={{
      display: "grid",
      gridTemplateColumns: `${typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth ?? `${spacing * 18}px`} minmax(0, 1fr)`,
      gridTemplateRows: "auto minmax(0, 1fr) auto",
      gridTemplateAreas: `"sidebar header" "sidebar content" "sidebar footer"`,
      width: "100%",
      height: "100%",
      minWidth: 0,
      minHeight: 0,
      // The frame of a program: its text takes the Appearance text color.
      color: metrics.visual.colors.foreground,
      fontFamily: "inherit",
      ...style
    }}>{children}</div>
  </AppLayoutContext.Provider>
})

export type AppLayoutRegionProps = HTMLAttributes<HTMLElement>

/** The sidebar, such as a program's navigation. It scrolls on its own. */
const AppLayoutSidebar = forwardRef<HTMLElement, AppLayoutRegionProps>(function AppLayoutSidebar({ children, style, ...properties }, ref) {
  const { separator, spacing } = useLayout()

  return <aside {...properties} ref={ref} style={{ gridArea: "sidebar", minHeight: 0, boxSizing: "border-box", borderInlineEnd: `1px solid ${separator}`, ...style }}>
    <ScrollArea style={{ height: "100%" }}><div style={{ padding: scale(spacing, "small") }}>{children}</div></ScrollArea>
  </aside>
})

/** The header row above the content, as tall as a Window or Panel header. */
const AppLayoutHeader = forwardRef<HTMLElement, AppLayoutRegionProps>(function AppLayoutHeader({ style, ...properties }, ref) {
  const { separator, spacing } = useLayout()

  return <header {...properties} ref={ref} style={{
    gridArea: "header",
    display: "flex",
    alignItems: "center",
    gap: scale(spacing, "small"),
    minWidth: 0,
    minHeight: headerHeight(spacing),
    paddingInline: spacing,
    boxSizing: "border-box",
    borderBlockEnd: `1px solid ${separator}`,
    ...style
  }} />
})

/** The content. It scrolls on its own, padded by the Appearance spacing. */
const AppLayoutContent = forwardRef<HTMLElement, AppLayoutRegionProps>(function AppLayoutContent({ children, style, ...properties }, ref) {
  const { spacing } = useLayout()

  return <main {...properties} ref={ref} style={{ gridArea: "content", minWidth: 0, minHeight: 0, ...style }}>
    <ScrollArea style={{ height: "100%" }}><div style={{ padding: spacing }}>{children}</div></ScrollArea>
  </main>
})

/** An optional row below the content, such as the actions that apply to it. */
const AppLayoutFooter = forwardRef<HTMLElement, AppLayoutRegionProps>(function AppLayoutFooter({ style, ...properties }, ref) {
  const { separator, spacing } = useLayout()

  return <footer {...properties} ref={ref} style={{
    gridArea: "footer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: scale(spacing, "small"),
    minWidth: 0,
    padding: `${scale(spacing, "small")}px ${spacing}px`,
    borderBlockStart: `1px solid ${separator}`,
    ...style
  }} />
})

function useLayout() {
  const context = useContext(AppLayoutContext)
  if (context == null) throw new Error("AppLayout parts must be used inside AppLayout")
  return context
}

export const AppLayout = Object.assign(AppLayoutRoot, {
  Sidebar: AppLayoutSidebar,
  Header: AppLayoutHeader,
  Content: AppLayoutContent,
  Footer: AppLayoutFooter
})
