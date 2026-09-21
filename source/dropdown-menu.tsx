import { forwardRef } from "react"
import type { ComponentProps } from "react"
import { MenuTrigger as AriaMenuTrigger } from "react-aria-components"
import type { MenuTriggerProps as AriaMenuTriggerProps } from "react-aria-components"
import { Button, type ButtonProps } from "./button.js"
import { Menu } from "./menu.js"
import { PopoverContent } from "./popover.js"

export type DropdownMenuRootProps = AriaMenuTriggerProps

export function DropdownMenuRoot(properties: DropdownMenuRootProps) {
  return <AriaMenuTrigger {...properties} />
}

export type DropdownMenuTriggerProps = ButtonProps

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(function DropdownMenuTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

/** A button-triggered overlay. Its Content owns positioning; Menu owns commands and selection. */
export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: PopoverContent,
  Menu
})

export type DropdownMenuProps = ComponentProps<typeof DropdownMenuRoot>
