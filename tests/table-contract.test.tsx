import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState, type ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Table,
  Text,
  UIProvider,
  defaultAppearance,
  type TableMultipleSelectionProps,
  type TableRowProps,
  type TableSingleSelectionProps,
  type TableSort,
  useDragAndDrop
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

it("cuts a column's name short in a narrow column", function () {
  renderTable(<Table aria-label="Programs">
    <Table.Header>
      <Table.Column id="name" rowHeader>Name</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="files"><Table.Cell>Files</Table.Cell></Table.Row>
    </Table.Body>
  </Table>)

  const name = screen.getByText("Name")
  expect(name.style.overflow).toBe("hidden")
  expect(name.style.textOverflow).toBe("ellipsis")
  expect(name.style.whiteSpace).toBe("nowrap")
})

it("cuts a cell's text short in a narrow column, and a Text beside other things when asked", function () {
  renderTable(<Table aria-label="Sessions">
    <Table.Header>
      <Table.Column id="device" rowHeader>Signed in from</Table.Column>
      <Table.Column id="active">Last active</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="one">
        <Table.Cell><span style={{ display: "flex" }}><Text truncate>Chrome on macOS</Text><span>This browser</span></span></Table.Cell>
        <Table.Cell>Now</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>)

  const cell = screen.getByText("Now")
  expect(cell.style.textOverflow).toBe("ellipsis")
  expect(cell.style.whiteSpace).toBe("nowrap")
  expect(cell.style.overflow).toBe("clip")

  const name = screen.getByText("Chrome on macOS")
  expect(name.style.textOverflow).toBe("ellipsis")
  expect(name.style.overflow).toBe("hidden")
  expect(name.style.minWidth).toBe("0px")
})

it("never grows narrower than the room its Columns state, and is as wide as its content when none do", function () {
  const { unmount } = renderTable(<Table aria-label="Programs">
    <Table.Header>
      <Table.Column id="name" rowHeader minWidth="10rem">Name</Table.Column>
      <Table.Column id="version" width={84}>Version</Table.Column>
    </Table.Header>
    <Table.Body>
      <Table.Row id="files"><Table.Cell>Files</Table.Cell><Table.Cell>0.1.5</Table.Cell></Table.Row>
    </Table.Body>
  </Table>)

  const table = screen.getByRole("grid", { name: "Programs" })
  expect(table.style.tableLayout).toBe("fixed")
  expect(table.style.minWidth).toMatch(/10rem/)
  expect(table.style.minWidth).toMatch(/84px/)
  expect(screen.getByText("Version").closest("[role=columnheader]")!.getAttribute("style")).toMatch(/width: 84px/)
  unmount()

  renderTable(<Table aria-label="Free">
    <Table.Header><Table.Column id="name" rowHeader>Name</Table.Column></Table.Header>
    <Table.Body><Table.Row id="files"><Table.Cell>Files</Table.Cell></Table.Row></Table.Body>
  </Table>)
  expect(screen.getByRole("grid", { name: "Free" }).style.minWidth).toBe("max-content")
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

it("drags its rows with the browser's own drag, when given drag and drop hooks", function () {
  function Files() {
    const { dragAndDropHooks } = useDragAndDrop({
      getItems: keys => [...keys].map(key => ({ "text/plain": String(key) })),
      acceptedDragTypes: ["text/plain"],
      onItemDrop: () => undefined
    })
    return <Table aria-label="Files" selectionMode="multiple" dragAndDropHooks={dragAndDropHooks}>
      <Table.Header>
        <Table.Column id="name" rowHeader>Name</Table.Column>
      </Table.Header>
      <Table.Body>
        <Table.Row id="notes"><Table.Cell>Notes</Table.Cell></Table.Row>
        <Table.Row id="photos"><Table.Cell>Photos</Table.Cell></Table.Row>
      </Table.Body>
    </Table>
  }

  renderTable(<Files />)

  for (const row of screen.getAllByRole("row").slice(1)) expect(row.getAttribute("draggable")).toBe("true")
})

it("extends a controlled selection over a range with Shift", async function () {
  const user = userEvent.setup()
  function Files() {
    const [value, setValue] = useState<readonly string[] | "all">([])
    return <Table aria-label="Files" selectionMode="multiple" selectionBehavior="replace" value={value} onChange={setValue}>
      <Table.Header><Table.Column id="name" rowHeader>Name</Table.Column></Table.Header>
      <Table.Body>
        {["one", "two", "three", "four"].map(id => <Table.Row key={id} id={id}><Table.Cell>{id}</Table.Cell></Table.Row>)}
      </Table.Body>
    </Table>
  }

  renderTable(<Files />)
  const rows = screen.getAllByRole("row").slice(1)

  await user.click(rows[0]!)
  await user.keyboard("{Shift>}")
  await user.click(rows[2]!)
  await user.keyboard("{/Shift}")

  expect(rows.map(row => row.getAttribute("aria-selected"))).toEqual(["true", "true", "true", "false"])
})
