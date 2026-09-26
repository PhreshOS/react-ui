import { forwardRef } from "react"
import { TextArea as AriaTextArea, TextField } from "react-aria-components"
import { useControlMetrics } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { nativeTextStyle, TextWell, type TextControlProps } from "./control/text-control.js"
import MotionStyle, { textControlClass } from "./foundation/motion-style.js"
import { dimmedClass } from "./surface/surface.js"

export interface TextareaProps extends Omit<TextControlProps, "type" | "pattern"> {
  readonly rows?: number
}

/** A labeled multiline text field, vertically resizable without escaping its width. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  label, description, errorMessage, disabled, readOnly, required, invalid,
  size, color = "background", radius, style, className, placeholder, rows = 4, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)

  return <TextField {...properties} className={dimmedClass(disabled ?? false, className)} isDisabled={disabled} isReadOnly={readOnly}
    isRequired={required} isInvalid={invalid} style={fieldStyle(metrics, style)}>
    <MotionStyle />
    <FieldLabel label={label} />
    <AriaTextArea ref={ref} placeholder={placeholder} rows={rows} className={textControlClass}
      render={(native, state) => <TextWell color={color} material={material} metrics={metrics} state={state}>
        <textarea {...native} />
      </TextWell>}
      style={nativeTextStyle(metrics, true)} />
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </TextField>
})
