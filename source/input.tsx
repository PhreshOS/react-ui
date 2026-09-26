import { forwardRef } from "react"
import { Input as AriaInput, TextField } from "react-aria-components"
import { useControlMetrics } from "./control/control.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { nativeTextStyle, TextWell, type TextControlProps } from "./control/text-control.js"
import MotionStyle, { textControlClass } from "./foundation/motion-style.js"
import { dimmedClass } from "./surface/surface.js"

export type InputProps = TextControlProps

/** A labeled single-line text field. `onChange` receives the string value. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  label, description, errorMessage, disabled, readOnly, required, invalid,
  size, color = "background", radius, style, className, placeholder, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)

  return <TextField {...properties} className={dimmedClass(disabled ?? false, className)} isDisabled={disabled} isReadOnly={readOnly}
    isRequired={required} isInvalid={invalid} style={fieldStyle(metrics, style)}>
    <MotionStyle />
    <FieldLabel label={label} />
    <AriaInput ref={ref} placeholder={placeholder} className={textControlClass}
      render={(native, state) => <TextWell color={color} material={material} metrics={metrics} state={state}>
        <input {...native} />
      </TextWell>}
      style={nativeTextStyle(metrics, false)} />
    <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
  </TextField>
})
