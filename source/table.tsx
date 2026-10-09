import { createContext, forwardRef, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader
} from "react-aria-components"
import type {
  CellProps as AriaCellProps,
  ColumnProps as AriaColumnProps,
  RowProps as AriaRowProps,
  SortDescriptor,
  TableBodyProps as AriaTableBodyProps,
  TableHeaderProps as AriaTableHeaderProps,
  TableProps as AriaTableProps
} from "react-aria-components"
import { controlFontWeight, controlOpacity, transition, useControlMetrics, type ControlMetrics, secondaryFontSize } from "./control/control.js"
import { separatorColor } from "./control/field.js"
import { dropTargetOutline, itemPaint } from "./control/item.js"
import {
  ariaSelection,
  stringKey,
  type MultipleSelectionProps,
  type MultipleStringSelection,
  type NoSelectionProps,
  type SingleSelectionProps
} from "./control/selection.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { colorOpacity, type Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { dimmedClass } from "./surface/surface.js"
import { ChevronUp } from "lucide-react"
import { iconProps } from "./control/icon.js"

type TableContext = Readonly<{
  color: Color
  interactive: boolean
  metrics: ControlMetrics
  /** A Column says the least room it takes, or forgets it with `null`. */
  measure: (column: string, least: string | null) => void
}>

const TableStyleContext = createContext<TableContext | null>(null)

export type TableSortDirection = "ascending" | "descending"

export interface TableSort {
  readonly column: string
  readonly direction: TableSortDirection
}

type TableRootBaseProps = Omit<
  AriaTableProps,
  | "className" | "defaultSelectedKeys" | "disabledKeys" | "onRowAction" | "onSelectionChange"
  | "onSortChange" | "selectedKeys" | "selectionMode" | "sortDescriptor" | "style"
  // Expandable rows are not part of Table; use Tree for hierarchy.
  | "expandedKeys" | "defaultExpandedKeys" | "onExpandedChange" | "treeColumn"
  | "shouldSelectOnPressUp"
> & RadiusProps & Readonly<{
  className?: string
  /** Color laid beneath selected Rows. */
  color?: Color
  /** Runs with the value of the Row that was activated. */
  onAction?: (value: string) => void
  onSortChange?: (sort: TableSort) => void
  /** Whether a Row is selected when the press ends instead of when it starts. */
  selectOnPressUp?: boolean
  size?: ScaleLevel
  sort?: TableSort
  style?: CSSProperties
}>

export type TableNoSelectionProps = NoSelectionProps
export type TableSingleSelectionProps = SingleSelectionProps
export type TableMultipleValue = MultipleStringSelection
export type TableMultipleSelectionProps = MultipleSelectionProps

export type TableRootProps = TableRootBaseProps
  & (TableNoSelectionProps | TableSingleSelectionProps | TableMultipleSelectionProps)

/** Structured rows and columns with optional selection and consumer-owned sorting. */
const TableRoot = forwardRef<HTMLTableElement | HTMLDivElement, TableRootProps>(function Table(properties, ref) {
  const {
    className, color = "primary", defaultValue: _defaultValue, onAction, onChange: _onChange, onSortChange,
    radius, selectOnPressUp, selectionMode = "none", size, sort, style, value: _value, ...native
  } = properties
  const metrics = useControlMetrics(size, radius)
  // The least room each Column takes, from its width or its minimum.
  const [least, setLeast] = useState<Readonly<Record<string, string>>>({})
  const measure = useCallback((column: string, room: string | null) => setLeast(current => {
    if ((current[column] ?? null) === room) return current
    const { [column]: _previous, ...rest } = current
    return room === null ? rest : { ...rest, [column]: room }
  }), [])
  const context = useMemo<TableContext>(
    () => ({ color, interactive: selectionMode !== "none" || onAction != null, metrics, measure }),
    [color, metrics, onAction, selectionMode, measure]
  )
  const rooms = Object.values(least)
  const direction = resolveDirection(native.dir, useDirection())

  return <TableStyleContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaTable
      {...native}
      shouldSelectOnPressUp={selectOnPressUp}
      {...ariaSelection(properties, "none")}
      {...(sort === undefined ? {} : { sortDescriptor: sort })}
      ref={ref}
      dir={direction}
      className={className}
      onRowAction={onAction == null ? undefined : key => onAction(stringKey(key))}
      onSortChange={onSortChange == null ? undefined : descriptor => onSortChange(tableSort(descriptor))}
      style={state => ({
        width: "100%",
        // Columns that state their room lay the Table out by it, and the Table never grows narrower
        // than all of it together: past what holds it, it is scrolled, never crushed. Otherwise the
        // Table is as wide as its content.
        ...rooms.length
          ? { tableLayout: "fixed", minWidth: `calc(${rooms.join(" + ")})` }
          : { minWidth: "max-content" },
        borderCollapse: "separate",
        borderSpacing: 0,
        boxSizing: "border-box",
        // Row paints belong to the table, so the table clips them to its own radius.
        borderRadius: metrics.radius,
        overflow: "hidden",
        fontFamily: "inherit",
        fontSize: metrics.fontSize,
        ...dropTargetOutline(metrics, state.isDropTarget),
        ...style
      })}
    /></AriaDirectionBoundary>
  </TableStyleContext.Provider>
})

