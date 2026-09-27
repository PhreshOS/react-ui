import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Breadcrumb as AriaBreadcrumb, Breadcrumbs as AriaBreadcrumbs, Link as AriaLink } from "react-aria-components"
import type { BreadcrumbsProps as AriaBreadcrumbsProps } from "react-aria-components"
import { ChevronRight } from "lucide-react"
import { controlFontWeight, controlOpacity, transition, useControlMetrics, type ControlMetrics } from "./control/control.js"
import { iconProps } from "./control/icon.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { surfacePaint } from "./surface/surface.js"

const BreadcrumbsContext = createContext<ControlMetrics | null>(null)

export interface BreadcrumbsProps extends Omit<AriaBreadcrumbsProps<object>, "className" | "style" | "children"> {
  readonly children?: ReactNode
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

/** Where a page sits in a hierarchy: each ancestor is a link, the last entry is the current page. */
const BreadcrumbsRoot = forwardRef<HTMLOListElement, BreadcrumbsProps>(function Breadcrumbs({ children, size, style, ...properties }, ref) {
  const metrics = useControlMetrics(size)
  return <BreadcrumbsContext.Provider value={metrics}>
    <AriaBreadcrumbs {...properties} ref={ref} style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: metrics.gap / 2,
      margin: 0,
      padding: 0,
      listStyle: "none",
      fontSize: metrics.fontSize,
      lineHeight: 1.45,
      ...style
    }}>{children}</AriaBreadcrumbs>
  </BreadcrumbsContext.Provider>
})

export interface BreadcrumbsItemProps {
  readonly children?: ReactNode
  readonly href?: string
  readonly id?: string
}

/** One step of the path. Its separator follows it, except after the current page. */
function BreadcrumbsItem({ children, href, id }: BreadcrumbsItemProps) {
  const metrics = useContext(BreadcrumbsContext)
  if (metrics === null) throw new Error("Breadcrumbs.Item must be inside Breadcrumbs")
  const ring = surfacePaint(metrics.visual, metrics.visual.colors.foreground, "flat", "none", false, { focusVisible: true }).ring

  return <AriaBreadcrumb id={id} style={{ display: "flex", alignItems: "center", gap: metrics.gap / 2 }}>{({ isCurrent }) => <>
    <AriaLink href={isCurrent ? undefined : href} style={state => ({
      ...transition(metrics.visual, "opacity, outline-color"),
      color: "inherit",
      textDecoration: "none",
      borderRadius: "0.2em",
      fontWeight: isCurrent ? controlFontWeight : undefined,
      opacity: isCurrent || state.isHovered ? 1 : controlOpacity.secondary,
      outline: `3px solid ${state.isFocusVisible ? ring : "transparent"}`,
      outlineOffset: 1,
      cursor: isCurrent ? "default" : "pointer"
    })}>{children}</AriaLink>
    {!isCurrent && <ChevronRight {...iconProps(Math.round(metrics.height / 2))} style={{ opacity: controlOpacity.placeholder }} />}
  </>}</AriaBreadcrumb>
}

export const Breadcrumbs = Object.assign(BreadcrumbsRoot, { Item: BreadcrumbsItem })
