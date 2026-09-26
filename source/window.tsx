import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import type { BeginWindowMoveGesture } from "@phreshos/core"
import { Button, type ButtonProps } from "./button.js"
import { transition } from "./control/control.js"
import { resolveColor, type Color } from "./foundation/color.js"
import { headerHeight } from "./foundation/layout.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { Surface, type SurfaceProps } from "./surface/surface.js"
import useWindowMoveHandle from "./use-window-move-handle.js"
import { ArrowDownLeft, Maximize2, Minimize2, X } from "lucide-react"
import { iconProps } from "./control/icon.js"

interface HeaderState {
  readonly active: boolean
  readonly foreground: string
  readonly iconRadius: number
  readonly maximized: boolean
  readonly onMaximize?: () => void
  readonly spacing: number
  readonly transition: CSSProperties
}

const HeaderContext = createContext<HeaderState | null>(null)

function useHeader() {
  const value = useContext(HeaderContext)
  if (value === null) throw new Error("Window.Header parts require Window.Header")
  return value
}

/** The material shell that establishes the complete header-and-content layout. */
export type WindowProps = SurfaceProps

const WindowRoot = forwardRef<HTMLDivElement, WindowProps>(function WindowRoot(
  { children, style, ...properties },
  ref
) {
  return <Surface
    {...properties}
    ref={ref}
    style={{
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      minHeight: 0,
      ...style
    }}
  >{children}</Surface>
})

/** The remaining window area. Its consumer owns content behavior, including overflow. */
export type WindowContentProps = HTMLAttributes<HTMLDivElement>

const WindowContent = forwardRef<HTMLDivElement, WindowContentProps>(function WindowContent(
  { style, ...properties },
  ref
) {
  return <div
    {...properties}
    ref={ref}
    style={{
      position: "relative",
      flex: "1 1 auto",
      minWidth: 0,
      minHeight: 0,
      ...style
    }}
  />
})

export interface WindowHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  /** Attenuates the identity when this header is not active. */
  readonly active?: boolean

  /** Base color inherited by header-owned text and icons. */
  readonly color?: Color

  /** Hands an intentional header drag to its host after the pointer threshold. */
  readonly beginMoveGesture?: BeginWindowMoveGesture

  /** Whether the represented window is currently maximized. */
  readonly maximized?: boolean

  /** Toggles the represented window between maximized and restored states. */
  readonly onMaximize?: () => void

  /** Receives a synchronous or asynchronous move handoff failure. */
  readonly onMoveError?: (error: unknown) => void
}

/** The composable top region of a window; its enclosing Surface owns the material. */
const HeaderRoot = forwardRef<HTMLDivElement, WindowHeaderProps>(function HeaderRoot({
  active = true,
  beginMoveGesture,
  children,
  color,
  maximized = false,
  onDoubleClick,
  onLostPointerCapture,
  onMaximize,
  onMoveError,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  style,
  ...properties
}, ref) {
  const visual = useVisual()
  const spacing = visual.spacing
  const foreground = style?.color ?? resolveColor(color ?? "foreground", visual.colors)
  const state: HeaderState = {
    active,
    foreground,
    iconRadius: scale(visual.radius, "xsmall"),
    maximized,
    onMaximize,
    spacing,
    transition: transition(visual, "opacity")
  }
  const move = useWindowMoveHandle(beginMoveGesture, onMoveError)

  return <HeaderContext.Provider value={state}>
    <div
      {...properties}
      ref={ref}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (!event.defaultPrevented) move.onPointerDown(event)
      }}
      onPointerMove={event => { onPointerMove?.(event); move.onPointerMove(event) }}
      onPointerUp={event => { onPointerUp?.(event); move.onPointerUp(event) }}
      onPointerCancel={event => { onPointerCancel?.(event); move.onPointerCancel(event) }}
      onLostPointerCapture={event => { onLostPointerCapture?.(event); move.onLostPointerCapture(event) }}
      onDoubleClick={event => {
        onDoubleClick?.(event)
        if (!event.defaultPrevented) onMaximize?.()
      }}
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: spacing,
        minWidth: 0,
        height: headerHeight(spacing),
        paddingInline: spacing,
        flexShrink: 0,
        userSelect: "none",
        touchAction: beginMoveGesture ? "none" : undefined,
        cursor: beginMoveGesture ? "grab" : undefined,
        color: foreground,
        ...style
      }}
    >{children}</div>
  </HeaderContext.Provider>
})


export interface WindowIdentityProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  readonly icon?: string
  readonly title?: ReactNode
}