function tableSort(descriptor: SortDescriptor): TableSort {
  return { column: stringKey(descriptor.column), direction: descriptor.direction }
}

export interface TableHeaderProps<T extends object = object> extends Omit<AriaTableHeaderProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

const TableHeaderImplementation = forwardRef(function TableHeader<T extends object = object>(
  { className, style, ...properties }: TableHeaderProps<T>,
  ref: ForwardedRef<HTMLTableSectionElement | HTMLDivElement>
) {
  useTableStyle()
  return <AriaTableHeader {...properties} ref={ref} className={className} style={style} />
})

export type TableHeaderComponent = <T extends object = object>(
  properties: TableHeaderProps<T> & RefAttributes<HTMLTableSectionElement | HTMLDivElement>
) => ReactElement | null

export interface TableColumnProps extends Omit<AriaColumnProps, "allowsSorting" | "allowsArrowNavigation" | "className" | "id" | "isRowHeader" | "style" | "width" | "minWidth" | "maxWidth" | "defaultWidth"> {
  /** Whether arrow keys move between cells while focus is inside this one. */
  readonly arrowNavigation?: boolean

  /** Identity of this Column, reported in sort changes. */
  readonly id: string
  /** Whether cells in this Column label their Row. */
  readonly rowHeader?: boolean
  /** Whether pressing this Column requests a sort. */
  readonly sortable?: boolean
  /** The Column's width, in pixels or any CSS length. */
  readonly width?: number | string
  /**
   * For a Column without a width, which takes the room the others leave: the least it keeps when
   * that room runs out.
   */
  readonly minWidth?: number | string
  readonly className?: string
  readonly style?: CSSProperties
}

const TableColumn = forwardRef<HTMLTableCellElement | HTMLDivElement, TableColumnProps>(function TableColumn(
  { sortable = false, rowHeader, arrowNavigation, children, className, style, textValue, width, minWidth, ...properties },
  ref
) {
  const { metrics, measure } = useTableStyle()
  const { colors } = metrics.visual
  const room = width ?? minWidth
  const least = room === undefined ? null : typeof room === "number" ? `${room}px` : room

  useLayoutEffect(() => {
    measure(properties.id, least)
    return () => measure(properties.id, null)
  }, [measure, properties.id, least])

  return <AriaColumn
    {...properties}
    allowsArrowNavigation={arrowNavigation}
    ref={ref}
    isRowHeader={rowHeader}
    allowsSorting={sortable}
    className={className}
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    style={state => ({
      ...transition(metrics.visual, "color, outline-color"),
      height: metrics.height,
      paddingInline: metrics.inset,
      boxSizing: "border-box",
      outline: `3px solid ${state.isFocusVisible ? colorOpacity(colors.primary, 0.34) : "transparent"}`,
      outlineOffset: -3,
      cursor: sortable ? "pointer" : "default",
      fontSize: secondaryFontSize,
      fontWeight: controlFontWeight,
      textAlign: "start",
      userSelect: "none",
      opacity: state.isHovered && sortable ? 1 : controlOpacity.secondary,
      width,
      ...style
    })}
  >{state => <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: metrics.gap, minWidth: 0 }}>
    {/* A narrow column cuts its name short rather than spilling into the next one. */}
    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeof children === "function" ? children(state) : children}</span>
    {sortable && state.sortDirection != null && <ChevronUp {...iconProps(14)}
      style={{ ...transition(metrics.visual, "rotate"), flexShrink: 0, rotate: state.sortDirection === "descending" ? "180deg" : "0deg" }} />}
  </span>}</AriaColumn>
})

