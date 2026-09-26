import type { ReactNode } from "react"
import { FileTrigger as AriaFileTrigger } from "react-aria-components"

export interface FileTriggerProps {
  /** A Button, or any pressable React UI control, that opens the file chooser. */
  readonly children: ReactNode
  /** MIME types or extensions the chooser offers, such as `image/*` or `.html`. */
  readonly accept?: readonly string[]
  readonly multiple?: boolean
  /** Choose a directory instead of files. */
  readonly directory?: boolean
  readonly onSelect?: (files: File[]) => void
}

/** Opens the system file chooser from the control it wraps. It draws nothing of its own. */
export function FileTrigger({ children, accept, multiple, directory, onSelect }: FileTriggerProps) {
  return <AriaFileTrigger
    acceptedFileTypes={accept}
    allowsMultiple={multiple}
    acceptDirectory={directory}
    onSelect={files => onSelect?.(files === null ? [] : [...files])}
  >{children}</AriaFileTrigger>
}
