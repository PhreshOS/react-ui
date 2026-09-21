import type { Key, Selection } from "react-aria-components"

export type MultipleStringSelection = readonly string[] | "all"

export type SingleStringSelectionProps = Readonly<{
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
}>

export type MultipleStringSelectionProps = Readonly<{
  value?: MultipleStringSelection
  defaultValue?: MultipleStringSelection
  onChange?: (value: MultipleStringSelection) => void
}>

export function toAriaSelection(value: string | null | MultipleStringSelection | undefined): "all" | Set<string> | undefined {
  if (value === undefined) return undefined
  if (value === "all") return "all"
  if (value === null) return new Set()
  if (typeof value === "string") return new Set([value])
  return new Set(value)
}

export function stringKey(value: Key): string {
  if (typeof value !== "string") throw new Error("Collection identities must be strings")
  return value
}

export function optionalStringKey(value: Key | null): string | null {
  return value === null ? null : stringKey(value)
}

export function singleSelection(selection: Selection): string | null {
  return selection === "all" ? null : optionalStringKey(selection.values().next().value ?? null)
}

export function multipleSelection(selection: Selection): MultipleStringSelection {
  return selection === "all" ? "all" : [...selection].map(stringKey)
}

export function stringKeys(values: Iterable<Key>): readonly string[] {
  return [...values].map(stringKey)
}
