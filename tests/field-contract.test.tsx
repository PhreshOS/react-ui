import { Field as BaseField } from "@base-ui/react/field"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  FieldError as AriaFieldError,
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
  TextField as AriaTextField
} from "react-aria-components"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ComponentType } from "react"

type FieldProperties = Readonly<{
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  onValueChange?(value: string): void
}>

const candidates: readonly [string, ComponentType<FieldProperties>][] = [
  ["React Aria", function Candidate({ defaultValue, disabled, invalid, onValueChange }) {
    return <AriaTextField
      defaultValue={defaultValue}
      isDisabled={disabled}
      isInvalid={invalid}
      isRequired
      name="workspace"
      onChange={onValueChange}
    >
      <AriaLabel>Workspace name</AriaLabel>
      <AriaInput />
      <AriaText slot="description">Shown to collaborators.</AriaText>
      <AriaFieldError>Enter a workspace name.</AriaFieldError>
    </AriaTextField>
  }],
  ["Base UI", function Candidate({ defaultValue, disabled, invalid, onValueChange }) {
    return <BaseField.Root disabled={disabled} invalid={invalid} name="workspace">
      <BaseField.Label>Workspace name</BaseField.Label>
      <BaseField.Control
        defaultValue={defaultValue}
        onValueChange={value => onValueChange?.(value)}
        required
      />
      <BaseField.Description>Shown to collaborators.</BaseField.Description>
      <BaseField.Error match={invalid}>Enter a workspace name.</BaseField.Error>
    </BaseField.Root>
  }]
]

afterEach(cleanup)

describe.each(candidates)("%s Field", function (_name, Candidate) {
  it("associates its label and description with the input", function () {
    render(<Candidate />)

    const input = screen.getByRole("textbox", { name: "Workspace name" })
    const descriptions = input.getAttribute("aria-describedby")
      ?.split(" ")
      .map(id => document.getElementById(id)?.textContent)

    expect(input.getAttribute("name")).toBe("workspace")
    expect(descriptions).toContain("Shown to collaborators.")
  })

  it("preserves native required and disabled semantics", function () {
    const rendered = render(<Candidate disabled />)

    const input = screen.getByRole("textbox", { name: "Workspace name" }) as HTMLInputElement

    expect(input.required).toBe(true)
    expect(input.disabled).toBe(true)

    rendered.rerender(<Candidate />)
    expect((screen.getByRole("textbox", { name: "Workspace name" }) as HTMLInputElement).disabled).toBe(false)
  })

  it("associates an explicit invalid state with its error", function () {
    render(<Candidate invalid />)

    const input = screen.getByRole("textbox", { name: "Workspace name" })
    const descriptions = input.getAttribute("aria-describedby")
      ?.split(" ")
      .map(id => document.getElementById(id)?.textContent)

    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(descriptions).toContain("Enter a workspace name.")
  })

  it("reports value changes without changing the callback shape", async function () {
    const onValueChange = vi.fn()

    render(<Candidate defaultValue="North" onValueChange={onValueChange} />)

    await userEvent.setup().type(screen.getByRole("textbox", { name: "Workspace name" }), " star")

    expect(onValueChange).toHaveBeenLastCalledWith("North star")
  })
})
