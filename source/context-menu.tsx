import { forwardRef } from "react"
import type { ComponentProps, ComponentRef } from "react"
import { MenuTrigger as AriaMenuTrigger, Pressable as AriaPressable } from "react-aria-components"
import type { MenuTriggerProps as AriaMenuTriggerProps } from "react-aria-components"
import { Menu } from "./menu.js"
import { PopoverContent } from "./popover.js"

export type ContextMenuRootProps = Omit<AriaMenuTriggerProps, "trigger">

export function ContextMenuRoot(properties: ContextMenuRootProps) {
  return <AriaMenuTrigger {...properties} trigger="contextMenu" />
}

export type ContextMenuTriggerProps = ComponentProps<typeof AriaPressable>

export const ContextMenuTrigger = forwardRef<ComponentRef<typeof AriaPressable>, ContextMenuTriggerProps>(function ContextMenuTrigger(properties, ref) {
  return <AriaPressable {...properties} ref={ref} />
})

/** A context-requested overlay sharing the same Menu contract as DropdownMenu. */
export const ContextMenu = Object.assign(ContextMenuRoot, {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Content: PopoverContent,
  Menu
})

export type ContextMenuProps = ComponentProps<typeof ContextMenuRoot>
