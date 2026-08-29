import { useInsertionEffect, useRef } from "react"
import type { Appearance, Theme } from "@phreshos/core"
import { colorOpacity } from "./color.js"
import { scale } from "./scale.js"

const properties = {
  thumb: "--phreshos-scrollbar-thumb",
  thumbHover: "--phreshos-scrollbar-thumb-hover",
  size: "--phreshos-scrollbar-size",
  padding: "--phreshos-scrollbar-padding",
  radius: "--phreshos-scrollbar-radius"
} as const

const stylesheet = `
@supports not selector(::-webkit-scrollbar) {
  * {
    scrollbar-color: var(${properties.thumb}) transparent;
    scrollbar-width: thin;
  }

  @media (hover: hover) and (pointer: fine) {
    * {
      scrollbar-color: transparent transparent;
    }

    *:hover {
      scrollbar-color: var(${properties.thumb}) transparent;
    }
  }

  @media (forced-colors: active) {
    *,
    *:hover {
      scrollbar-color: auto;
    }
  }
}

@supports selector(::-webkit-scrollbar) {
  *::-webkit-scrollbar {
    width: var(${properties.size});
    height: var(${properties.size});
    background: transparent;
  }

  *::-webkit-scrollbar-track,
  *::-webkit-scrollbar-corner {
    background: transparent;
  }

  *::-webkit-scrollbar-button {
    display: none;
  }

  *::-webkit-scrollbar-thumb {
    border: var(${properties.padding}) solid transparent;
    border-radius: var(${properties.radius});
    background-color: var(${properties.thumb});
    background-clip: padding-box;
  }

  @media (hover: hover) and (pointer: fine) {
    *::-webkit-scrollbar-thumb {
      background-color: transparent;
    }

    *:hover::-webkit-scrollbar-thumb {
      background-color: var(${properties.thumb});
    }

    *::-webkit-scrollbar-thumb:hover {
      background-color: var(${properties.thumbHover});
    }
  }

  @media (forced-colors: active) {
    *::-webkit-scrollbar-thumb,
    *:hover::-webkit-scrollbar-thumb,
    *::-webkit-scrollbar-thumb:hover {
      background-color: ButtonText;
    }
  }
}
`

const documents = new WeakMap<Document, DocumentScrollbars>()

/** Applies one Appearance to the complete owning document without rendering. */
export default function DocumentScrollbars({ appearance, theme }: Readonly<{ appearance: Appearance, theme: Theme }>) {
  const identity = useRef(Symbol("AppearanceProvider")).current
  const foreground = theme === "dark" ? appearance.foreground.dark : appearance.foreground.light
  const padding = 5
  const thumbSize = Math.max(4, Math.round(scale(appearance.spacing.light, "small")) - 2)
  const size = thumbSize + padding * 2
  const values = {
    thumb: colorOpacity(foreground, 0.1),
    thumbHover: colorOpacity(foreground, 0.2),
    size: `${size}px`,
    padding: `${padding}px`,
    radius: `${Math.min(appearance.radius.light, padding + thumbSize / 2)}px`
  }

  useInsertionEffect(function () {
    if (typeof document === "undefined") return
    return register(document, identity, values)
  }, [])

  useInsertionEffect(function () {
    if (typeof document !== "undefined") update(document, identity, values)
  }, [values.thumb, values.thumbHover, values.size, values.padding, values.radius])

  return null
}

function register(owner: Document, identity: symbol, values: ScrollbarValues) {
  const state = documents.get(owner) ?? create(owner)
  state.providers.set(identity, values)
  apply(state)

  return function () {
    state.providers.delete(identity)

    if (state.providers.size) {
      apply(state)
      return
    }

    state.style.remove()
    restore(state)
    documents.delete(owner)
  }
}

function update(owner: Document, identity: symbol, values: ScrollbarValues) {
  const state = documents.get(owner)
  if (!state?.providers.has(identity)) return
  state.providers.set(identity, values)
  apply(state)
}

function create(owner: Document): DocumentScrollbars {
  const root = owner.documentElement
  const style = owner.createElement("style")
  const original = new Map(Object.values(properties).map(property => [property, {
    value: root.style.getPropertyValue(property),
    priority: root.style.getPropertyPriority(property)
  }]))

  style.dataset.phreshosScrollbars = ""
  style.textContent = stylesheet
  owner.head.append(style)

  const state = { root, style, original, providers: new Map<symbol, ScrollbarValues>() }
  documents.set(owner, state)
  return state
}

function apply(state: DocumentScrollbars) {
  const values = [...state.providers.values()].at(-1)
  if (!values) return

  state.root.style.setProperty(properties.thumb, values.thumb)
  state.root.style.setProperty(properties.thumbHover, values.thumbHover)
  state.root.style.setProperty(properties.size, values.size)
  state.root.style.setProperty(properties.padding, values.padding)
  state.root.style.setProperty(properties.radius, values.radius)
}

function restore(state: DocumentScrollbars) {
  for (const [property, original] of state.original) {
    if (original.value) state.root.style.setProperty(property, original.value, original.priority)
    else state.root.style.removeProperty(property)
  }
}

interface ScrollbarValues {
  readonly thumb: string
  readonly thumbHover: string
  readonly size: string
  readonly padding: string
  readonly radius: string
}

interface DocumentScrollbars {
  readonly root: HTMLElement
  readonly style: HTMLStyleElement
  readonly original: ReadonlyMap<string, Readonly<{ value: string, priority: string }>>
  readonly providers: Map<symbol, ScrollbarValues>
}
