import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
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
  SeparatorProps as AriaSeparatorProps,
  Selection
} from "react-aria-components"
import { colorOpacity } from "./color.js"
import { controlFontWeight, controlOpacity, useControlTheme, type ControlColor, type ControlTheme } from "./control.js"
import type { ScaleLevel } from "./scale.js"
import {
  multipleSelection,
  singleSelection,
  stringKey,
  toAriaSelection,
  type MultipleStringSelection,
  type MultipleStringSelectionProps,
  type SingleStringSelectionProps
} from "./selection.js"

type MenuTheme = Readonly<{
  color?: ControlColor
  size: ScaleLevel
  theme: ControlTheme
}>

const MenuThemeContext = createContext<MenuTheme | null>(null)

type MenuRootBaseProps<T extends object> = Omit<
  AriaMenuProps<T>,
  | "className"
  | "defaultSelectedKeys"
  | "disabledKeys"
  | "onAction"
  | "onSelectionChange"
  | "selectedKeys"
  | "selectionMode"
  | "style"
> & Readonly<{
  readonly className?: string
  readonly color?: ControlColor
  readonly disabledValues?: readonly string[]
  readonly onItemAction?: (value: string) => void
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}>

export type MenuNoSelectionProps = Readonly<{
  selectionMode?: "none"
  value?: never
  defaultValue?: never
  onChange?: never
}>

export type MenuSingleSelectionProps = SingleStringSelectionProps & Readonly<{
  selectionMode: "single"
}>

export type MenuMultipleValue = MultipleStringSelection

export type MenuMultipleSelectionProps = MultipleStringSelectionProps & Readonly<{
  selectionMode: "multiple"
}>

export type MenuRootProps<T extends object = object> = MenuRootBaseProps<T>
  & (MenuNoSelectionProps | MenuSingleSelectionProps | MenuMultipleSelectionProps)

const MenuRootImplementation = forwardRef(function MenuRoot<T extends object = object>(
  properties: MenuRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className,
    color,
    defaultValue,
    disabledValues,
    onChange,
    onItemAction,
    selectionMode = "none",
    size = "medium",
    style,
    value,
    ...native
  } = properties
  const theme = useControlTheme({ color, size })
  const context = useMemo(() => ({ color, size, theme }), [color, size, theme])
  return <MenuThemeContext.Provider value={context}>
    <AriaMenu
      {...native}
      {...selectionProperties(properties)}
      ref={ref}
      className={className}
      disabledKeys={disabledValues}
      selectionMode={selectionMode === "none" ? undefined : selectionMode}
      onAction={onItemAction == null ? undefined : key => onItemAction(stringKey(key))}
      style={{
        display: "grid",
        gap: theme.gap,
        minWidth: theme.height * 4,
        padding: theme.gap,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        fontSize: theme.fontSize,
        ...style
      }}
    />
  </MenuThemeContext.Provider>
})

function selectionProperties<T extends object>(properties: MenuRootProps<T>) {
  const selectedKeys = toAriaSelection(properties.value)
  const defaultSelectedKeys = toAriaSelection(properties.defaultValue)
  const onSelectionChange = properties.onChange == null
    ? undefined
    : (selection: Selection) => {
        if (properties.selectionMode === "multiple") {
          properties.onChange?.(multipleSelection(selection))
          return
        }

        if (properties.selectionMode === "single") properties.onChange?.(singleSelection(selection))
      }

  return {
    ...(selectedKeys !== undefined ? { selectedKeys } : {}),
    ...(defaultSelectedKeys !== undefined ? { defaultSelectedKeys } : {}),
    ...(onSelectionChange !== undefined ? { onSelectionChange } : {})
  }
}

export type MenuRootComponent = <T extends object = object>(
  properties: MenuRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const MenuRoot = MenuRootImplementation as MenuRootComponent

export interface MenuItemProps<T = object> extends Omit<AriaMenuItemProps<T>, "className" | "id" | "isDisabled" | "style"> {
  readonly className?: string
  readonly color?: ControlColor
  readonly disabled?: boolean
  readonly id?: string
  readonly style?: CSSProperties
}

const MenuItemImplementation = forwardRef(function MenuItem<T = object>(
  { className, color, disabled = false, style, ...properties }: MenuItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const inherited = useContext(MenuThemeContext)
  const item = { className, disabled, properties, ref, style }
  return inherited != null && color === undefined
    ? <MenuItemView {...item} theme={inherited.theme} />
    : <ResolvedMenuItem {...item} color={color ?? inherited?.color} size={inherited?.size} />
})

function ResolvedMenuItem<T>({ color, size, ...properties }: Readonly<{
  color?: ControlColor
  size?: ScaleLevel
}> & MenuItemViewProps<T>) {
  return <MenuItemView {...properties} theme={useControlTheme({ color, size })} />
}

type MenuItemViewProps<T> = Readonly<{
  className?: string
  disabled: boolean
  properties: Omit<MenuItemProps<T>, "className" | "color" | "disabled" | "style">
  ref: ForwardedRef<HTMLDivElement>
  style?: CSSProperties
}>

function MenuItemView<T>({ className, disabled, properties, ref, style, theme }: MenuItemViewProps<T> & Readonly<{ theme: ControlTheme }>) {
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
          : { background: "transparent", color: "inherit" }

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
        opacity: disabled ? controlOpacity.disabled : 1,
        userSelect: "none",
        ...paint,
        ...style
      }
    }}
  />
}

export type MenuItemComponent = <T = object>(
  properties: MenuItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const MenuItem = MenuItemImplementation as MenuItemComponent

export type MenuSectionProps<T extends object = object> = AriaMenuSectionProps<T>

export const MenuSection = AriaMenuSection

export type MenuHeaderProps = AriaHeaderProps

export const MenuHeader = forwardRef<HTMLElement, MenuHeaderProps>(function MenuHeader({ style, ...properties }, ref) {
  const theme = useMenuTheme()
  return <AriaHeader
    {...properties}
    ref={ref}
    style={{
      paddingInline: Math.max(8, theme.spacing),
      paddingBlock: theme.gap,
      fontWeight: controlFontWeight,
      opacity: controlOpacity.secondary,
      ...style
    }}
  />
})

export type MenuSeparatorProps = AriaSeparatorProps

export const MenuSeparator = forwardRef<HTMLElement, MenuSeparatorProps>(function MenuSeparator({ style, ...properties }, ref) {
  const theme = useMenuTheme()
  return <AriaSeparator
    {...properties}
    ref={ref}
    style={{
      height: 1,
      marginBlock: theme.gap,
      border: 0,
      background: colorOpacity(theme.tint, controlOpacity.separator),
      ...style
    }}
  />
})

function useMenuTheme() {
  const inherited = useContext(MenuThemeContext)
  if (inherited == null) throw new Error("Menu parts must be used inside Menu")
  return inherited.theme
}

/** A keyboard-navigable collection of commands or selectable options. */
export const Menu = Object.assign(MenuRoot, {
  Item: MenuItem,
  Section: MenuSection,
  Header: MenuHeader,
  Separator: MenuSeparator
})

export type MenuProps<T extends object = object> = MenuRootProps<T>