export interface TableBodyProps<T extends object = object> extends Omit<AriaTableBodyProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

const TableBodyImplementation = forwardRef(function TableBody<T extends object = object>(
  { className, style, ...properties }: TableBodyProps<T>,
  ref: ForwardedRef<HTMLTableSectionElement | HTMLDivElement>
) {
  return <AriaTableBody {...properties} ref={ref} className={className} style={style} />
})

export type TableBodyComponent = <T extends object = object>(
  properties: TableBodyProps<T> & RefAttributes<HTMLTableSectionElement | HTMLDivElement>
) => ReactElement | null

export interface TableRowProps<T extends object = object> extends Omit<AriaRowProps<T>, "className" | "id" | "isDisabled" | "style" | "hasChildItems"> {
  /** Identity of this Row within its Table. */
  readonly id: string
  readonly className?: string
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

/** Rows use the collection Item treatment as their own paint. */
const TableRowImplementation = forwardRef(function TableRow<T extends object = object>(
  { className, disabled = false, onAction, style, ...properties }: TableRowProps<T>,
  ref: ForwardedRef<HTMLTableRowElement | HTMLDivElement>
) {
  const { color, interactive, metrics } = useTableStyle()
  const responds = interactive || onAction != null

  return <AriaRow
    {...properties}
    ref={ref}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    isDisabled={disabled}
    onAction={onAction}
    style={state => ({
      ...transition(metrics.visual, "background-color, color, outline-color"),
      ...itemPaint(metrics.visual, color, {
        // What a drag would drop into shows as chosen.
        selected: state.isSelected || state.isDropTarget === true,
        hovered: responds && state.isHovered,
        pressed: responds && state.isPressed,
        focusVisible: false,
        disabled: state.isDisabled
      }),
      outline: `3px solid ${state.isFocusVisible ? colorOpacity(metrics.visual.colors.primary, 0.34) : "transparent"}`,
      outlineOffset: -3,
      cursor: state.isDisabled ? "not-allowed" : responds ? "pointer" : "default",
      ...style
    })}
  />
})

export type TableRowComponent = <T extends object = object>(
  properties: TableRowProps<T> & RefAttributes<HTMLTableRowElement | HTMLDivElement>
) => ReactElement | null

export interface TableCellProps extends Omit<AriaCellProps, "className" | "style" | "allowsArrowNavigation"> {
  /** Whether arrow keys move between cells while focus is inside this one. */
  readonly arrowNavigation?: boolean

  readonly className?: string
  readonly style?: CSSProperties
}

const TableCell = forwardRef<HTMLTableCellElement | HTMLDivElement, TableCellProps>(function TableCell(
  { arrowNavigation, className, style, ...properties },
  ref
) {
  const { metrics } = useTableStyle()

  return <AriaCell
    {...properties}
    allowsArrowNavigation={arrowNavigation}
    ref={ref}
    className={className}
    style={state => ({
      height: metrics.height,
      paddingInline: metrics.inset,
      boxSizing: "border-box",
      // Separators belong to the row that follows them, so the last row has no bottom edge.
      borderBlockStart: `1px solid ${separatorColor(metrics)}`,
      outline: `3px solid ${state.isFocusVisible ? colorOpacity(metrics.visual.colors.primary, 0.34) : "transparent"}`,
      outlineOffset: -3,
      textAlign: "start",
      // A narrow column cuts a cell's text short instead of letting it spill into the next. What
      // the cell holds still paints a focus ring's width past its edge.
      overflow: "clip",
      overflowClipMargin: 3,
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      ...style
    })}
  />
})

function useTableStyle() {
  const context = useContext(TableStyleContext)
  if (context == null) throw new Error("Table parts must be used inside Table")
  return context
}

/** Structured rows and columns with optional selection and consumer-owned sorting. */
export const Table = Object.assign(TableRoot, {
  Header: TableHeaderImplementation as TableHeaderComponent,
  Column: TableColumn,
  Body: TableBodyImplementation as TableBodyComponent,
  Row: TableRowImplementation as TableRowComponent,
  Cell: TableCell
})

export type TableProps = TableRootProps
