import { forwardRef } from "react"
import type { ComponentProps, CSSProperties, HTMLAttributes, ReactNode } from "react"
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Text as AriaText
} from "react-aria-components"
import type {
  DialogProps as AriaDialogProps,
  HeadingProps as AriaHeadingProps,
  ModalOverlayProps as AriaModalOverlayProps,
  TextProps as AriaTextProps
} from "react-aria-components"
import { Button, type ButtonProps } from "./button.js"
import { controlFontSizes, controlFontWeight, controlOpacity } from "./control/control.js"
import { ariaOpenState, type AriaOverlayInternals, type OverlayRootProps } from "./control/open-state.js"
import { colorOpacity, darkCanvas } from "./foundation/color.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import MotionStyle, { backdropMotionClass, overlayMotionClass, overlayTransition } from "./foundation/motion-style.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { floatingShadow } from "./surface/shadow-options.js"
import { Surface, type SurfaceOwnProps } from "./surface/surface.js"

export type DialogRootProps = OverlayRootProps

export function DialogRoot({ children, ...state }: DialogRootProps) {
  return <AriaDialogTrigger {...ariaOpenState(state)}>{children}</AriaDialogTrigger>
}

export type DialogTriggerProps = ButtonProps

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

/**
 * The layer behind a Dialog. Its open state belongs to the Dialog root; the
 * backdrop only decides how the Dialog may be dismissed.
 */
export interface DialogBackdropProps extends
  Omit<AriaModalOverlayProps, AriaOverlayInternals | "children" | "className" | "color" | "style" | "dir"> {
  readonly children?: ReactNode
  readonly className?: string
  readonly dir?: Direction
  /** Whether pressing outside the Dialog closes it. */
  readonly dismissable?: boolean
  /** Whether Escape closes the Dialog. */
  readonly keyboardDismissable?: boolean
  readonly style?: CSSProperties
  /**
   * How the interface behind the Dialog is held back: `dim` darkens it, and
   * `blur` blurs it with the Appearance material while darkening it lightly.
   */
  readonly variant?: DialogBackdropVariant
}

export type DialogBackdropVariant = "dim" | "blur"

// A blurred backdrop still dims a little, so the Dialog stays distinct on a
// light canvas where blur alone barely separates it.
const backdropDimming: Readonly<Record<DialogBackdropVariant, number>> = { dim: 0.32, blur: 0.16 }

export const DialogBackdrop = forwardRef<HTMLDivElement, DialogBackdropProps>(function DialogBackdrop({
  children,
  className,
  dir,
  dismissable = false,
  keyboardDismissable = true,
  style,
  variant = "dim",
  ...attributes
}, ref) {
  const visual = useVisual()
  const inset = scale(visual.spacing, "medium")
  const colors = visual.colors
  // The backdrop dims toward whichever Appearance color is darker, in any Theme.
  const darker = darkCanvas(colors) ? colors.background : colors.foreground
  const backdrop = colorOpacity(darker, backdropDimming[variant])
  const blur = variant === "blur" && visual.material.backdrop > 0 ? `blur(${visual.material.backdrop}px)` : undefined
  const transition = overlayTransition(visual)
  const direction = resolveDirection(dir, useDirection())

  return <><MotionStyle /><AriaModalOverlay
    {...attributes}
    isDismissable={dismissable}
    isKeyboardDismissDisabled={!keyboardDismissable}
    ref={ref}
    dir={direction}
    className={[backdropMotionClass, className].filter(Boolean).join(" ")}
    style={{
      ...transition,
      position: "fixed",
      inset: 0,
      zIndex: 1_000,
      display: "grid",
      placeItems: "center",
      boxSizing: "border-box",
      padding: inset,
      overflow: "auto",
      background: backdrop,
      backdropFilter: blur,
      WebkitBackdropFilter: blur,
      ...style
    }}
  >{children}</AriaModalOverlay></>
})

export interface DialogContentProps extends
  Omit<AriaDialogProps, "children" | "className" | "style">,
  SurfaceOwnProps {
  readonly children?: AriaDialogProps["children"]
  readonly className?: string
  readonly style?: CSSProperties
}

export const DialogContent = forwardRef<HTMLElement, DialogContentProps>(function DialogContent({
  children,
  className,
  color,
  material,
  radius,
  shadow,
  style,
  ...properties
}, ref) {
  const visual = useVisual()
  const inset = scale(visual.spacing, "medium")
  const transition = overlayTransition(visual)
  const direction = resolveDirection(properties.dir, useDirection())

  return <><MotionStyle /><AriaModal
    dir={direction}
    className={overlayMotionClass}
    style={{
      ...transition,
      width: `min(32rem, calc(100vw - ${inset * 2}px))`,
      maxHeight: `calc(100vh - ${inset * 2}px)`,
      outline: "none"
    }}
  >
    <Surface
      className={className}
      color={color}
      material={material}
      // Dialog content is composed by its consumer, so no owned rounded shape
      // sits at a known inset; it keeps the plain Appearance radius like Popover.
      radius={radius}
      shadow={shadow ?? floatingShadow(visual.shadow)}
      style={{
        boxSizing: "border-box",
        width: "100%",
        maxHeight: "inherit",
        padding: inset,
        overflow: "hidden",
        ...style
      }}
    >
      <AriaDialog
        {...properties}
        ref={ref}
        style={{
          display: "grid",
          gap: inset,
          minWidth: 0,
          minHeight: 0,
          maxHeight: "inherit",
          outline: "none"
        }}
      >{children}</AriaDialog>
    </Surface>
  </AriaModal></>
})

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader({ style, ...properties }, ref) {
  const gap = scale(useVisual().spacing, "small")
  return <div {...properties} ref={ref} style={{ display: "grid", gap, minWidth: 0, ...style }} />
})

export type DialogTitleProps = AriaHeadingProps

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle({ style, ...properties }, ref) {
  // The modal is portalled: owned text parts set their relative scale directly,
  // while Dialog.Body remains untouched for consumer-owned content and controls.
  return <AriaHeading {...properties} ref={ref} slot="title" style={{
    margin: 0,
    fontFamily: "inherit",
    fontSize: controlFontSizes.medium,
    fontWeight: controlFontWeight,
    lineHeight: 1.5,
    ...style
  }} />
})

export type DialogDescriptionProps = AriaTextProps

export const DialogDescription = forwardRef<HTMLElement, DialogDescriptionProps>(function DialogDescription({ style, ...properties }, ref) {
  return <AriaText {...properties} ref={ref} slot="description" style={{
    margin: 0,
    fontSize: controlFontSizes.medium,
    lineHeight: 1.5,
    opacity: controlOpacity.secondary,
    ...style
  }} />
})

export type DialogBodyProps = HTMLAttributes<HTMLDivElement>

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody({ style, ...properties }, ref) {
  return <div {...properties} ref={ref} style={{ minWidth: 0, minHeight: 0, ...style }} />
})

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter({ style, ...properties }, ref) {
  const gap = scale(useVisual().spacing, "small")
  return <div {...properties} ref={ref} style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap, minWidth: 0, ...style }} />
})

export type DialogCloseProps = ButtonProps

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(properties, ref) {
  return <Button {...properties} ref={ref} slot="close" />
})

/** A modal dialog whose behavioral and structural roles remain independently composable. */
export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Backdrop: DialogBackdrop,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose
})

export type DialogProps = ComponentProps<typeof DialogRoot>
