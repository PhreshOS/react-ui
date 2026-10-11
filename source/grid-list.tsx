import { createContext, forwardRef, useContext, useLayoutEffect, useMemo, useState } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
import {
  GridList as AriaGridList,
  GridListHeader as AriaGridListHeader,
  GridListItem as AriaGridListItem,
  GridListSection as AriaGridListSection
} from "react-aria-components"
import type {
  GridListHeaderProps as AriaGridListHeaderProps,
  GridListItemProps as AriaGridListItemProps,
  GridListItemRenderProps,
  GridListProps as AriaGridListProps,
  GridListSectionProps as AriaGridListSectionProps
} from "react-aria-components"
import { useControlMetrics, type ControlMetrics } from "./control/control.js"
import { dropTargetOutline, itemSurface, SelectionMark, selectionMarkSize } from "./control/item.js"
import { Spinner } from "./spinner.js"
import {
  ariaSelection,
  type MultipleSelectionProps,
  type MultipleStringSelection,
  type NoSelectionProps,
  type SingleStringSelectionProps
} from "./control/selection.js"
import { surfaceRender } from "./control/surface-render.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import type { Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { collectionHeaderStyle } from "./list-box.js"

type GridListContext = Readonly<{ color: Color, restColor: Color, metrics: ControlMetrics, columns: string }>

const GridListStyleContext = createContext<GridListContext | null>(null)

type GridListRootBaseProps<T extends object> = Omit<
  AriaGridListProps<T>,
  "className" | "defaultSelectedKeys" | "disabledKeys" | "layout" | "onSelectionChange" | "selectedKeys" | "selectionMode" | "style"
> & RadiusProps & Readonly<{
  className?: string
  /** Color laid beneath selected Items. */
  color?: Color
  /** Color of Items that are not selected: `default` unless given. */
  restColor?: Color
  /** The narrowest an Item may be; the grid fits as many columns as that allows. Sixteen times the spacing by default. */
  itemWidth?: CSSProperties["width"]
  /**
   * Whether fewer Items than fit share the whole width. Off by default, so an open collection keeps
   * its Item width whatever it holds; on for a fixed set, such as a row of counts.
   */
  stretch?: boolean
  size?: ScaleLevel
  style?: CSSProperties
}>

/** Cards to show only, such as the progress of work, with nothing to choose. */
export type GridListNoSelectionProps = NoSelectionProps

export type GridListSingleSelectionProps = SingleStringSelectionProps & Readonly<{ selectionMode?: "single" }>

export type GridListMultipleValue = MultipleStringSelection

export type GridListMultipleSelectionProps = MultipleSelectionProps

/** A collection laid out as a grid of cards. Single selection is the default; `none` only shows them. */
export type GridListRootProps<T extends object = object> = GridListRootBaseProps<T>
  & (GridListNoSelectionProps | GridListSingleSelectionProps | GridListMultipleSelectionProps)

const GridListRootImplementation = forwardRef(function GridList<T extends object = object>(
  properties: GridListRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className, color = "primary", restColor = "default", defaultValue: _defaultValue, itemWidth, onChange: _onChange, radius,
    selectionMode: _selectionMode, size, stretch = false, style, value: _value, ...native
  } = properties
  const metrics = useControlMetrics(size, radius)
  const width = itemWidth ?? metrics.visual.spacing * 16
  // As many columns as fit, each at least the Item width; a Section repeats the same columns.
  // Stretched, the columns no Item fills fold away and the rest share their width.
  const columns = `repeat(${stretch ? "auto-fit" : "auto-fill"}, minmax(min(${typeof width === "number" ? `${width}px` : width}, 100%), 1fr))`
  const context = useMemo(() => ({ color, restColor, metrics, columns }), [color, restColor, metrics, columns])
  const direction = resolveDirection(native.dir, useDirection())

  return <GridListStyleContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaGridList
      {...native}
      {...ariaSelection(properties, "single")}
      ref={ref}
      dir={direction}
      layout="grid"
      className={className}
      style={state => ({
        display: "grid",
        gridTemplateColumns: columns,
        gap: metrics.gap * 2,
        minWidth: 0,
        padding: metrics.listInset,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        fontSize: metrics.fontSize,
        borderRadius: metrics.radius,
        ...dropTargetOutline(metrics, state.isDropTarget),
        ...style
      })}
    /></AriaDirectionBoundary>
  </GridListStyleContext.Provider>
})

