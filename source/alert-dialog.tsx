import { forwardRef } from "react"
import type { ComponentProps } from "react"
import {
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger
} from "./dialog.js"
import type { DialogBackdropProps, DialogContentProps } from "./dialog.js"

export type AlertDialogRootProps = ComponentProps<typeof DialogRoot>

export function AlertDialogRoot(properties: AlertDialogRootProps) {
  return <DialogRoot {...properties} />
}

export type AlertDialogBackdropProps = DialogBackdropProps

// An alert asks for an explicit decision, so neither pressing outside nor
// Escape dismisses it unless the caller allows that.
export const AlertDialogBackdrop = forwardRef<HTMLDivElement, AlertDialogBackdropProps>(function AlertDialogBackdrop(properties, ref) {
  return <DialogBackdrop
    {...properties}
    ref={ref}
    dismissable={properties.dismissable ?? false}
    keyboardDismissable={properties.keyboardDismissable ?? false}
  />
})

export type AlertDialogContentProps = Omit<DialogContentProps, "role">

export const AlertDialogContent = forwardRef<HTMLElement, AlertDialogContentProps>(function AlertDialogContent(properties, ref) {
  return <DialogContent {...properties} ref={ref} role="alertdialog" />
})

/** A dialog requiring an explicit decision rather than ambient dismissal. */
export const AlertDialog = Object.assign(AlertDialogRoot, {
  Trigger: DialogTrigger,
  Backdrop: AlertDialogBackdrop,
  Content: AlertDialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose
})

export type AlertDialogProps = ComponentProps<typeof AlertDialogRoot>
