import type { ReactNode } from "react"

/**
 * Whether an overlay is shown. Its root owns this state; triggers and
 * positioned parts only read it, so they never repeat it.
 */
export type OpenStateProps = Readonly<{
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}>

/** The root of an overlay family: its open state and its parts. */
export type OverlayRootProps = OpenStateProps & Readonly<{ children: ReactNode }>

/**
 * React Aria props that overlay parts own internally, or that belong to the
 * family root as open state. They never appear on React UI overlay parts.
 */
export type AriaOverlayInternals =
  | "isOpen" | "defaultOpen" | "onOpenChange"
  | "isEntering" | "isExiting" | "isNonModal" | "isDismissable" | "isKeyboardDismissDisabled"
  | "shouldCloseOnInteractOutside" | "shouldFlip" | "shouldUpdatePosition" | "shouldSkipAnimation"
  | "trigger" | "triggerRef" | "UNSTABLE_portalContainer" | "arrowRef" | "arrowBoundaryOffset"
  | "scrollRef" | "getTargetRect"

/** The one translation from React UI's open-state names to React Aria's. */
export function ariaOpenState({ open, defaultOpen, onOpenChange }: OpenStateProps) {
  return {
    ...(open !== undefined ? { isOpen: open } : {}),
    ...(defaultOpen !== undefined ? { defaultOpen } : {}),
    ...(onOpenChange !== undefined ? { onOpenChange } : {})
  }
}
