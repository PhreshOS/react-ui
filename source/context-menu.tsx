import { forwardRef, useCallback, useContext, useEffect, useRef } from "react"
import type { ComponentProps, ComponentRef, ForwardedRef } from "react"
import {
  MenuTrigger as AriaMenuTrigger,
  OverlayTriggerStateContext,
  Pressable as AriaPressable
} from "react-aria-components"
import type { MenuTriggerProps as AriaMenuTriggerProps } from "react-aria-components"
import { Menu } from "./menu.js"
import { PopoverContent, type PopoverContentProps } from "./popover.js"

export type ContextMenuRootProps = Omit<AriaMenuTriggerProps, "trigger">

export function ContextMenuRoot(properties: ContextMenuRootProps) {
  return <AriaMenuTrigger {...properties} trigger="contextMenu" />
}

export type ContextMenuTriggerProps = ComponentProps<typeof AriaPressable>

export const ContextMenuTrigger = forwardRef<ComponentRef<typeof AriaPressable>, ContextMenuTriggerProps>(function ContextMenuTrigger(properties, ref) {
  return <AriaPressable {...properties} ref={ref} />
})

export type ContextMenuContentProps = Omit<PopoverContentProps, "isNonModal">

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

  return <PopoverContent {...properties} ref={ref} isNonModal />
})

/** A context-requested overlay sharing the same Menu contract as DropdownMenu. */
export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Menu
})

export type ContextMenuProps = ComponentProps<typeof ContextMenuRoot>
