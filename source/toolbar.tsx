import { createContext, forwardRef, useContext, useMemo, useRef } from "react"
import type { ComponentPropsWithoutRef, CSSProperties, KeyboardEventHandler, ReactElement } from "react"
import { FocusScope, mergeProps, mergeRefs, useFocusManager, useToolbar } from "react-aria"
import {
  Group as AriaGroup,
  Separator as AriaSeparator
} from "react-aria-components"
import type {
  GroupProps as AriaGroupProps,
  SeparatorProps as AriaSeparatorProps
} from "react-aria-components"
import { separatorOpacity } from "./control/field.js"
import { colorOpacity, resolveColor, type Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { LayoutGap } from "./foundation/layout.js"
import { resolveSpacing } from "./foundation/spacing.js"
import { useVisual } from "./foundation/visual.js"

type ToolbarOrientation = "horizontal" | "vertical"

type ToolbarTheme = Readonly<{
  gap: CSSProperties["gap"]
  groupGap: CSSProperties["gap"]
  orientation: ToolbarOrientation
  separator: string
}>

const ToolbarThemeContext = createContext<ToolbarTheme | null>(null)

export interface ToolbarRootProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "color" | "role" | "style"> {
  /** Base color inherited by toolbar-owned text and separators. */
  readonly color?: Color

  /** Space between the Toolbar's direct children. */
  readonly gap?: LayoutGap

  /** Axis used both for layout and arrow-key navigation. */
  readonly orientation?: ToolbarOrientation

  /** Native class name applied without replacing the Toolbar contract. */
  readonly className?: string

  /** Native styles applied after Toolbar defaults. */
  readonly style?: CSSProperties
}

/** A labelled group of controls with orientation-aware arrow-key navigation. */
export const ToolbarRoot = forwardRef<HTMLDivElement, ToolbarRootProps>(function ToolbarRoot(
  properties,
  ref
) {
  return <FocusScope>
    <ToolbarLayout {...properties} ref={ref} />
  </FocusScope>
})

const ToolbarLayout = forwardRef<HTMLDivElement, ToolbarRootProps>(function ToolbarLayout(
  {
    className,
    color,
    gap = "medium",
    orientation = "horizontal",
    style,
    ...properties
  },
  ref
) {
  const { spacing, colors } = useVisual()
  const fallbackDirection = useDirection()
  const direction = resolveDirection(properties.dir, fallbackDirection)
  const localRef = useRef<HTMLDivElement>(null)
  const focusManager = useFocusManager()
  const { toolbarProps } = useToolbar({
    "aria-label": properties["aria-label"],
    "aria-labelledby": properties["aria-labelledby"],
    orientation
  }, localRef)
  const { onKeyDownCapture: _localeKeyDown, ...behaviorProperties } = toolbarProps
  const foreground = resolveColor(color ?? "foreground", colors)
  const theme = useMemo<ToolbarTheme>(() => ({
    gap: resolveSpacing(gap, spacing),
    groupGap: resolveSpacing("small", spacing),
    orientation,
    // A Toolbar may carry its own text color; its separator shows it like every separator.
    separator: colorOpacity(foreground, separatorOpacity)
  }), [spacing, foreground, gap, orientation])

  return <ToolbarThemeContext.Provider value={theme}>
    <div
      {...mergeProps(properties, behaviorProperties, {
        onKeyDownCapture: toolbarKeyDown(focusManager, orientation, direction)
      })}
      ref={mergeRefs(localRef, ref)}
      className={className}
      style={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        alignItems: orientation === "horizontal" ? "center" : "flex-start",
        gap: theme.gap,
        width: "fit-content",
        maxWidth: "100%",
        minWidth: 0,
        color: foreground,
        fontFamily: "inherit",
        ...style
      }}
    />
  </ToolbarThemeContext.Provider>
})

