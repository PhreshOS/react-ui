export const textControlClass = "phreshos-ui-text-control"

/** Placeholder contrast follows the control's chosen text color, not browser gray. */
export default function FieldStyle() {
    return <style href="phreshos-react-ui-fields" precedence="phreshos">{`
.phreshos-ui-text-control::placeholder {
    color: inherit;
    opacity: 0.6;
}
`}</style>
}
