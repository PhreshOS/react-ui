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
  DialogTriggerProps as AriaDialogTriggerProps,
  HeadingProps as AriaHeadingProps,
  ModalOverlayProps as AriaModalOverlayProps,
  TextProps as AriaTextProps
} from "react-aria-components"
import { useAppearance } from "./ui-provider.js"
import { useResolvedAppearance } from "./appearance-context.js"
import { colorOpacity, orderColors } from "./color.js"
import { controlFontWeight, controlOpacity } from "./control.js"
import { Button, type ButtonProps } from "./button.js"
import MotionStyle, { backdropMotionClass, overlayMotionClass, overlayTransition } from "./motion-style.js"
import { scale } from "./scale.js"
import { Surface, type SurfaceOwnProps } from "./surface.js"
import { resolveDirection, useDirection } from "./direction.js"

export type DialogRootProps = AriaDialogTriggerProps

export function DialogRoot(properties: DialogRootProps) {
  return <AriaDialogTrigger {...properties} />
}

export type DialogTriggerProps = ButtonProps

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

export interface DialogBackdropProps extends Omit<AriaModalOverlayProps, "children" | "className" | "style"> {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

export const DialogBackdrop = forwardRef<HTMLDivElement, DialogBackdropProps>(function DialogBackdrop({
  className,
  style,
  ...properties
}, ref) {
  const resolved = useResolvedAppearance()
  const inset = scale(resolved.appearance.spacing, "medium")
  const colors = resolved.colors
  const backdrop = colorOpacity(orderColors(colors.background, colors.foreground).darker, 0.32)
  const transition = overlayTransition(resolved.transaction, resolved.preferences.animations)
  const direction = resolveDirection(properties.dir, useDirection())

  return <><MotionStyle /><AriaModalOverlay
    {...properties}
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
      ...style
    }}
  /></>
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
  const resolved = useResolvedAppearance()
  const inset = scale(resolved.appearance.spacing, "medium")
  const transition = overlayTransition(resolved.transaction, resolved.preferences.animations)
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
      radius={radius}
      shadow={shadow}
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
  const gap = scale(useAppearance().spacing, "small")
  return <div {...properties} ref={ref} style={{ display: "grid", gap, minWidth: 0, ...style }} />
})

export type DialogTitleProps = AriaHeadingProps

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle({ style, ...properties }, ref) {
  return <AriaHeading {...properties} ref={ref} slot="title" style={{ margin: 0, font: "inherit", fontWeight: controlFontWeight, ...style }} />
})

export type DialogDescriptionProps = AriaTextProps

export const DialogDescription = forwardRef<HTMLElement, DialogDescriptionProps>(function DialogDescription({ style, ...properties }, ref) {
  return <AriaText {...properties} ref={ref} slot="description" style={{ margin: 0, opacity: controlOpacity.secondary, ...style }} />
})

export type DialogBodyProps = HTMLAttributes<HTMLDivElement>

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody({ style, ...properties }, ref) {
  return <div {...properties} ref={ref} style={{ minWidth: 0, minHeight: 0, ...style }} />
})

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter({ style, ...properties }, ref) {
  const gap = scale(useAppearance().spacing, "small")
  return <div {...properties} ref={ref} style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap, minWidth: 0, ...style }} />
})

export type DialogCloseProps = ButtonProps

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(properties, ref) {
  return <Button {...properties} ref={ref} slot="close" />
})

/** A modal dialog whose behavioral and structural roles remain independently composable. */
export const Dialog = Object.assign(DialogRoot, {
  Root: DialogRoot,
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