/** The icon and truncating title share the window's active treatment. */
const WindowIdentity = forwardRef<HTMLDivElement, WindowIdentityProps>(function WindowIdentity({
  icon,
  title,
  style,
  ...properties
}, ref) {
  const { active, iconRadius, spacing, transition } = useHeader()

  return <div {...properties} ref={ref} style={{
    ...transition,
    transitionProperty: "opacity",
    display: "flex",
    alignItems: "center",
    gap: spacing,
    flex: "0 1 auto",
    minWidth: 0,
    opacity: active ? 1 : 0.6,
    ...style
  }}>
    {icon && <img src={icon} alt="" draggable={false} style={{
      width: 16,
      height: 16,
      flexShrink: 0,
      borderRadius: iconRadius,
      objectFit: "contain"
    }} />}
    {title != null && <span style={{
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.8125em",
      fontWeight: 500
    }}>{title}</span>}
  </div>
})

export type WindowCenterProps = HTMLAttributes<HTMLDivElement>

/** Optional flexible space for application-owned content. */
const WindowCenter = forwardRef<HTMLDivElement, WindowCenterProps>(function WindowCenter({
  onDoubleClick,
  onPointerDown,
  style,
  ...properties
}, ref) {
  useHeader()

  return <div {...properties} ref={ref}
    onDoubleClick={event => { event.stopPropagation(); onDoubleClick?.(event) }}
    onPointerDown={event => { event.stopPropagation(); onPointerDown?.(event) }}
    style={{ display: "flex", alignItems: "center", flex: "1 1 auto", minWidth: 0, ...style }}
  />
})

export type WindowActionsProps = HTMLAttributes<HTMLDivElement>

/** End-aligned controls that do not begin a header drag or double-click action. */
const WindowActions = forwardRef<HTMLDivElement, WindowActionsProps>(function WindowActions({
  onDoubleClick,
  onPointerDown,
  style,
  ...properties
}, ref) {
  const { spacing } = useHeader()

  return <div {...properties} ref={ref}
    onDoubleClick={event => { event.stopPropagation(); onDoubleClick?.(event) }}
    onPointerDown={event => { event.stopPropagation(); onPointerDown?.(event) }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: Math.max(4, scale(spacing, "xsmall")),
      flexShrink: 0,
      marginInlineStart: "auto",
      ...style
    }}
  />
})

export type WindowActionProps = Omit<ButtonProps, "size">

/** A compact header action; extra actions use the same treatment as the standard controls. */
const WindowAction = forwardRef<HTMLButtonElement, WindowActionProps>(function WindowAction({
  ...properties
}, ref) {
  useHeader()
  return <Button {...properties} ref={ref} size="xsmall" />
})

export type WindowControlProps = Omit<WindowActionProps, "children">

const WindowMinimize = forwardRef<HTMLButtonElement, WindowControlProps>(function WindowMinimize({
  "aria-label": label = "Minimize",
  preventFocusOnPress = true,
  ...properties
}, ref) {
  return <WindowAction {...properties} ref={ref} aria-label={label} preventFocusOnPress={preventFocusOnPress}>
    <ArrowDownLeft {...iconProps(14)} />
  </WindowAction>
})

export interface WindowMaximizeProps extends WindowControlProps {
  readonly maximized?: boolean
}

const WindowMaximize = forwardRef<HTMLButtonElement, WindowMaximizeProps>(function WindowMaximize({
  "aria-label": label,
  maximized,
  onPress,
  ...properties
}, ref) {
  const header = useHeader()
  const selected = maximized ?? header.maximized
  return <WindowAction {...properties} ref={ref} onPress={onPress ?? header.onMaximize} aria-label={label ?? (selected ? "Restore" : "Maximize")}>
    {selected ? <Minimize2 {...iconProps(14)} /> : <Maximize2 {...iconProps(14)} />}
  </WindowAction>
})

export type WindowCloseProps = WindowControlProps

const WindowClose = forwardRef<HTMLButtonElement, WindowCloseProps>(function WindowClose({
  "aria-label": label = "Close",
  color = "danger",
  preventFocusOnPress = true,
  ...properties
}, ref) {
  return <WindowAction {...properties} ref={ref} aria-label={label} color={color} preventFocusOnPress={preventFocusOnPress}>
    <X {...iconProps(14)} />
  </WindowAction>
})

const Header = Object.assign(HeaderRoot, {
  Identity: WindowIdentity,
  Center: WindowCenter,
  Actions: WindowActions,
  Action: WindowAction,
  Minimize: WindowMinimize,
  Maximize: WindowMaximize,
  Close: WindowClose
})

export type WindowMoveCaptureProps = HTMLAttributes<HTMLDivElement>

/** The active full-viewport side of a Window move handoff. */
const WindowMoveCapture = forwardRef<HTMLDivElement, WindowMoveCaptureProps>(function WindowMoveCapture({
  style,
  ...properties
}, ref) {
  return <div {...properties} ref={ref} style={{
    position: "fixed",
    inset: 0,
    touchAction: "none",
    userSelect: "none",
    cursor: "grab",
    ...style
  }} />
})

/** One Surface with a ready-to-use header-and-content composition. */
export const Window = Object.assign(WindowRoot, {
  Header,
  Content: WindowContent,
  MoveCapture: WindowMoveCapture
})
