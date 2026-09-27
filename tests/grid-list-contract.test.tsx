import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  GridList,
  UIProvider,
  defaultAppearance,
  type GridListItemProps,
  type GridListMultipleSelectionProps,
  type GridListSingleSelectionProps
} from "../source/main.js"

afterEach(cleanup)

function renderGrid(node: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>{node}</UIProvider>)
}

it("uses the same string identities and value callbacks as ListBox", function () {
  expectTypeOf<GridListItemProps["id"]>().toEqualTypeOf<string>()
  expectTypeOf<GridListSingleSelectionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<GridListMultipleSelectionProps["value"]>().toEqualTypeOf<readonly string[] | "all" | undefined>()
  expectTypeOf<GridListMultipleSelectionProps["onChange"]>().toEqualTypeOf<((value: readonly string[] | "all") => void) | undefined>()
})

it("lays cards out in as many columns as the item width allows", function () {
  renderGrid(<GridList aria-label="Programs" itemWidth={200}>
    <GridList.Item id="notes">Notes</GridList.Item>
  </GridList>)

  expect(screen.getByRole("grid").style.gridTemplateColumns).toBe("repeat(auto-fill, minmax(min(200px, 100%), 1fr))")
})

it("selects several cards and reports the selection as identities", async function () {
  const onChange = vi.fn()
  const user = userEvent.setup()

  renderGrid(<GridList aria-label="Programs" selectionMode="multiple" defaultValue={["notes"]} onChange={onChange}>
    <GridList.Item id="notes">Notes</GridList.Item>
    <GridList.Item id="terminal">Terminal</GridList.Item>
    <GridList.Item id="blocked" disabled>Blocked</GridList.Item>
  </GridList>)

  await user.click(screen.getByRole("row", { name: "Terminal" }))
  expect(onChange).toHaveBeenLastCalledWith(["notes", "terminal"])

  await user.click(screen.getByRole("row", { name: "Blocked" }))
  expect(onChange).toHaveBeenCalledTimes(1)
})

it("groups cards into sections whose headers span the grid", function () {
  renderGrid(<GridList aria-label="Programs" selectionMode="multiple">
    <GridList.Section id="system">
      <GridList.Header>System</GridList.Header>
      <GridList.Item id="settings">Settings</GridList.Item>
    </GridList.Section>
    <GridList.Section id="internet">
      <GridList.Header>Internet</GridList.Header>
      <GridList.Item id="flambo">Flambo</GridList.Item>
    </GridList.Section>
  </GridList>)

  // A Section is a row group across the grid; its header is a row across the Section.
  const header = screen.getByRole("rowheader", { name: "System" }).parentElement!
  expect(header.style.gridColumn).toBe("1 / -1")
  expect(header.closest<HTMLElement>("[role=rowgroup]")?.style.gridColumn).toBe("1 / -1")
  expect(screen.getAllByRole("row").map(row => row.textContent?.trim()).filter(Boolean)).toEqual(expect.arrayContaining(["Settings", "Flambo"]))
})

it("moves focus between cards with the arrow keys", async function () {
  const user = userEvent.setup()
  renderGrid(<GridList aria-label="Programs" selectionMode="multiple">
    <GridList.Item id="notes">Notes</GridList.Item>
    <GridList.Item id="terminal">Terminal</GridList.Item>
  </GridList>)

  screen.getByRole("row", { name: "Notes" }).focus()
  await user.keyboard("{ArrowRight}")
  expect(document.activeElement).toBe(screen.getByRole("row", { name: "Terminal" }))
})

it("shows a card's edge at rest and hides it once the card is selected", async function () {
  const user = userEvent.setup()
  renderGrid(<GridList aria-label="Programs" selectionMode="multiple">
    <GridList.Item id="notes">Notes</GridList.Item>
  </GridList>)

  const card = screen.getByRole("row", { name: "Notes" })
  const edge = () => card.querySelector<HTMLElement>("span[aria-hidden]")!
  expect(edge().style.border).toMatch(/^1px solid/)
  expect(edge().style.opacity).toBe("1")
  await user.click(card)
  expect(edge().style.opacity).toBe("0")
})

it("only shows its cards when nothing is to be chosen", async function () {
  const user = userEvent.setup()
  renderGrid(<GridList aria-label="Planting" selectionMode="none">
    <GridList.Item id="notes">Notes</GridList.Item>
  </GridList>)

  const card = screen.getByRole("row", { name: "Notes" })
  await user.click(card)
  expect(card.getAttribute("aria-selected")).toBeNull()
  expect(card.querySelector<HTMLElement>("span[aria-hidden]")!.style.opacity).toBe("1")
})