function toolbarKeyDown(
  focusManager: ReturnType<typeof useFocusManager>,
  orientation: ToolbarOrientation,
  direction: "ltr" | "rtl"
): KeyboardEventHandler<HTMLDivElement> {
  return event => {
    if (focusManager == null || !event.currentTarget.contains(event.target as Node)) return

    const forward = orientation === "horizontal" ? "ArrowRight" : "ArrowDown"
    const backward = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp"

    if (event.key === forward) {
      if (orientation === "horizontal" && direction === "rtl") focusManager.focusPrevious()
      else focusManager.focusNext()
    } else if (event.key === backward) {
      if (orientation === "horizontal" && direction === "rtl") focusManager.focusNext()
      else focusManager.focusPrevious()
    } else if (event.key === "Tab") {
      if (event.shiftKey) focusManager.focusFirst()
      else focusManager.focusLast()
      return
    } else {
      return
    }

    event.stopPropagation()
    event.preventDefault()
  }
}

export interface ToolbarGroupProps extends Omit<AriaGroupProps, "className" | "style" | "isDisabled" | "isInvalid" | "isReadOnly"> {
  /** Whether every control in this group is disabled. */
  readonly disabled?: boolean

  /** Space between the controls in this group. */
  readonly gap?: LayoutGap

  /** Native class name applied without replacing the group contract. */
  readonly className?: string

  /** Native styles applied after group defaults. */
  readonly style?: CSSProperties
}

/** A semantic group of related controls within a Toolbar. */
export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(function ToolbarGroup(
  { className, disabled, gap, style, ...properties },
  ref
) {
  const inherited = useToolbarTheme()
  const { spacing } = useVisual()

  return <AriaGroup
    {...properties}
    isDisabled={disabled}
    ref={ref}
    className={className}
    style={{
      display: "flex",
      flexDirection: inherited.orientation === "horizontal" ? "row" : "column",
      alignItems: inherited.orientation === "horizontal" ? "center" : "flex-start",
      gap: gap === undefined ? inherited.groupGap : resolveSpacing(gap, spacing),
      minWidth: 0,
      ...style
    }}
  />
})

export interface ToolbarSeparatorProps extends Omit<AriaSeparatorProps, "className" | "orientation" | "style"> {
  /** Native class name applied without replacing the separator contract. */
  readonly className?: string

  /** Native styles applied after separator defaults. */
  readonly style?: CSSProperties
}

/** A visual boundary whose axis is perpendicular to its Toolbar. */
export const ToolbarSeparator = forwardRef<HTMLElement, ToolbarSeparatorProps>(function ToolbarSeparator(
  { className, style, ...properties },
  ref
) {
  const { orientation, separator } = useToolbarTheme()
  const separatorOrientation = orientation === "horizontal" ? "vertical" : "horizontal"

  return <AriaSeparator
    {...properties}
    ref={ref}
    className={className}
    orientation={separatorOrientation}
    style={{
      flexShrink: 0,
      alignSelf: "center",
      width: separatorOrientation === "vertical" ? 1 : "50%",
      minWidth: separatorOrientation === "vertical" ? 1 : undefined,
      height: separatorOrientation === "vertical" ? "1.5em" : 1,
      minHeight: separatorOrientation === "vertical" ? 8 : 1,
      margin: 0,
      border: 0,
      background: separator,
      ...style
    }}
  />
})

function useToolbarTheme() {
  const context = useContext(ToolbarThemeContext)
  if (context == null) throw new Error("Toolbar parts must be used inside Toolbar")
  return context
}

interface ToolbarComponent {
  (properties: ToolbarRootProps): ReactElement | null
  readonly Group: typeof ToolbarGroup
  readonly Separator: typeof ToolbarSeparator
}

/** A keyboard-navigable layout for related interactive controls. */
export const Toolbar = Object.assign(ToolbarRoot, {
  Group: ToolbarGroup,
  Separator: ToolbarSeparator
}) as ToolbarComponent

export type ToolbarProps = ToolbarRootProps
