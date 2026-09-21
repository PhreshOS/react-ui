import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Disclosure,
  UIProvider,
  defaultAppearance,
  type DisclosureProps
} from "../source/main.js"

afterEach(cleanup)

it("uses one boolean expansion state", function () {
  expectTypeOf<DisclosureProps["expanded"]>().toEqualTypeOf<boolean | undefined>()
  expectTypeOf<DisclosureProps["onChange"]>().toEqualTypeOf<((expanded: boolean) => void) | undefined>()
})

it("connects the trigger and content and reports expansion changes", async function () {
  const onChange = vi.fn()

  renderDisclosure(<Disclosure onChange={onChange}>
    <Disclosure.Trigger>Advanced options</Disclosure.Trigger>
    <Disclosure.Content>Configuration</Disclosure.Content>
  </Disclosure>)

  const trigger = screen.getByRole("button", { name: "Advanced options" })
  const content = screen.getByRole("group", { hidden: true })
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
  expect(content.getAttribute("aria-labelledby")).toBe(trigger.id)

  await userEvent.setup().click(trigger)

  expect(trigger.getAttribute("aria-expanded")).toBe("true")
  expect(onChange).toHaveBeenLastCalledWith(true)
  expect(screen.getByRole("group").textContent).toBe("Configuration")
})

it("does not change a disabled Disclosure", async function () {
  const onChange = vi.fn()

  renderDisclosure(<Disclosure disabled onChange={onChange}>
    <Disclosure.Trigger>Advanced options</Disclosure.Trigger>
    <Disclosure.Content>Configuration</Disclosure.Content>
  </Disclosure>)

  const trigger = screen.getByRole("button", { name: "Advanced options" })
  expect(trigger.hasAttribute("disabled")).toBe(true)

  await userEvent.setup().click(trigger)
  expect(onChange).not.toHaveBeenCalled()
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
})

it("derives content motion from Appearance and Preferences", function () {
  const { rerender } = render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    <Disclosure defaultExpanded>
      <Disclosure.Trigger>Details</Disclosure.Trigger>
      <Disclosure.Content>Content</Disclosure.Content>
    </Disclosure>
  </UIProvider>)

  expect(screen.getByRole("group").style.transitionDuration).toBe(`${defaultAppearance.transaction.duration}ms`)

  rerender(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    <Disclosure defaultExpanded>
      <Disclosure.Trigger>Details</Disclosure.Trigger>
      <Disclosure.Content>Content</Disclosure.Content>
    </Disclosure>
  </UIProvider>)

  expect(screen.getByRole("group").style.transitionDuration).toBe("0ms")
})

function renderDisclosure(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}
