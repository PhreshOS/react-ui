import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Table,
  UIProvider,
  defaultAppearance,
  type TableMultipleSelectionProps,
  type TableRowProps,
  type TableSingleSelectionProps,
  type TableSort
} from "../source/main.js"

afterEach(cleanup)

it("uses string row identities and value-based selection", function () {
  expectTypeOf<TableRowProps["id"]>().toEqualTypeOf<string>()
  expectTypeOf<TableSingleSelectionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<TableSingleSelectionProps["onChange"]>().toEqualTypeOf<((value: string | null) => void) | undefined>()
  expectTypeOf<TableMultipleSelectionProps["value"]>().toEqualTypeOf<readonly string[] | "all" | undefined>()
  expectTypeOf<TableSort>().toEqualTypeOf<{ readonly column: string, readonly direction: "ascending" | "descending" }>()
})

it("renders semantic rows and reports single selection", async function () {
  const onChange = vi.fn()
  const user = userEvent.setup()

  renderTable(<Table
    aria-label="Processes"
    selectionMode="single"
    onChange={onChange}
  >
    <Table.Header>
      <Table.Column id="name" rowHeader>Name</Table.Column>
      <Table.Column id="state">State</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="editor">
        <Table.Cell>Editor</Table.Cell>
        <Table.Cell>Running</Table.Cell>
      </Table.Row>
      <Table.Row id="terminal" disabled>
        <Table.Cell>Terminal</Table.Cell>
        <Table.Cell>Stopped</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>)

  expect(screen.getByRole("grid", { name: "Processes" })).toBeTruthy()
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy()

  const editor = screen.getByRole("row", { name: "Editor" })
  const terminal = screen.getByRole("row", { name: "Terminal" })
  await user.click(editor)
  expect(onChange).toHaveBeenLastCalledWith("editor")

  await user.click(terminal)
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(terminal.getAttribute("aria-disabled")).toBe("true")
})

it("uses the React UI direction for cell navigation", async function () {
  const user = userEvent.setup()
  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
    <Table aria-label="Processes">
      <Table.Header>
        <Table.Column id="name" rowHeader>Name</Table.Column>
        <Table.Column id="state">State</Table.Column>
      </Table.Header>
      <Table.Body>
        <Table.Row id="editor"><Table.Cell>Editor</Table.Cell><Table.Cell>Running</Table.Cell></Table.Row>
      </Table.Body>
    </Table>
  </UIProvider>)

  const row = screen.getByRole("row", { name: "Editor" })
  row.focus()
  await user.keyboard("[ArrowLeft]")
  expect(document.activeElement).toBe(screen.getByRole("rowheader", { name: "Editor" }))
})

it("clips row and header paints to its resolved radius", function () {
  renderTable(<Table aria-label="Processes" radius="large">
    <Table.Header>
      <Table.Column id="name" rowHeader>Name</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="editor"><Table.Cell>Editor</Table.Cell></Table.Row>
    </Table.Body>
  </Table>)

  const table = screen.getByRole("grid", { name: "Processes" })
  expect(table.style.borderRadius).not.toBe("")
  expect(table.style.overflow).toBe("hidden")
})

it("draws internal row separators without a bottom border on the final row", function () {
  renderTable(<Table aria-label="Processes">
    <Table.Header>
      <Table.Column id="name" rowHeader>Name</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="editor"><Table.Cell>Editor</Table.Cell></Table.Row>
      <Table.Row id="terminal"><Table.Cell>Terminal</Table.Cell></Table.Row>
    </Table.Body>
  </Table>)

  const lastCell = screen.getByRole("rowheader", { name: "Terminal" })
  expect(lastCell.style.borderBlockStart).not.toBe("")
  expect(lastCell.style.borderBlockEnd).toBe("")
})

