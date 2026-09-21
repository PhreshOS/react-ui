import { Button as AriaButton } from "react-aria-components"
import type { ControlTheme } from "./control.js"

/** Calendar trigger shared by date picker fields. */
export function CalendarTrigger({ theme }: Readonly<{ theme: ControlTheme }>) {
  const inset = Math.max(8, theme.spacing) - Math.max(4, theme.spacing / 2)

  return <AriaButton data-date-control-end="" style={state => ({
    ...theme.transition,
    appearance: "none",
    display: "grid",
    placeItems: "center",
    alignSelf: "stretch",
    flex: "0 0 auto",
    width: theme.height - Math.max(4, theme.spacing / 2),
    height: "auto",
    marginBlock: inset,
    marginInlineEnd: -Math.max(4, theme.spacing / 2),
    padding: 0,
    border: 0,
    borderRadius: Math.max(2, theme.spacing / 3),
    outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
    background: state.isPressed
      ? theme.paints.subtle.pressed.background
      : state.isHovered ? theme.paints.subtle.hover.background : "transparent",
    color: "inherit",
    cursor: state.isDisabled ? "not-allowed" : "pointer"
  })}>
    <CalendarIcon />
  </AriaButton>
}

function CalendarIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35">
    <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2" />
    <path d="M5 1.75v3M11 1.75v3M2.5 6.5h11" />
  </svg>
}
