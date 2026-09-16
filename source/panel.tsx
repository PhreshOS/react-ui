import { Children, createContext, forwardRef, isValidElement, useContext } from "react"
import type { ComponentProps, HTMLAttributes } from "react"
import { useAppearance } from "./appearance-provider.js"
import { scale } from "./scale.js"
import { Surface, type SurfaceProps } from "./surface.js"

const PanelContext = createContext({ hasHeader: false })

/** Optional content placed before the inset Panel surface. */
export type PanelHeaderProps = HTMLAttributes<HTMLDivElement>

export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(function PanelHeader(
  { style, ...properties },
  ref
) {
  return <div
    {...properties}
    ref={ref}
    style={{
      minWidth: 0,
      ...style
    }}
  />
})

/** The material shell that owns a Panel's vertical composition. */
export type PanelRootProps = SurfaceProps

export const PanelRoot = forwardRef<HTMLDivElement, PanelRootProps>(function PanelRoot(
  { children, style, ...properties },
  ref
) {
  const hasHeader = Children.toArray(children).some(child =>
    isValidElement(child) && child.type === PanelHeader
  )

  return <PanelContext.Provider value={{ hasHeader }}>
    <Surface
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
    >{children}</Surface>
  </PanelContext.Provider>
})

/** The independently configurable inset Surface that owns Panel content. */
export type PanelContentProps = SurfaceProps

export const PanelContent = forwardRef<HTMLDivElement, PanelContentProps>(function PanelContent(
  { style, ...properties },
  ref
) {
  const inset = scale(useAppearance().spacing, "small")
  const { hasHeader } = useContext(PanelContext)

  return <Surface
    {...properties}
    ref={ref}
    style={{
      position: "relative",
      minWidth: 0,
      minHeight: 0,
      margin: inset,
      marginTop: hasHeader ? 0 : inset,
      overflow: "hidden",
      ...style
    }}
  />
})

/** A material shell whose named parts remain independently composable. */
export const Panel = Object.assign(PanelRoot, {
  Root: PanelRoot,
  Header: PanelHeader,
  Content: PanelContent
})

export type PanelProps = ComponentProps<typeof PanelRoot>
