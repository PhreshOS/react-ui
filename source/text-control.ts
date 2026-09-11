import type { TextFieldProps } from "react-aria-components"
import type { ControlOverrides, ControlProps, FieldProps } from "./control.js"
import type { RadiusProps } from "./radius.js"
import type { MaterialOverrides } from "./material-options.js"

/** Shared contract for native text-entry controls. */
export interface TextControlProps extends Omit<TextFieldProps, ControlOverrides | "isReadOnly">, ControlProps, FieldProps, RadiusProps, MaterialOverrides {
  readonly placeholder?: string
  readonly readOnly?: boolean
}
