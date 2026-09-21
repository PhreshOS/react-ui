import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Accordion,
  UIProvider,
  defaultAppearance,
  type AccordionMultipleExpansionProps,
  type AccordionSingleExpansionProps
} from "../source/main.js"

afterEach(cleanup)

it("distinguishes single and multiple expansion values", function () {
  expectTypeOf<AccordionSingleExpansionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<AccordionMultipleExpansionProps["value"]>().toEqualTypeOf<readonly string[] | undefined>()
})

it("keeps at most one item expanded in the default mode", async function () {
  const onChange = vi.fn()

  renderAccordion(<Accordion defaultValue="general" onChange={onChange}>
    <Accordion.Item id="general">
      <Accordion.Trigger>General</Accordion.Trigger>
      <Accordion.Content>General settings</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item id="advanced">
      <Accordion.Trigger>Advanced</Accordion.Trigger>
      <Accordion.Content>Advanced settings</Accordion.Content>
    </Accordion.Item>
  </Accordion>)

  const general = screen.getByRole("button", { name: "General" })
  const advanced = screen.getByRole("button", { name: "Advanced" })
  expect(general.getAttribute("aria-expanded")).toBe("true")
  expect(advanced.getAttribute("aria-expanded")).toBe("false")

  await userEvent.setup().click(advanced)

  expect(general.getAttribute("aria-expanded")).toBe("false")
  expect(advanced.getAttribute("aria-expanded")).toBe("true")
  expect(onChange).toHaveBeenLastCalledWith("advanced")
})

it("keeps independent items expanded in multiple mode", async function () {
  const onChange = vi.fn()

  renderAccordion(<Accordion multiple defaultValue={["general"]} onChange={onChange}>
    <Accordion.Item id="general">
      <Accordion.Trigger>General</Accordion.Trigger>
      <Accordion.Content>General settings</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item id="advanced">
      <Accordion.Trigger>Advanced</Accordion.Trigger>
      <Accordion.Content>Advanced settings</Accordion.Content>
    </Accordion.Item>
  </Accordion>)

  const general = screen.getByRole("button", { name: "General" })
  const advanced = screen.getByRole("button", { name: "Advanced" })

  await userEvent.setup().click(advanced)

  expect(general.getAttribute("aria-expanded")).toBe("true")
  expect(advanced.getAttribute("aria-expanded")).toBe("true")
  expect(onChange).toHaveBeenLastCalledWith(["general", "advanced"])
})

it("applies the inherited component size once at each Disclosure item", function () {
  const view = renderAccordion(<Accordion size="medium">
    <Accordion.Item id="general">
      <Accordion.Trigger>General</Accordion.Trigger>
      <Accordion.Content>General settings</Accordion.Content>
    </Accordion.Item>
  </Accordion>)

  const item = screen.getByRole("button", { name: "General" }).parentElement
  const root = view.container.firstElementChild as HTMLElement

  expect(root.style.fontSize).toBe("")
  expect(item?.style.fontSize).toBe("0.8125em")
})

function renderAccordion(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}
