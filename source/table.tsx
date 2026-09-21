import { createContext, forwardRef, useContext, useMemo } from "react"
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
  Selection,
  SortDescriptor,
  TableBodyProps as AriaTableBodyProps,
  TableHeaderProps as AriaTableHeaderProps,
  TableProps as AriaTableProps
} from "react-aria-components"
import { colorOpacity } from "./color.js"
import { controlFontWeight, controlOpacity, useControlTheme } from "./control.js"
import type { ControlColor, ControlTheme } from "./control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { RadiusProps } from "./radius.js"
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
import { AriaDirectionBoundary } from "./aria-direction.js"

type TableTheme = Readonly<{
  color?: ControlColor
  interactive: boolean
  radius: RadiusProps["radius"]
  size: ScaleLevel
  theme: ControlTheme
}>

const TableThemeContext = createContext<TableTheme | null>(null)

export type TableSortDirection = "ascending" | "descending"

export interface TableSort {
  readonly column: string
  readonly direction: TableSortDirection
}

type TableRootBaseProps = Omit<
  AriaTableProps,
  | "className"
  | "defaultSelectedKeys"
  | "disabledKeys"
  | "onRowAction"
  | "onSelectionChange"
  | "onSortChange"
  | "selectedKeys"
  | "selectionMode"
  | "sortDescriptor"
  | "style"
> & RadiusProps & Readonly<{
  className?: string
  color?: ControlColor
  disabledValues?: readonly string[]
  onRowAction?: (value: string) => void
  onSortChange?: (sort: TableSort) => void
  size?: ScaleLevel
  sort?: TableSort
  style?: CSSProperties
}>

export type TableNoSelectionProps = Readonly<{
  selectionMode?: "none"
  value?: never
  defaultValue?: never
  onChange?: never
}>

export type TableSingleSelectionProps = SingleStringSelectionProps & Readonly<{
  selectionMode: "single"
}>

export type TableMultipleValue = MultipleStringSelection

export type TableMultipleSelectionProps = MultipleStringSelectionProps & Readonly<{
  selectionMode: "multiple"
}>

export type TableRootProps = TableRootBaseProps
  & (TableNoSelectionProps | TableSingleSelectionProps | TableMultipleSelectionProps)

export const TableRoot = forwardRef<HTMLTableElement | HTMLDivElement, TableRootProps>(function TableRoot(
  properties,
  ref
) {
  const {
    className,
    color,
    defaultValue,
    disabledValues,
    onChange,
    onRowAction,
    onSortChange,
    radius = "medium",
    selectionMode = "none",
    size = "medium",
    sort,
    style,
    value,
    ...native
  } = properties
  const theme = useControlTheme({ color, radius, size })
  const context = useMemo<TableTheme>(
    () => ({ color, interactive: selectionMode !== "none" || onRowAction != null, radius, size, theme }),
    [color, onRowAction, radius, selectionMode, size, theme]
  )
  const direction = resolveDirection(native.dir, useDirection())

  return <TableThemeContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaTable
      {...native}
      {...selectionProperties(properties)}
      {...(sort === undefined ? {} : { sortDescriptor: sort })}
      ref={ref}
      dir={direction}
      className={className}
      disabledKeys={disabledValues}
      selectionMode={selectionMode}
      onRowAction={onRowAction == null ? undefined : key => onRowAction(stringKey(key))}
      onSortChange={onSortChange == null ? undefined : descriptor => onSortChange(tableSort(descriptor))}
      style={{
        width: "100%",
        minWidth: "max-content",
        borderCollapse: "separate",
        borderSpacing: 0,
        boxSizing: "border-box",
        borderRadius: theme.radius,
        // Header and row paints belong to the table, so the table must clip
        // them rather than relying on a surrounding surface for its radius.
        overflow: "hidden",
        fontFamily: "inherit",
        fontSize: theme.fontSize,
        ...style
      }}
    /></AriaDirectionBoundary>
  </TableThemeContext.Provider>
})

