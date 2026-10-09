import { createContext, forwardRef, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react"
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react"
import { PanelLeft } from "lucide-react"
import { Button } from "./button.js"
import { controlFontSizes, controlFontWeight } from "./control/control.js"
import { headerHeight } from "./foundation/layout.js"
import { resolveRadius } from "./foundation/radius.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { ScrollArea } from "./scroll-area.js"
import { Surface, type SurfaceDepth } from "./surface/surface.js"
import { containerPadding } from "./foundation/spacing.js"
import { Drawer } from "./drawer.js"

/** At this width or less, a sidebar beside the content would crowd it out. */
export const narrowAppLayoutWidth = 640

type LayoutState = Readonly<{
  narrow: boolean
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  title: ReactNode
  sidebarLabel: string | undefined
}>

type LayoutRegistry = Readonly<{
  setTitle: (title: ReactNode) => void
  setSidebarLabel: (label: string | undefined) => void
}>

const AppLayoutContext = createContext<LayoutState | null>(null)
// Kept apart from the state, so a part that names itself does not render again when it is read.
const AppLayoutRegistry = createContext<LayoutRegistry | null>(null)

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
 *
 * At `narrowAppLayoutWidth` or less it gives the content the whole width: the title and sidebar
 * wait in a Drawer, which `AppLayout.SidebarToggle` opens.
 */
const AppLayoutRoot = forwardRef<HTMLDivElement, AppLayoutProps>(function AppLayout({ children, sidebarWidth, style, ...properties }, ref) {
  const visual = useVisual()
  const inset = scale(visual.spacing, "small")
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const narrow = useNarrow(element)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [title, setTitle] = useState<ReactNode>(null)
  const [sidebarLabel, setSidebarLabel] = useState<string | undefined>(undefined)
  const attach = useCallback((value: HTMLDivElement | null) => { setElement(value); assign(ref, value) }, [ref])

  // Widening puts the sidebar back beside the content, so its Drawer has nothing left to hold.
  useEffect(() => { if (!narrow) setSidebarOpen(false) }, [narrow])

  const state = useMemo(() => ({ narrow, sidebarOpen, setSidebarOpen, title, sidebarLabel }), [narrow, sidebarOpen, title, sidebarLabel])
  const registry = useMemo(() => ({ setTitle, setSidebarLabel }), [])

  return <AppLayoutRegistry.Provider value={registry}><AppLayoutContext.Provider value={state}>
    <div {...properties} ref={attach} style={{
      position: "relative",
      display: "grid",
      gridTemplateColumns: narrow ? "minmax(0, 1fr)" : `${typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth ?? `${visual.spacing * 18}px`} minmax(0, 1fr)`,
      gridTemplateRows: "auto minmax(0, 1fr) auto",
      gridTemplateAreas: narrow ? `"header" "content" "footer"` : `"title header" "sidebar content" "sidebar footer"`,
      columnGap: narrow ? 0 : inset,
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
  </AppLayoutContext.Provider></AppLayoutRegistry.Provider>
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

const visuallyHidden: CSSProperties = {
  position: "absolute", width: 1, height: 1, margin: -1, padding: 0, border: 0,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap"
}

/** The program's title above the sidebar, in the header row; in a narrow layout, atop its Drawer. */

const AppLayoutTitle = forwardRef<HTMLHeadingElement, AppLayoutTitleProps>(function AppLayoutTitle({ style, children, ...properties }, ref) {
  const { spacing } = useLayout()
  const { narrow } = useLayoutState()
  const { setTitle } = useRegistry()

  useLayoutEffect(() => { setTitle(children); return () => setTitle(null) }, [children, setTitle])

  // Out of sight while narrow, but still the page's heading, so what is named by it keeps its name.
  if (narrow) return <h1 {...properties} ref={ref} style={visuallyHidden}>{children}</h1>

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
  }}>{children}</h1>
})

/**
 * The sidebar, such as a program's navigation. It scrolls on its own, above its footer. In a
 * narrow layout it waits in a Drawer under the title; choosing something in it is the program's to
 * follow with `useAppLayout().closeSidebar()`.
 */
const AppLayoutSidebar = forwardRef<HTMLElement, AppLayoutSidebarProps>(function AppLayoutSidebar({ children, footer, style, ...properties }, ref) {
  const { spacing } = useLayout()
  const { narrow, sidebarOpen, setSidebarOpen, title } = useLayoutState()
  const { setSidebarLabel } = useRegistry()
  const padding = scale(spacing, "small")
  const label = properties["aria-label"]

  useLayoutEffect(() => { setSidebarLabel(label); return () => setSidebarLabel(undefined) }, [label, setSidebarLabel])

  if (narrow) return <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} title={title} aria-label={label}>
    {children}
    {footer != null && <div style={{ paddingTop: padding }}>{footer}</div>}
  </Drawer>

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

/** In a narrow layout, the button that opens the sidebar's Drawer; otherwise nothing. */
function AppLayoutSidebarToggle() {
  const { narrow, sidebarOpen, setSidebarOpen, sidebarLabel } = useLayoutState()

  if (!narrow) return null

  return <Button iconOnly depth="flat" size="small" aria-label={sidebarLabel ?? "Sidebar"} aria-expanded={sidebarOpen} onPress={() => setSidebarOpen(!sidebarOpen)}><PanelLeft /></Button>
}

/** Whether the nearest AppLayout is narrow, and closing its sidebar's Drawer, such as after a choice in it. */
export function useAppLayout() {
  const { narrow, setSidebarOpen } = useLayoutState()
  const closeSidebar = useCallback(() => setSidebarOpen(false), [setSidebarOpen])
  return useMemo(() => ({ narrow, closeSidebar }), [narrow, closeSidebar])
}

function useLayoutState() {
  const state = useContext(AppLayoutContext)
  if (!state) throw new Error("AppLayout parts must be used inside AppLayout")
  return state
}

function useRegistry() {
  const registry = useContext(AppLayoutRegistry)
  if (!registry) throw new Error("AppLayout parts must be used inside AppLayout")
  return registry
}

function useLayout() {
  useLayoutState()
  return useVisual()
}

/** Follows whether the layout itself, not the window, is narrow. */
function useNarrow(element: HTMLElement | null) {
  const [narrow, setNarrow] = useState(false)
  useLayoutEffect(() => {
    if (!element) return
    // A width of 0 is a layout not laid out yet, not a narrow one.
    const follow = (width: number) => { if (width > 0) setNarrow(width <= narrowAppLayoutWidth) }
    follow(element.getBoundingClientRect().width)
    if (typeof ResizeObserver !== "function") return
    const observer = new ResizeObserver(([entry]) => { if (entry) follow(entry.contentRect.width) })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return narrow
}

function assign<Value>(ref: Ref<Value> | undefined, value: Value) {
  if (typeof ref === "function") ref(value)
  else if (ref) (ref as { current: Value }).current = value
}

export const AppLayout = Object.assign(AppLayoutRoot, {
  Title: AppLayoutTitle,
  Sidebar: AppLayoutSidebar,
  SidebarToggle: AppLayoutSidebarToggle,
  Header: AppLayoutHeader,
  Content: AppLayoutContent,
  Footer: AppLayoutFooter
})
