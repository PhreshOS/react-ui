import { forwardRef, useCallback, useContext, useEffect, useRef } from "react"
import type { ComponentProps, ComponentRef, ForwardedRef } from "react"
import {
  MenuTrigger as AriaMenuTrigger,
  OverlayTriggerStateContext,
  Pressable as AriaPressable
} from "react-aria-components"
import { ariaOpenState, type OverlayRootProps } from "./control/open-state.js"
import { Menu } from "./menu.js"
import { MenuContent, type PopoverContentProps } from "./popover.js"

export type ContextMenuRootProps = OverlayRootProps

export function ContextMenuRoot({ children, ...state }: ContextMenuRootProps) {
  return <AriaMenuTrigger {...ariaOpenState(state)} trigger="contextMenu">{children}</AriaMenuTrigger>
}

/** The element that opens the menu when it is right-clicked or long-pressed. */
export interface ContextMenuTriggerProps {
  readonly children: ComponentProps<typeof AriaPressable>["children"]
  readonly disabled?: boolean
}

export const ContextMenuTrigger = forwardRef<ComponentRef<typeof AriaPressable>, ContextMenuTriggerProps>(function ContextMenuTrigger({ children, disabled }, ref) {
  return <AriaPressable ref={ref} isDisabled={disabled}>{children}</AriaPressable>
})

export type ContextMenuContentProps = PopoverContentProps

function setRef<Value>(ref: ForwardedRef<Value>, value: Value | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

export const ContextMenuContent = forwardRef<HTMLElement, ContextMenuContentProps>(function ContextMenuContent(properties, forwardedRef) {
  const state = useContext(OverlayTriggerStateContext)
  const contentRef = useRef<HTMLElement | null>(null)
  const ref = useCallback((element: HTMLElement | null) => {
    contentRef.current = element
    setRef(forwardedRef, element)
  }, [forwardedRef])

  useEffect(() => {
    if (!state?.isOpen) return

    function dismiss(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && contentRef.current?.contains(target)) return
      state?.close()
    }

    document.addEventListener("pointerdown", dismiss, true)
    return () => document.removeEventListener("pointerdown", dismiss, true)
  }, [state])

  return <MenuContent {...properties} ref={ref} nonModal />
})

/** A context-requested overlay sharing the same Menu contract as DropdownMenu. */
export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Menu
})

export type ContextMenuProps = ComponentProps<typeof ContextMenuRoot>
