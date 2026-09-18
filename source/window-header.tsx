import { createContext, forwardRef, useContext } from "react"
import type { ComponentProps, CSSProperties, HTMLAttributes, ReactNode } from "react"
import { useResolvedAppearance } from "./appearance-context.js"
import { Button, type ButtonProps } from "./button.js"
import { transitionTiming } from "./motion-style.js"
import { scale } from "./scale.js"

interface WindowHeaderState {
  readonly active: boolean
  readonly foreground: string
  readonly iconRadius: number
  readonly spacing: number
  readonly transition: CSSProperties
}

const WindowHeaderContext = createContext<WindowHeaderState | null>(null)

function useWindowHeader() {
  const value = useContext(WindowHeaderContext)
  if (value === null) throw new Error("WindowHeader parts require WindowHeader.Root")
  return value
}

export interface WindowHeaderRootProps extends HTMLAttributes<HTMLDivElement> {
  /** Attenuates the identity when this header is not active. */
  readonly active?: boolean
}

/** The composable top region of a window; its enclosing Surface owns the material. */
export const WindowHeaderRoot = forwardRef<HTMLDivElement, WindowHeaderRootProps>(function WindowHeaderRoot({
  active = true,
  children,
  onPointerDown,
  style,
  ...properties
}, ref) {
  const resolved = useResolvedAppearance()
  const spacing = resolved.appearance.spacing
  const state: WindowHeaderState = {
    active,
    foreground: resolved.colors.foreground,
    iconRadius: scale(resolved.appearance.radius, "xsmall"),
    spacing,
    transition: transitionTiming(resolved.transaction, resolved.preferences.animations)
  }

  return <WindowHeaderContext.Provider value={state}>
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
        ...style
      }}
    >{children}</div>
  </WindowHeaderContext.Provider>
})

export interface WindowHeaderIdentityProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  readonly icon?: string
  readonly title?: ReactNode
}

/** The icon and truncating title share the window's active treatment. */
export const WindowHeaderIdentity = forwardRef<HTMLDivElement, WindowHeaderIdentityProps>(function WindowHeaderIdentity({
  icon,
  title,
  style,
  ...properties
}, ref) {
  const { active, iconRadius, spacing, transition } = useWindowHeader()

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

export type WindowHeaderCenterProps = HTMLAttributes<HTMLDivElement>

/** Optional flexible space for application-owned content. */
export const WindowHeaderCenter = forwardRef<HTMLDivElement, WindowHeaderCenterProps>(function WindowHeaderCenter({
  onDoubleClick,
  onPointerDown,
  style,
  ...properties
}, ref) {
  useWindowHeader()

  return <div {...properties} ref={ref}
    onDoubleClick={event => { event.stopPropagation(); onDoubleClick?.(event) }}
    onPointerDown={event => { event.stopPropagation(); onPointerDown?.(event) }}
    style={{ display: "flex", alignItems: "center", flex: "1 1 auto", minWidth: 0, ...style }}
  />
})

export type WindowHeaderActionsProps = HTMLAttributes<HTMLDivElement>

/** End-aligned controls that do not begin a header drag or double-click action. */
export const WindowHeaderActions = forwardRef<HTMLDivElement, WindowHeaderActionsProps>(function WindowHeaderActions({
  onDoubleClick,
  onPointerDown,
  style,
  ...properties
}, ref) {
  const { spacing } = useWindowHeader()

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

export type WindowHeaderActionProps = Omit<ButtonProps, "size">

/** A compact header action; extra actions use the same treatment as the standard controls. */
export const WindowHeaderAction = forwardRef<HTMLButtonElement, WindowHeaderActionProps>(function WindowHeaderAction({
  style,
  ...properties
}, ref) {
  const { foreground } = useWindowHeader()
  return <Button {...properties} ref={ref} size="xsmall" style={{ color: foreground, ...style }} />
})

export type WindowHeaderControlProps = Omit<WindowHeaderActionProps, "children">

export const WindowHeaderMinimize = forwardRef<HTMLButtonElement, WindowHeaderControlProps>(function WindowHeaderMinimize({
  "aria-label": label = "Minimize",
  preventFocusOnPress = true,
  ...properties
}, ref) {
  return <WindowHeaderAction {...properties} ref={ref} aria-label={label} preventFocusOnPress={preventFocusOnPress}>
    <ControlIcon><path d="M1.5 7.5h7" /></ControlIcon>
  </WindowHeaderAction>
})

export interface WindowHeaderMaximizeProps extends WindowHeaderControlProps {
  readonly maximized?: boolean
}

export const WindowHeaderMaximize = forwardRef<HTMLButtonElement, WindowHeaderMaximizeProps>(function WindowHeaderMaximize({
  "aria-label": label,
  maximized = false,
  ...properties
}, ref) {
  return <WindowHeaderAction {...properties} ref={ref} aria-label={label ?? (maximized ? "Restore" : "Maximize")}>
    <ControlIcon>{maximized
      ? <path d="M1 4h5v5H1zM4 1h5v5H6.5" strokeWidth="1.3" strokeLinejoin="round" />
      : <path d="M1.5 1.5h7v7h-7z" strokeWidth="1.3" strokeLinejoin="round" />}
    </ControlIcon>
  </WindowHeaderAction>
})

export type WindowHeaderCloseProps = Omit<WindowHeaderControlProps, "color">

export const WindowHeaderClose = forwardRef<HTMLButtonElement, WindowHeaderCloseProps>(function WindowHeaderClose({
  "aria-label": label = "Close",
  preventFocusOnPress = true,
  ...properties
}, ref) {
  return <WindowHeaderAction {...properties} ref={ref} aria-label={label} color="danger:base" preventFocusOnPress={preventFocusOnPress}>
    <ControlIcon><path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" /></ControlIcon>
  </WindowHeaderAction>
})

function ControlIcon({ children }: Readonly<{ children: ReactNode }>) {
  return <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    {children}
  </svg>
}

export const WindowHeader = Object.assign(WindowHeaderRoot, {
  Root: WindowHeaderRoot,
  Identity: WindowHeaderIdentity,
  Center: WindowHeaderCenter,
  Actions: WindowHeaderActions,
  Action: WindowHeaderAction,
  Minimize: WindowHeaderMinimize,
  Maximize: WindowHeaderMaximize,
  Close: WindowHeaderClose
})

export type WindowHeaderProps = ComponentProps<typeof WindowHeaderRoot>
