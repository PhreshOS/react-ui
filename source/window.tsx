import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { useResolvedAppearance } from "./appearance-context.js"
import { Button, type ButtonProps } from "./button.js"
import { resolveColor, type Color } from "./color.js"
import { transitionTiming } from "./motion-style.js"
import { scale } from "./scale.js"
import { Surface, type SurfaceProps } from "./surface.js"

interface HeaderState {
  readonly active: boolean
  readonly foreground: string
  readonly iconRadius: number
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
}

/** The composable top region of a window; its enclosing Surface owns the material. */
const HeaderRoot = forwardRef<HTMLDivElement, WindowHeaderProps>(function HeaderRoot({
  active = true,
  children,
  color,
  onPointerDown,
  style,
  ...properties
}, ref) {
  const resolved = useResolvedAppearance()
  const spacing = resolved.appearance.spacing
  const foreground = style?.color ?? resolveColor(color ?? "foreground:base", resolved.colors)
  const state: HeaderState = {
    active,
    foreground,
    iconRadius: scale(resolved.appearance.radius, "xsmall"),
    spacing,
    transition: transitionTiming(resolved.transaction, resolved.preferences.animations)
  }

  return <HeaderContext.Provider value={state}>
    <div
      {...properties}
      ref={ref}
      onPointerDown={onPointerDown}
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: spacing,
        minWidth: 0,
        height: 16 + spacing * 2,
        paddingInline: spacing,
        flexShrink: 0,
        userSelect: "none",
        touchAction: onPointerDown ? "none" : undefined,
        cursor: onPointerDown ? "grab" : undefined,
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
    <ControlIcon><path d="M1.5 7.5h7" /></ControlIcon>
  </WindowAction>
})

export interface WindowMaximizeProps extends WindowControlProps {
  readonly maximized?: boolean
}

const WindowMaximize = forwardRef<HTMLButtonElement, WindowMaximizeProps>(function WindowMaximize({
  "aria-label": label,
  maximized = false,
  ...properties
}, ref) {
  return <WindowAction {...properties} ref={ref} aria-label={label ?? (maximized ? "Restore" : "Maximize")}>
    <ControlIcon>{maximized
      ? <path d="M1 4h5v5H1zM4 1h5v5H6.5" strokeWidth="1.3" strokeLinejoin="round" />
      : <path d="M1.5 1.5h7v7h-7z" strokeWidth="1.3" strokeLinejoin="round" />}
    </ControlIcon>
  </WindowAction>
})

export type WindowCloseProps = WindowControlProps

const WindowClose = forwardRef<HTMLButtonElement, WindowCloseProps>(function WindowClose({
  "aria-label": label = "Close",
  color = "danger:base",
  preventFocusOnPress = true,
  ...properties
}, ref) {
  return <WindowAction {...properties} ref={ref} aria-label={label} color={color} preventFocusOnPress={preventFocusOnPress}>
    <ControlIcon><path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" /></ControlIcon>
  </WindowAction>
})

function ControlIcon({ children }: Readonly<{ children: ReactNode }>) {
  return <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    {children}
  </svg>
}

const Header = Object.assign(HeaderRoot, {
  Identity: WindowIdentity,
  Center: WindowCenter,
  Actions: WindowActions,
  Action: WindowAction,
  Minimize: WindowMinimize,
  Maximize: WindowMaximize,
  Close: WindowClose
})

/** One Surface with a ready-to-use header-and-content composition. */
export const Window = Object.assign(WindowRoot, {
  Header,
  Content: WindowContent
})
