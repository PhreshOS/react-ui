import type { CSSProperties } from "react"
import type { ThemeProperties } from "@phreshos/core"
import { resolveSpacing, type Spacing } from "./spacing.js"

/** Cross-axis alignment shared by layout containers. */
export type LayoutAlignment = "start" | "center" | "end" | "stretch" | "baseline"

/** Main-axis distribution shared by layout containers. */
export type LayoutJustification = "start" | "center" | "end" | "between" | "around" | "evenly"

/** A spacing value applied between layout children. */
export type LayoutGap = Spacing

const alignments: Record<LayoutAlignment, CSSProperties["alignItems"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline"
}

const justifications: Record<LayoutJustification, CSSProperties["justifyContent"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly"
}

export function alignment(value: LayoutAlignment | undefined): CSSProperties["alignItems"] | undefined {
  return value === undefined ? undefined : alignments[value]
}

export function justification(value: LayoutJustification | undefined): CSSProperties["justifyContent"] | undefined {
  return value === undefined ? undefined : justifications[value]
}

/** Resolves semantic spacing while preserving explicit CSS gap values. */
export function resolveGap(value: LayoutGap | undefined, theme: ThemeProperties | null): CSSProperties["gap"] {
  return resolveSpacing(value, theme)
}

export function tracks(value: number | string | undefined, property: "columns" | "rows"): string | undefined {
  if (value === undefined || typeof value === "string") return value

  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`Grid ${property} must be a positive integer or CSS track expression`)
  }

  return `repeat(${value}, minmax(0, 1fr))`
}
