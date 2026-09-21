import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  ComboBox,
  UIProvider,
  defaultAppearance,
  type ComboBoxProps
} from "../source/main.js"

const regions = [
  { value: "us", label: "United States" },
  { value: "eu", label: "Europe" },
  { value: "preview", label: "Preview", disabled: true }
] as const

afterEach(cleanup)

it("uses string selection and query contracts", function () {
  expectTypeOf<ComboBoxProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<ComboBoxProps["onChange"]>().toEqualTypeOf<((value: string | null) => void) | undefined>()
  expectTypeOf<ComboBoxProps["inputValue"]>().toEqualTypeOf<string | undefined>()
  expectTypeOf<ComboBoxProps["onInputChange"]>().toEqualTypeOf<((value: string) => void) | undefined>()
  expectTypeOf<"selectedKey">().not.toExtend<keyof ComboBoxProps>()
  expectTypeOf<"isDisabled">().not.toExtend<keyof ComboBoxProps>()
  expectTypeOf<"items">().not.toExtend<keyof ComboBoxProps>()
  expectTypeOf<"selectionMode">().not.toExtend<keyof ComboBoxProps>()
})

it("filters options and reports the selected string identity", async function () {
  const onChange = vi.fn()
  const onInputChange = vi.fn()
  const user = userEvent.setup()

  renderComboBox(<ComboBox
    label="Region"
    options={regions}
    onChange={onChange}
    onInputChange={onInputChange}
  />)

  const input = screen.getByRole("combobox", { name: "Region" })
  await user.click(input)
  await user.type(input, "eur")

  expect(onInputChange).toHaveBeenLastCalledWith("eur")
  expect(screen.getByRole("option", { name: "Europe" })).toBeTruthy()
  expect(screen.queryByRole("option", { name: "United States" })).toBeNull()

  await user.click(screen.getByRole("option", { name: "Europe" }))
  expect(onChange).toHaveBeenLastCalledWith("eu")
  expect((input as HTMLInputElement).value).toBe("Europe")
})

it("uses one Surface field and keeps disabled options unavailable", async function () {
  const user = userEvent.setup()
  renderComboBox(<ComboBox label="Region" options={regions} defaultValue="us" />)

  const input = screen.getByRole("combobox", { name: "Region" })
  expect(input.parentElement?.querySelector("[data-material]")).not.toBeNull()
  expect((input as HTMLInputElement).value).toBe("United States")

  await user.click(screen.getByRole("button", { name: /Show options/ }))
  expect(screen.getByRole("option", { name: "Preview" }).getAttribute("aria-disabled")).toBe("true")
})

function renderComboBox(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}