export type GridListRootComponent = <T extends object = object>(
  properties: GridListRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface GridListItemProps<T = object> extends Omit<AriaGridListItemProps<T>, "className" | "id" | "isDisabled" | "render" | "style"> {
  /** Identity of this Item within its collection. */
  readonly id: string
  readonly className?: string
  /** Color laid beneath this Item when it is selected. */
  readonly color?: Color
  /** Color of this Item while it is not selected; the GridList's unless given. */
  readonly restColor?: Color
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

/** What a card tells the Mark it holds: whether it is selected, and that a Mark took the corner's place. */
const ItemMarkContext = createContext<Readonly<{ selected: boolean, claim: () => () => void }> | null>(null)

/**
 * One card. It holds whatever it is given, and shows a check when selected: in its corner, or where
 * a GridList.Mark it holds stands.
 */
const GridListItemImplementation = forwardRef(function GridListItem<T = object>(
  { children, className, color, restColor, disabled = false, style, textValue, ...properties }: GridListItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const inherited = useGridListStyle()
  const itemColor = color ?? inherited.color
  const { metrics } = inherited
  // How many Marks this card holds: with one, the check stands there and not in the corner.
  const [marks, setMarks] = useState(0)
  const claim = useMemo(() => () => {
    setMarks(count => count + 1)
    return () => setMarks(count => count - 1)
  }, [])

  return <AriaGridListItem
    {...properties}
    ref={ref}
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    className={className}
    isDisabled={disabled}
    render={surfaceRender<GridListItemRenderProps>("div", state => ({
      ...itemSurface(metrics.visual, itemColor, {
        // What a drag would drop into shows as chosen.
        selected: state.isSelected || state.isDropTarget === true,
        hovered: state.isHovered,
        pressed: state.isPressed,
        focusVisible: state.isFocusVisible,
        disabled: state.isDisabled
      }, metrics.radius),
      // Unlike a list row, a card is a whole Surface: flat, in its rest color, in its selection
      // color once selected, with the default material in both.
      ...(state.isSelected || state.isDropTarget === true ? {} : { color: restColor ?? inherited.restColor }),
      material: undefined
    }))}
    style={{
      position: "relative",
      display: "grid",
      alignContent: "start",
      gap: metrics.gap,
      minWidth: 0,
      padding: metrics.inset,
      boxSizing: "border-box",
      cursor: disabled ? "not-allowed" : "pointer",
      userSelect: "none",
      outlineOffset: -1,
      ...style
    }}
  >{state => <ItemMarkContext.Provider value={{ selected: state.isSelected, claim }}>
    {typeof children === "function" ? children(state) : children}
    {marks === 0 && <span style={{ position: "absolute", insetBlockStart: metrics.inset, insetInlineEnd: metrics.inset, display: "flex" }}>
      <SelectionMark visible={state.isSelected} />
    </span>}
  </ItemMarkContext.Provider>}</AriaGridListItem>
})

export type GridListItemComponent = <T = object>(
  properties: GridListItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface GridListSectionProps<T extends object = object> extends Omit<AriaGridListSectionProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

/** A Section spans the whole grid and lays its own Items out in the same columns. */
const GridListSectionImplementation = forwardRef(function GridListSection<T extends object = object>(
  { className, style, ...properties }: GridListSectionProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { metrics, columns } = useGridListStyle()
  return <AriaGridListSection {...properties} ref={ref} className={className} style={{
    gridColumn: "1 / -1",
    display: "grid",
    gridTemplateColumns: columns,
    gap: metrics.gap * 2,
    minWidth: 0,
    ...style
  }} />
})

export type GridListSectionComponent = <T extends object = object>(
  properties: GridListSectionProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export type GridListHeaderProps = Omit<AriaGridListHeaderProps, "style"> & Readonly<{ style?: CSSProperties }>

/** A Section's heading, across the whole row. */
const GridListHeader = forwardRef<HTMLDivElement, GridListHeaderProps>(function GridListHeader({ style, ...properties }, ref) {
  const { metrics } = useGridListStyle()
  return <AriaGridListHeader {...properties} ref={ref} style={collectionHeaderStyle(metrics, { gridColumn: "1 / -1", paddingInline: 0, ...style })} />
})

function useGridListStyle() {
  const context = useContext(GridListStyleContext)
  if (context == null) throw new Error("GridList parts must be used inside GridList")
  return context
}

/** A selectable grid of cards whose Items and Sections remain independently composable. */
export interface GridListMarkProps {
  /** Work the card started is under way: a Spinner shows here in place of the check. */
  readonly pending?: boolean
}

/**
 * Where a card shows its check, in place of its corner: the check once the card is selected, and a
 * Spinner while work it started is under way. It holds its place either way, so nothing beside it moves.
 */
function GridListMark({ pending = false }: GridListMarkProps) {
  const item = useContext(ItemMarkContext)
  if (!item) throw new Error("GridList.Mark belongs inside a GridList.Item")
  const { claim } = item
  useLayoutEffect(() => claim(), [claim])
  return pending
    ? <Spinner decorative color="currentColor" style={{ width: selectionMarkSize, height: selectionMarkSize }} />
    : <SelectionMark visible={item.selected} placed />
}

export const GridList = Object.assign(GridListRootImplementation as GridListRootComponent, {
  Item: GridListItemImplementation as GridListItemComponent,
  Section: GridListSectionImplementation as GridListSectionComponent,
  Header: GridListHeader,
  Mark: GridListMark
})

export type GridListProps<T extends object = object> = GridListRootProps<T>
