import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, ReactElement, RefAttributes } from "react"
import {
  Header as AriaHeader,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  Separator as AriaSeparator
} from "react-aria-components"
import type {
  HeaderProps as AriaHeaderProps,
  MenuItemProps as AriaMenuItemProps,
  MenuProps as AriaMenuProps,
  MenuSectionProps as AriaMenuSectionProps,
  SeparatorProps as AriaSeparatorProps
} from "react-aria-components"
import { colorOpacity } from "./color.js"
import { useControlTheme, type ControlColor, type ControlTheme } from "./control.js"
import type { ScaleLevel } from "./scale.js"

type MenuTheme = Readonly<{
  color?: ControlColor
  size: ScaleLevel
  theme: ControlTheme
}>

const MenuThemeContext = createContext<MenuTheme | null>(null)

export interface MenuRootProps<T extends object = object> extends Omit<AriaMenuProps<T>, "className" | "style"> {
  readonly className?: string
  readonly color?: ControlColor
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

const MenuRootImplementation = forwardRef(function MenuRoot<T extends object = object>(
  { className, color, size = "medium", style, ...properties }: MenuRootProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const theme = useControlTheme({ color, size })
  return <MenuThemeContext.Provider value={{ color, size, theme }}>
    <AriaMenu
      {...properties}
      ref={ref}
      className={className}
      style={{
        display: "grid",
        gap: theme.gap,
        minWidth: 160,
        padding: theme.gap,
        boxSizing: "border-box",
        outline: "none",
        color: theme.foreground,
        fontFamily: "inherit",
        fontSize: theme.fontSize,
        ...style
      }}
    />
  </MenuThemeContext.Provider>
})

export type MenuRootComponent = <T extends object = object>(
  properties: MenuRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const MenuRoot = MenuRootImplementation as MenuRootComponent

export interface MenuItemProps<T = object> extends Omit<AriaMenuItemProps<T>, "className" | "isDisabled" | "style"> {
  readonly className?: string
  readonly color?: ControlColor
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

const MenuItemImplementation = forwardRef(function MenuItem<T = object>(
  { className, color, disabled = false, style, ...properties }: MenuItemProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const inherited = useContext(MenuThemeContext)
  const theme = useControlTheme({ color: color ?? inherited?.color, size: inherited?.size ?? "medium" })

  return <AriaMenuItem
    {...properties}
    ref={ref}
    className={className}
    isDisabled={disabled}
    style={state => {
      const paint = state.isPressed
        ? theme.paints.palette.pressed
        : state.isHovered || state.isSelected
          ? theme.paints.palette.hover
          : { background: "transparent", color: theme.foreground }

      return {
        ...theme.transition,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.gap,
        minWidth: 0,
        minHeight: theme.height,
        paddingInline: Math.max(8, theme.spacing),
        boxSizing: "border-box",
        borderRadius: theme.radius,
        outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
        outlineOffset: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.46 : 1,
        userSelect: "none",
        ...paint,
        ...style
      }
    }}
  />
})

export type MenuItemComponent = <T = object>(
  properties: MenuItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const MenuItem = MenuItemImplementation as MenuItemComponent

export type MenuSectionProps<T extends object = object> = AriaMenuSectionProps<T>

export const MenuSection = AriaMenuSection

export type MenuHeaderProps = AriaHeaderProps

export const MenuHeader = forwardRef<HTMLElement, MenuHeaderProps>(function MenuHeader({ style, ...properties }, ref) {
  const inherited = useContext(MenuThemeContext)
  const fallback = useControlTheme({})
  const theme = inherited?.theme ?? fallback

  return <AriaHeader
    {...properties}
    ref={ref}
    style={{
      paddingInline: Math.max(8, theme.spacing),
      paddingBlock: theme.gap,
      fontWeight: 600,
      opacity: 0.7,
      ...style
    }}
  />
})

export type MenuSeparatorProps = AriaSeparatorProps

export const MenuSeparator = forwardRef<HTMLElement, MenuSeparatorProps>(function MenuSeparator({ style, ...properties }, ref) {
  const inherited = useContext(MenuThemeContext)
  const fallback = useControlTheme({})
  const theme = inherited?.theme ?? fallback

  return <AriaSeparator
    {...properties}
    ref={ref}
    style={{
      height: 1,
      marginBlock: theme.gap,
      border: 0,
      background: colorOpacity(theme.foreground, 0.14),
      ...style
    }}
  />
})

/** A keyboard-navigable collection of commands or selectable options. */
export const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Item: MenuItem,
  Section: MenuSection,
  Header: MenuHeader,
  Separator: MenuSeparator
})

export type MenuProps<T extends object = object> = MenuRootProps<T>
