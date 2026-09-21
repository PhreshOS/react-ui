import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import { DisclosureGroup as AriaDisclosureGroup } from "react-aria-components"
import type { DisclosureGroupProps as AriaDisclosureGroupProps, Key } from "react-aria-components"
import type { ControlColor } from "./control.js"
import {
  DisclosureContent,
  DisclosureRoot,
  DisclosureTrigger,
  type DisclosureRootProps
} from "./disclosure.js"
import { resolveGap, type LayoutGap } from "./layout.js"
import type { RadiusProps } from "./radius.js"
import type { ScaleLevel } from "./scale.js"
import { stringKeys } from "./selection.js"
import { useAppearance } from "./ui-provider.js"

type AccordionTheme = Readonly<{
  color?: ControlColor
  radius: RadiusProps["radius"]
  size: ScaleLevel
}>

const AccordionThemeContext = createContext<AccordionTheme | null>(null)

type AccordionRootBaseProps = Omit<
  AriaDisclosureGroupProps,
  "allowsMultipleExpanded" | "className" | "defaultExpandedKeys" | "expandedKeys" | "isDisabled" | "onExpandedChange" | "style"
> & RadiusProps & Readonly<{
  children?: ReactNode
  className?: string
  color?: ControlColor
  disabled?: boolean
  gap?: LayoutGap
  size?: ScaleLevel
  style?: CSSProperties
}>

export type AccordionSingleExpansionProps = Readonly<{
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
}>

export type AccordionMultipleExpansionProps = Readonly<{
  multiple: true
  value?: readonly string[]
  defaultValue?: readonly string[]
  onChange?: (value: readonly string[]) => void
}>

export type AccordionRootProps = AccordionRootBaseProps
  & (AccordionSingleExpansionProps | AccordionMultipleExpansionProps)

/** A coordinated group of identified Disclosure items. */
export const AccordionRoot = forwardRef<HTMLDivElement, AccordionRootProps>(function AccordionRoot(
  properties,
  ref
) {
  const {
    children,
    className,
    color,
    defaultValue,
    disabled = false,
    gap = "xsmall",
    multiple = false,
    onChange,
    radius = "medium",
    size = "medium",
    style,
    value,
    ...native
  } = properties
  const appearance = useAppearance()
  const context = useMemo<AccordionTheme>(() => ({ color, radius, size }), [color, radius, size])

  return <AccordionThemeContext.Provider value={context}>
    <AriaDisclosureGroup
      {...native}
      {...expansionProperties(properties)}
      ref={ref}
      allowsMultipleExpanded={multiple}
      className={className}
      isDisabled={disabled}
      style={{
        display: "grid",
        gap: resolveGap(gap, appearance),
        width: "100%",
        minWidth: 0,
        ...style
      }}
    >{children}</AriaDisclosureGroup>
  </AccordionThemeContext.Provider>
})

function expansionProperties(properties: AccordionRootProps) {
  const expandedKeys = expansionKeys(properties.value)
  const defaultExpandedKeys = expansionKeys(properties.defaultValue)
  const onExpandedChange = properties.onChange == null
    ? undefined
    : (keys: Set<Key>) => {
        const values = stringKeys(keys)
        if (properties.multiple) properties.onChange?.(values)
        else properties.onChange?.(values[0] ?? null)
      }

  return {
    ...(expandedKeys === undefined ? {} : { expandedKeys }),
    ...(defaultExpandedKeys === undefined ? {} : { defaultExpandedKeys }),
    ...(onExpandedChange === undefined ? {} : { onExpandedChange })
  }
}

function expansionKeys(value: string | null | readonly string[] | undefined) {
  if (value === undefined) return undefined
  if (value === null) return new Set<string>()
  return new Set(typeof value === "string" ? [value] : value)
}

export interface AccordionItemProps extends Omit<
  DisclosureRootProps,
  "defaultExpanded" | "expanded" | "onChange"
> {
  readonly id: string
}

/** One identified Disclosure governed by its nearest Accordion. */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { color, radius, size, ...properties },
  ref
) {
  const inherited = useAccordionTheme()

  return <DisclosureRoot
    {...properties}
    ref={ref}
    color={color ?? inherited.color}
    radius={radius ?? inherited.radius}
    size={size ?? inherited.size}
  />
})

function useAccordionTheme() {
  const context = useContext(AccordionThemeContext)
  if (context == null) throw new Error("Accordion.Item must be used inside Accordion")
  return context
}

interface AccordionComponent {
  (properties: AccordionRootProps): ReactElement | null
  readonly Item: typeof AccordionItem
  readonly Trigger: typeof DisclosureTrigger
  readonly Content: typeof DisclosureContent
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: DisclosureTrigger,
  Content: DisclosureContent
}) as AccordionComponent

export type AccordionProps = AccordionRootProps
