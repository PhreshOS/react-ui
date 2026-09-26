import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Tree,
  UIProvider,
  defaultAppearance,
  type TreeItemProps,
  type TreeMultipleSelectionProps,
  type TreeProps,
  type TreeSingleSelectionProps
} from "../source/main.js"

afterEach(cleanup)

it("uses string identities for selection and expansion", function () {
  expectTypeOf<TreeItemProps["id"]>().toEqualTypeOf<string>()
  expectTypeOf<TreeSingleSelectionProps["value"]>().toEqualTypeOf<string | null | undefined>()
  expectTypeOf<TreeMultipleSelectionProps["value"]>().toEqualTypeOf<readonly string[] | "all" | undefined>()
  expectTypeOf<TreeProps["expanded"]>().toEqualTypeOf<readonly string[] | undefined>()
  expectTypeOf<TreeProps["onExpandedChange"]>().toEqualTypeOf<((values: readonly string[]) => void) | undefined>()
})

it("renders deeply nested items and expands branches accessibly", async function () {
  const onExpandedChange = vi.fn()
  const user = userEvent.setup()

  renderTree(<Tree aria-label="Files" defaultExpanded={["documents"]} onExpandedChange={onExpandedChange}>
    <Tree.Item id="documents" textValue="Documents">
      <Tree.Content>Documents</Tree.Content>
      <Tree.Item id="project" textValue="Project">
        <Tree.Content>Project</Tree.Content>
        <Tree.Item id="report" textValue="Report">
          <Tree.Content>Report</Tree.Content>
        </Tree.Item>
      </Tree.Item>
    </Tree.Item>
  </Tree>)

  const documents = screen.getByRole("row", { name: "Documents" })
  const project = screen.getByRole("row", { name: "Project" })
  expect(documents.getAttribute("aria-expanded")).toBe("true")
  expect(project.getAttribute("aria-level")).toBe("2")
  expect(screen.queryByRole("row", { name: "Report" })).toBeNull()

  await user.click(screen.getByRole("button", { name: /expand project/i }))
  expect(onExpandedChange).toHaveBeenLastCalledWith(["documents", "project"])
  expect(screen.getByRole("row", { name: "Report" }).getAttribute("aria-level")).toBe("3")
})

it("uses the React UI direction for branch keyboard behavior", async function () {
  const user = userEvent.setup()
  render(<UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
    <Tree aria-label="Files">
      <Tree.Item id="documents" textValue="Documents">
        <Tree.Content>Documents</Tree.Content>
        <Tree.Item id="report" textValue="Report"><Tree.Content>Report</Tree.Content></Tree.Item>
      </Tree.Item>
    </Tree>
  </UIProvider>)

  const documents = screen.getByRole("row", { name: "Documents" })
  documents.focus()
  await user.keyboard("[ArrowLeft]")

  expect(documents.getAttribute("aria-expanded")).toBe("true")
  expect(screen.getByRole("row", { name: "Report" })).toBeTruthy()
})

it("does not change selection when a branch is expanded", async function () {
  const onChange = vi.fn()

  renderTree(<Tree
    aria-label="Files"
    selectionMode="multiple"
    value={["report"]}
    onChange={onChange}
  >
    <Tree.Item id="documents" textValue="Documents">
      <Tree.Content>Documents</Tree.Content>
      <Tree.Item id="report" textValue="Report"><Tree.Content>Report</Tree.Content></Tree.Item>
    </Tree.Item>
  </Tree>)

  await userEvent.setup().click(screen.getByRole("button", { name: /expand documents/i }))
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole("row", { name: "Documents" }).getAttribute("aria-selected")).toBe("false")
  expect(screen.getByRole("row", { name: "Report" }).getAttribute("aria-selected")).toBe("true")
})

it("keeps selection and disabled identities distinct", async function () {
  const onChange = vi.fn()
  const user = userEvent.setup()

  renderTree(<Tree
    aria-label="Files"
    selectionMode="multiple"
    value={["readme"]}
    onChange={onChange}
  >
    <Tree.Item id="readme" textValue="README"><Tree.Content>README</Tree.Content></Tree.Item>
    <Tree.Item id="archive" textValue="Archive" disabled><Tree.Content>Archive</Tree.Content></Tree.Item>
  </Tree>)

  const readme = screen.getByRole("row", { name: "README" })
  const archive = screen.getByRole("row", { name: "Archive" })
  expect(readme.getAttribute("aria-selected")).toBe("true")
  expect(archive.getAttribute("aria-disabled")).toBe("true")

  await user.click(archive)
  expect(onChange).not.toHaveBeenCalled()

  await user.click(readme)
  expect(onChange).toHaveBeenLastCalledWith([])
})

it("reports item actions with string identities", async function () {
  const onAction = vi.fn()

  renderTree(<Tree aria-label="Files" onAction={onAction}>
    <Tree.Item id="readme" textValue="README"><Tree.Content>README</Tree.Content></Tree.Item>
  </Tree>)

  await userEvent.setup().click(screen.getByRole("row", { name: "README" }))
  expect(onAction).toHaveBeenLastCalledWith("readme")
})

it("supports recursive dynamic collections without exposing collection keys", function () {
  type Entry = { id: string, name: string, children?: readonly Entry[] }
  const entries: readonly Entry[] = [{
    id: "source",
    name: "source",
    children: [{ id: "main", name: "main.ts" }]
  }]

  function renderEntry(entry: Entry): ReactNode {
    return <Tree.Item id={entry.id} textValue={entry.name}>
      <Tree.Content>{entry.name}</Tree.Content>
      {entry.children != null && <Tree.Collection items={entry.children}>{renderEntry}</Tree.Collection>}
    </Tree.Item>
  }

  renderTree(<Tree aria-label="Project files" items={entries} defaultExpanded={["source"]}>
    {renderEntry}
  </Tree>)

  expect(screen.getByRole("row", { name: "source" })).toBeTruthy()
  expect(screen.getByRole("row", { name: "main.ts" })).toBeTruthy()
})

function renderTree(component: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>
    {component}
  </UIProvider>)
}
