import { Select as BaseSelect } from "@base-ui/react/select"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Button as AriaButton,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectValue as AriaSelectValue
} from "react-aria-components"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ComponentType } from "react"

type SelectProperties = Readonly<{
  defaultValue?: string
  onValueChange?(value: string): void
}>

const candidates: readonly [string, ComponentType<SelectProperties>][] = [
  ["React Aria", function Candidate({ defaultValue, onValueChange }) {
    return <AriaSelect
      defaultSelectedKey={defaultValue}
      name="environment"
      onSelectionChange={key => onValueChange?.(String(key))}
    >
      <AriaLabel>Environment</AriaLabel>
      <AriaButton><AriaSelectValue /></AriaButton>
      <AriaPopover>
        <AriaListBox>
          <AriaListBoxItem id="development">Development</AriaListBoxItem>
          <AriaListBoxItem id="staging">Staging</AriaListBoxItem>
          <AriaListBoxItem id="production">Production</AriaListBoxItem>
          <AriaListBoxItem id="retired" isDisabled>Retired</AriaListBoxItem>
        </AriaListBox>
      </AriaPopover>
    </AriaSelect>
  }],
  ["Base UI", function Candidate({ defaultValue, onValueChange }) {
    const items = [
      { label: "Development", value: "development" },
      { label: "Staging", value: "staging" },
      { label: "Production", value: "production" },
      { label: "Retired", value: "retired" }
    ]

    return <BaseSelect.Root
      defaultValue={defaultValue}
      items={items}
      name="environment"
      onValueChange={value => {
        if (value !== null) onValueChange?.(value)
      }}
    >
      <BaseSelect.Label>Environment</BaseSelect.Label>
      <BaseSelect.Trigger><BaseSelect.Value placeholder="Select an environment" /></BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner>
          <BaseSelect.Popup>
            <BaseSelect.List>
              <BaseSelect.Item value="development"><BaseSelect.ItemText>Development</BaseSelect.ItemText></BaseSelect.Item>
              <BaseSelect.Item value="staging"><BaseSelect.ItemText>Staging</BaseSelect.ItemText></BaseSelect.Item>
              <BaseSelect.Item value="production"><BaseSelect.ItemText>Production</BaseSelect.ItemText></BaseSelect.Item>
              <BaseSelect.Item value="retired" disabled><BaseSelect.ItemText>Retired</BaseSelect.ItemText></BaseSelect.Item>
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  }]
]

afterEach(cleanup)

describe.each(candidates)("%s Select", function (_name, Candidate) {
  it("labels its trigger and exposes the selected value", function () {
    render(<Candidate defaultValue="production" />)

    const trigger = screen.getByLabelText("Environment")

    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox")
    expect(trigger.textContent).toContain("Production")
  })

  it("opens an accessible listbox", async function () {
    render(<Candidate />)

    fireEvent.click(screen.getByLabelText("Environment"))

    expect(screen.getByRole("listbox")).toBeTruthy()
    expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual([
      "Development",
      "Staging",
      "Production",
      "Retired"
    ])
  })

  it("reports a normalized value and closes after selection", async function () {
    const onValueChange = vi.fn()
    const user = userEvent.setup()

    render(<Candidate onValueChange={onValueChange} />)

    const trigger = screen.getByLabelText("Environment")
    trigger.focus()
    await user.keyboard("[Space]")
    await user.keyboard("sta[Enter]")

    expect(onValueChange).toHaveBeenLastCalledWith("staging")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("does not select disabled options", function () {
    const onValueChange = vi.fn()

    render(<Candidate onValueChange={onValueChange} />)

    fireEvent.click(screen.getByLabelText("Environment"))
    fireEvent.click(screen.getByRole("option", { name: "Retired" }))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("supports keyboard navigation and typeahead", async function () {
    const onValueChange = vi.fn()
    const user = userEvent.setup()

    render(<Candidate onValueChange={onValueChange} />)

    const trigger = screen.getByLabelText("Environment")
    trigger.focus()
    await user.keyboard("[Space]")
    await user.keyboard("pro[Enter]")

    expect(onValueChange).toHaveBeenLastCalledWith("production")
  })

  it("participates in native form submission", function () {
    render(<form data-testid="form"><Candidate defaultValue="production" /></form>)

    const form = screen.getByTestId("form") as HTMLFormElement

    expect(new FormData(form).get("environment")).toBe("production")
  })

  it("removes portalled content when its owner unmounts", async function () {
    const rendered = render(<Candidate />)

    await userEvent.setup().click(screen.getByLabelText("Environment"))
    rendered.unmount()

    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