function selectionProperties(properties: TableRootProps) {
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

function tableSort(descriptor: SortDescriptor): TableSort {
  return { column: stringKey(descriptor.column), direction: descriptor.direction }
}

export interface TableHeaderProps<T extends object = object> extends Omit<AriaTableHeaderProps<T>, "className" | "style"> {
  readonly className?: string
  readonly color?: ControlColor
  readonly style?: CSSProperties
}

const TableHeaderImplementation = forwardRef(function TableHeader<T extends object = object>(
  { className, color, style, ...properties }: TableHeaderProps<T>,
  ref: ForwardedRef<HTMLTableSectionElement | HTMLDivElement>
) {
  const inherited = useTableContext()
  const resolvedColor = color ?? inherited.color
  const theme = useControlTheme({ color: resolvedColor, radius: inherited.radius, size: inherited.size })
  const context = useMemo<TableTheme>(() => ({ ...inherited, color: resolvedColor, theme }), [inherited, resolvedColor, theme])

  return <TableThemeContext.Provider value={context}>
    <AriaTableHeader
      {...properties}
      ref={ref}
      className={className}
      style={{ ...style }}
    />
  </TableThemeContext.Provider>
})

export type TableHeaderComponent = <T extends object = object>(
  properties: TableHeaderProps<T> & RefAttributes<HTMLTableSectionElement | HTMLDivElement>
) => ReactElement | null

export const TableHeader = TableHeaderImplementation as TableHeaderComponent

export interface TableColumnProps extends Omit<AriaColumnProps, "className" | "id" | "style"> {
  readonly className?: string
  readonly id: string
  readonly style?: CSSProperties
}

export const TableColumn = forwardRef<HTMLTableCellElement | HTMLDivElement, TableColumnProps>(function TableColumn(
  { allowsSorting = false, children, className, style, textValue, ...properties },
  ref
) {
  const theme = useTableTheme()

  return <AriaColumn
    {...properties}
    ref={ref}
    allowsSorting={allowsSorting}
    className={className}
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    style={state => ({
      ...theme.transition,
      minWidth: 0,
      height: theme.height,
      paddingBlock: theme.gap,
      paddingInline: Math.max(8, theme.spacing),
      boxSizing: "border-box",
      outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: -1,
      ...(state.isHovered && allowsSorting ? theme.paints.palette.hover : theme.paints.palette.rest),
      cursor: allowsSorting ? "pointer" : "default",
      fontWeight: controlFontWeight,
      textAlign: "start",
      userSelect: "none",
      ...style
    })}
  >{state => <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: theme.gap, minWidth: 0 }}>
    <span style={{ minWidth: 0 }}>{typeof children === "function" ? children(state) : children}</span>
    {allowsSorting && state.sortDirection != null && <SortIndicator direction={state.sortDirection} theme={theme} />}
  </span>}</AriaColumn>
})

function SortIndicator({ direction, theme }: Readonly<{ direction: TableSortDirection, theme: ControlTheme }>) {
  return <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    style={{
      ...theme.transition,
      flexShrink: 0,
      transitionProperty: "transform",
      transform: `rotate(${direction === "descending" ? 180 : 0}deg)`
    }}
  ><path d="m2 8 4-4 4 4" /></svg>
}

export interface TableBodyProps<T extends object = object> extends Omit<AriaTableBodyProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

const TableBodyImplementation = forwardRef(function TableBody<T extends object = object>(
  { className, style, ...properties }: TableBodyProps<T>,
  ref: ForwardedRef<HTMLTableSectionElement | HTMLDivElement>
) {
  return <AriaTableBody
    {...properties}
    ref={ref}
    className={className}
    style={{ ...style }}
  />
})

export type TableBodyComponent = <T extends object = object>(
  properties: TableBodyProps<T> & RefAttributes<HTMLTableSectionElement | HTMLDivElement>
) => ReactElement | null

export const TableBody = TableBodyImplementation as TableBodyComponent

export interface TableRowProps<T extends object = object> extends Omit<AriaRowProps<T>, "className" | "id" | "isDisabled" | "style"> {
  readonly className?: string
  readonly disabled?: boolean
  readonly id: string
  readonly style?: CSSProperties
}

const TableRowImplementation = forwardRef(function TableRow<T extends object = object>(
  { className, disabled = false, onAction, style, ...properties }: TableRowProps<T>,
  ref: ForwardedRef<HTMLTableRowElement | HTMLDivElement>
) {
  const { interactive, theme } = useTableContext()

  return <AriaRow
    {...properties}
    ref={ref}
    className={className}
    isDisabled={disabled}
    onAction={onAction}
    style={state => ({
      ...theme.transition,
      outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: -1,
      cursor: disabled ? "not-allowed" : interactive || onAction != null ? "pointer" : "default",
      opacity: disabled ? controlOpacity.disabled : 1,
      ...(state.isSelected
        ? state.isPressed
          ? theme.paints.palette.pressed
          : state.isHovered
            ? theme.paints.palette.hover
            : theme.paints.palette.rest
        : state.isHovered && (interactive || onAction != null)
          ? theme.paints.subtle.hover
          : { background: "transparent", color: "inherit" }),
      ...style
    })}
  />
})

export type TableRowComponent = <T extends object = object>(
  properties: TableRowProps<T> & RefAttributes<HTMLTableRowElement | HTMLDivElement>
) => ReactElement | null

export const TableRow = TableRowImplementation as TableRowComponent

export interface TableCellProps extends Omit<AriaCellProps, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

export const TableCell = forwardRef<HTMLTableCellElement | HTMLDivElement, TableCellProps>(function TableCell(
  { className, style, ...properties },
  ref
) {
  const theme = useTableTheme()
  const separator = colorOpacity(theme.tint, controlOpacity.separator)

  return <AriaCell
    {...properties}
    ref={ref}
    className={className}
    style={state => ({
      minWidth: 0,
      height: theme.height,
      paddingBlock: theme.gap,
      paddingInline: Math.max(8, theme.spacing),
      boxSizing: "border-box",
      // Separators belong to the row that follows them. This preserves every
      // internal boundary while leaving the final row without a bottom edge.
      borderBlockStart: `1px solid ${separator}`,
      outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: -1,
      background: "transparent",
      color: "inherit",
      textAlign: "start",
      ...style
    })}
  />
})

function useTableContext() {
  const value = useContext(TableThemeContext)
  if (value == null) throw new Error("Table parts must be used inside Table")
  return value
}

function useTableTheme() {
  return useTableContext().theme
}

/** Structured rows and columns with optional selection and consumer-owned sorting. */
export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Column: TableColumn,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell
})

export type TableProps = TableRootProps
