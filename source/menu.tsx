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
  MenuItemRenderProps,
  MenuProps as AriaMenuProps,
  MenuSectionProps as AriaMenuSectionProps,
  SeparatorProps as AriaSeparatorProps
} from "react-aria-components"
import { useControlMetrics, type ControlMetrics } from "./control/control.js"
import { separatorColor } from "./control/field.js"
import { itemStyle, itemSurface, SelectionMark } from "./control/item.js"
import {
  ariaSelection,
  stringKey,
  type MultipleSelectionProps,
  type MultipleStringSelection,
  type NoSelectionProps,
  type SingleSelectionProps
} from "./control/selection.js"
import { surfaceRender } from "./control/surface-render.js"
import type { Color } from "./foundation/color.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { collectionHeaderStyle } from "./list-box.js"

type MenuContext = Readonly<{ color: Color, metrics: ControlMetrics, itemRadius: CSSProperties["borderRadius"], selecting: boolean }>

const MenuStyleContext = createContext<MenuContext | null>(null)

type MenuRootBaseProps<T extends object> = Omit<
  AriaMenuProps<T>,
  | "className" | "defaultSelectedKeys" | "disabledKeys" | "onAction" | "onSelectionChange" | "selectedKeys" | "selectionMode" | "style"
  | "shouldFocusWrap" | "shouldCloseOnSelect"
> & RadiusProps & Readonly<{
  className?: string
  /** Whether activating an Item closes the menu. Defaults to `true`. */
  closeOnSelect?: boolean
  /** Color laid beneath selected Items. */
  color?: Color
  /** Whether arrow keys wrap from the last Item to the first. */
  focusWrap?: boolean
  /** Runs with the value of the Item that was activated. */
  onAction?: (value: string) => void
  size?: ScaleLevel
  style?: CSSProperties
}>

export type MenuNoSelectionProps = NoSelectionProps
export type MenuSingleSelectionProps = SingleSelectionProps
export type MenuMultipleValue = MultipleStringSelection
export type MenuMultipleSelectionProps = MultipleSelectionProps

export type MenuRootProps<T extends object = object> = MenuRootBaseProps<T>
  & (MenuNoSelectionProps | MenuSingleSelectionProps | MenuMultipleSelectionProps)

const MenuRootImplementation = forwardRef(function Menu<T extends object = object>(
  properties: MenuRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className, closeOnSelect, color = "primary", defaultValue: _defaultValue, focusWrap, onAction, onChange: _onChange,
    radius, selectionMode = "none", size, style, value: _value, ...native
  } = properties
  const metrics = useControlMetrics(size, radius)
  // Items are controls: they take the control radius at their size.
  const itemRadius = metrics.radius
  const context = useMemo(
    () => ({ color, metrics, itemRadius, selecting: selectionMode !== "none" }),
    [color, metrics, itemRadius, selectionMode]
  )
  const selection = ariaSelection(properties, "none")

  return <MenuStyleContext.Provider value={context}>
    <AriaMenu
      {...native}
      {...selection}
      selectionMode={selection.selectionMode === "none" ? undefined : selection.selectionMode}
      shouldCloseOnSelect={closeOnSelect}
      shouldFocusWrap={focusWrap}
      ref={ref}
      className={className}
      onAction={onAction == null ? undefined : key => onAction(stringKey(key))}
      style={{
        display: "grid",
        gap: 2,
        minWidth: metrics.height * 5,
        padding: metrics.listInset,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        fontSize: metrics.fontSize,
        ...style
      }}
    />
  </MenuStyleContext.Provider>
})

export type MenuRootComponent = <T extends object = object>(
  properties: MenuRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface MenuItemProps<T = object> extends Omit<AriaMenuItemProps<T>, "className" | "id" | "isDisabled" | "render" | "style" | "shouldCloseOnSelect"> {
  /** Identity of this Item within its Menu. */
  readonly id: string
  readonly className?: string
  /** Whether activating this Item closes the menu, overriding the Menu. */
  readonly closeOnSelect?: boolean
  /** Color laid beneath this Item when it is selected. */
  readonly color?: Color
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

const MenuItemImplementation = forwardRef(function MenuItem<T = object>(
  { children, className, closeOnSelect, color, disabled = false, style, textValue, ...properties }: MenuItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { color: inherited, metrics, itemRadius, selecting } = useMenuStyle()
  const itemColor = color ?? inherited

  return <AriaMenuItem
    {...properties}
    shouldCloseOnSelect={closeOnSelect}
    ref={ref}
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    className={className}
    isDisabled={disabled}
    render={surfaceRender<MenuItemRenderProps>("div", state => itemSurface(metrics.visual, itemColor, {
      selected: state.isSelected,
      // Keyboard focus moves the highlight through a menu the way the pointer does;
      // pointer-restored focus alone must not keep an item highlighted.
      hovered: state.isHovered || state.isFocusVisible,
      pressed: state.isPressed,
      focusVisible: false,
      disabled: state.isDisabled
    }, itemRadius))}
    style={{ ...itemStyle(metrics, disabled), ...style }}
  >{state => <>
    {typeof children === "function" ? children(state) : children}
    {selecting && <SelectionMark visible={state.isSelected} />}
  </>}</AriaMenuItem>
})

export type MenuItemComponent = <T = object>(
  properties: MenuItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

// Selection belongs to the Menu, like every collection; a section only groups.
export type MenuSectionProps<T extends object = object> = Omit<
  AriaMenuSectionProps<T>,
  "defaultSelectedKeys" | "selectedKeys" | "onSelectionChange" | "selectionMode" | "disallowEmptySelection" | "shouldCloseOnSelect"
>

export type MenuHeaderProps = AriaHeaderProps

const MenuHeader = forwardRef<HTMLElement, MenuHeaderProps>(function MenuHeader({ style, ...properties }, ref) {
  const { metrics } = useMenuStyle()
  return <AriaHeader {...properties} ref={ref} style={collectionHeaderStyle(metrics, style)} />
})

export type MenuSeparatorProps = AriaSeparatorProps

const MenuSeparator = forwardRef<HTMLElement, MenuSeparatorProps>(function MenuSeparator({ style, ...properties }, ref) {
  const { metrics } = useMenuStyle()
  return <AriaSeparator {...properties} ref={ref} style={{
    height: 1,
    marginBlock: 4,
    marginInline: metrics.inset,
    border: 0,
    background: separatorColor(metrics),
    ...style
  }} />
})

function useMenuStyle() {
  const context = useContext(MenuStyleContext)
  if (context == null) throw new Error("Menu parts must be used inside Menu")
  return context
}

/** A keyboard-navigable collection of commands or selectable options. */
export const Menu = Object.assign(MenuRootImplementation as MenuRootComponent, {
  Item: MenuItemImplementation as MenuItemComponent,
  Section: AriaMenuSection as <T extends object = object>(properties: MenuSectionProps<T>) => ReactElement | null,
  Header: MenuHeader,
  Separator: MenuSeparator
})

export type MenuProps<T extends object = object> = MenuRootProps<T>