it("derives selected dynamic-row paint from the configured color", function () {
  const processes = [{ id: "editor", name: "Editor" }]
  const table = (color: "primary" | "danger") => <Table
    aria-label="Processes"
    color={color}
    selectionMode="multiple"
    value={["editor"]}
  >
    <Table.Header>
      <Table.Column id="name" rowHeader>Name</Table.Column>
    </Table.Header>
    <Table.Body items={processes}>
      {process => <Table.Row id={process.id}><Table.Cell>{process.name}</Table.Cell></Table.Row>}
    </Table.Body>
  </Table>

  const view = renderTable(table("primary"))
  const row = screen.getByRole("row", { name: "Editor" })
  const primary = row.style.background

  view.rerender(provider(table("danger")))

  expect(row.style.background).not.toBe(primary)
})

it("reports row actions with string identities", async function () {
  const onAction = vi.fn()

  renderTable(<Table aria-label="Processes" onAction={onAction}>
    <Table.Header>
      <Table.Column id="name" rowHeader>Name</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="editor"><Table.Cell>Editor</Table.Cell></Table.Row>
    </Table.Body>
  </Table>)

  await userEvent.setup().click(screen.getByRole("row", { name: "Editor" }))
  expect(onAction).toHaveBeenLastCalledWith("editor")
})

it("reports sorting intent without reordering consumer-owned rows", async function () {
  const onSortChange = vi.fn()
  const user = userEvent.setup()

  renderTable(<Table
    aria-label="Processes"
    sort={{ column: "name", direction: "ascending" }}
    onSortChange={onSortChange}
  >
    <Table.Header>
      <Table.Column id="name" rowHeader sortable>Name</Table.Column>
      <Table.Column id="state">State</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="zeta"><Table.Cell>Zeta</Table.Cell><Table.Cell>Running</Table.Cell></Table.Row>
      <Table.Row id="alpha"><Table.Cell>Alpha</Table.Cell><Table.Cell>Stopped</Table.Cell></Table.Row>
    </Table.Body>
  </Table>)

  const name = screen.getByRole("columnheader", { name: "Name" })
  expect(name.getAttribute("aria-sort")).toBe("ascending")
  await user.click(name)
  expect(onSortChange).toHaveBeenLastCalledWith({ column: "name", direction: "descending" })
  expect(screen.getAllByRole("rowheader").map(cell => cell.textContent)).toEqual(["Zeta", "Alpha"])
})

it("supports dynamic rows, columns, and an empty state", function () {
  const columns = [
    { id: "name", label: "Name", rowHeader: true },
    { id: "state", label: "State", rowHeader: false }
  ]
  const processes = [
    { id: "editor", name: "Editor", state: "Running" },
    { id: "terminal", name: "Terminal", state: "Stopped" }
  ]

  const { rerender } = renderTable(<Table aria-label="Processes">
    <Table.Header columns={columns}>
      {column => <Table.Column id={column.id} rowHeader={column.rowHeader}>{column.label}</Table.Column>}
    </Table.Header>
    <Table.Body items={processes} renderEmptyState={() => "No processes"}>
      {process => <Table.Row id={process.id} columns={columns}>
        {column => <Table.Cell>{process[column.id as "name" | "state"]}</Table.Cell>}
      </Table.Row>}
    </Table.Body>
  </Table>)

  expect(screen.getByRole("row", { name: "Editor" })).toBeTruthy()

  rerender(provider(<Table aria-label="Processes">
    <Table.Header columns={columns}>
      {column => <Table.Column id={column.id} rowHeader={column.rowHeader}>{column.label}</Table.Column>}
    </Table.Header>
    <Table.Body items={[]} renderEmptyState={() => "No processes"}>
      {process => <Table.Row id={(process as { id: string }).id} columns={columns}>
        {() => <Table.Cell />}
      </Table.Row>}
    </Table.Body>
  </Table>))

  expect(screen.getByText("No processes")).toBeTruthy()
})

function renderTable(component: ReactNode) {
  return render(provider(component))
}

function provider(component: ReactNode) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>
}
