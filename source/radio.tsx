import { Radio as BaseRadio } from "@base-ui/react/radio"
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group"
import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react/direction-provider"
import type { RadioRootProps as BaseRadioProps } from "@base-ui/react/radio"
import type { RadioGroupProps as BaseRadioGroupProps } from "@base-ui/react/radio-group"
import { createContext, forwardRef, useContext, useId, useState } from "react"
import type { ReactNode } from "react"
import { fieldStyle, useControlTheme } from "./control.js"
import type { ControlProps, FieldProps } from "./control.js"
import { ToggleIndicator, toggleStyle } from "./toggle-indicator.js"
import type { MaterialOverrides } from "./material-options.js"
import type { ShadowOverrides } from "./shadow-options.js"
import { resolveDirection, useDirection } from "./direction.js"

type RadioStyle = Pick<ControlProps, "size" | "color" | "disabled"> & MaterialOverrides & ShadowOverrides & Readonly<{
  invalid: boolean
  readOnly: boolean
}>

const RadioStyleContext = createContext<RadioStyle | null>(null)

export interface RadioGroupProps extends
  Omit<BaseRadioGroupProps<string | null>, "children" | "className" | "defaultValue" | "disabled" | "onChange" | "onValueChange" | "readOnly" | "required" | "style" | "value">,
  ControlProps,
  FieldProps,
  MaterialOverrides,
  ShadowOverrides {
  readonly children: ReactNode
  readonly value?: string | null
  readonly defaultValue?: string | null
  readonly onChange?: (value: string) => void
  readonly readOnly?: boolean
  readonly orientation?: "horizontal" | "vertical"
}

export interface RadioProps extends
  Omit<BaseRadioProps<string>, "children" | "className" | "disabled" | "readOnly" | "required" | "style" | "value">,
  ControlProps,
  Pick<FieldProps, "label" | "description">,
  MaterialOverrides,
  ShadowOverrides {
  readonly value: string
}

/** One string value selected from its Radio children, with direction-aware arrow navigation. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup({
  label,
  description,
  errorMessage,
  children,
  disabled = false,
  readOnly = false,
  required = false,
  invalid = false,
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  size,
  color,
  style,
  className,
  material,
  shadow,
  "aria-describedby": ariaDescribedBy,
  "aria-labelledby": ariaLabelledBy,
  ...properties
}, ref) {
  const theme = useControlTheme({ size, color })
  const direction = resolveDirection(properties.dir, useDirection())
  const labelId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const describedBy = [ariaDescribedBy, description != null ? descriptionId : null, invalid && errorMessage != null ? errorId : null].filter(Boolean).join(" ") || undefined

  const root = <BaseRadioGroup
    {...properties}
    ref={ref}
    className={className}
    value={value}
    defaultValue={defaultValue}
    onValueChange={next => {
      if (next != null) onChange?.(next)
    }}
    disabled={disabled}
    readOnly={readOnly}
    required={required}
    aria-invalid={invalid || undefined}
    aria-labelledby={ariaLabelledBy ?? (label != null ? labelId : undefined)}
    aria-describedby={describedBy}
    style={fieldStyle(theme, disabled, style)}
  >
    {label != null && <div id={labelId} style={{ fontWeight: 550 }}>{label}</div>}
    <RadioStyleContext.Provider value={{ size, color, disabled, invalid, readOnly, material, shadow }}>
      <div style={{ display: "flex", flexDirection: orientation === "vertical" ? "column" : "row", gap: theme.gap, flexWrap: "wrap" }}>
        {children}
      </div>
    </RadioStyleContext.Provider>
    {description != null && <span id={descriptionId} style={{ fontSize: "0.92em", opacity: 0.7 }}>{description}</span>}
    {invalid && errorMessage != null && <span id={errorId} style={{ fontSize: "0.92em", color: theme.danger }}>{errorMessage}</span>}
  </BaseRadioGroup>

  return <BaseDirectionProvider direction={direction}>{root}</BaseDirectionProvider>
})

/** An option in a RadioGroup. Selection and validation belong to the group. */
export const Radio = forwardRef<HTMLDivElement, RadioProps>(function Radio({
  label,
  description,
  value,
  disabled = false,
  size,
  color,
  style,
  className,
  material,
  shadow,
  onFocus,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  ...properties
}, ref) {
  const inherited = useContext(RadioStyleContext)
  if (inherited == null) throw new Error("Radio must be used inside RadioGroup")

  const theme = useControlTheme({ size: size ?? inherited.size, color: color ?? inherited.color })
  const descriptionId = useId()
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focusVisible, setFocusVisible] = useState(false)
  const describedBy = [ariaDescribedBy, description != null ? descriptionId : null].filter(Boolean).join(" ") || undefined

  return <div ref={ref} className={className} style={fieldStyle(theme, disabled && !inherited.disabled, style)}>
    <BaseRadio.Root
      {...properties}
      value={value}
      disabled={disabled}
      aria-describedby={describedBy}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); setPressed(false) }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onFocus={event => {
        setFocusVisible(event.currentTarget.matches(":focus-visible"))
        onFocus?.(event)
      }}
      onBlur={event => {
        setFocusVisible(false)
        onBlur?.(event)
      }}
      style={state => toggleStyle(theme, state.disabled, state.readOnly)}
      render={(native, state) => <span {...native}>
        <ToggleIndicator
          kind="radio"
          material={material ?? inherited.material}
          shadow={shadow ?? inherited.shadow}
          theme={theme}
          selected={state.checked}
          focused={focusVisible}
          invalid={inherited.invalid}
          hovered={!state.disabled && !state.readOnly && hovered}
          pressed={!state.disabled && !state.readOnly && pressed}
        />
        {label}
      </span>}
    />
    {description != null && <span id={descriptionId} style={{ fontSize: "0.92em", opacity: 0.7 }}>{description}</span>}
  </div>
})
