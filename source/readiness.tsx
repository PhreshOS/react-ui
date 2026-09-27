import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react"
import type { ReactNode } from "react"

/** One requirement of a boundary, as it is now. */
export interface Requirement<Detail = unknown> {
  readonly ready: boolean
  readonly detail: Detail
}

/** What a boundary knows: whether it is ready, and every requirement declared in it. */
export interface ReadinessState<Detail = unknown> {
  readonly ready: boolean
  readonly requirements: readonly Requirement<Detail>[]
}

export interface ReadinessProps<Detail = unknown> {
  /** The interface that waits. Held while the boundary is not ready. */
  readonly children?: ReactNode

  /**
   * Interface that shows the waiting. Rendered next to the children, outside
   * the held area, so it stays interactive. A function receives the same
   * value `useReadiness()` returns.
   */
  readonly status?: ReactNode | ((readiness: ReadinessState<Detail>) => ReactNode)

  /** Milliseconds the boundary stays held after its requirements are ready, for work they do not see. */
  readonly delay?: number
}

interface Registry {
  readonly set: (identity: object, requirement: Requirement) => void
  readonly delete: (identity: object) => void
}

/** Where `useRequirement` declares. Status content sees the parent's, not its own boundary's. */
const RegistryContext = createContext<Registry | null>(null)
/** What `useReadiness` reads. */
const StateContext = createContext<ReadinessState | null>(null)

/**
 * Holds interaction with its children until every requirement declared in it
 * is ready. It draws nothing: the children are wrapped in one
 * `display: contents` element that carries `inert` while waiting.
 *
 * A requirement belongs to its nearest boundary only, so a boundary that
 * starts waiting inside a ready one holds just its own part.
 *
 * The boundary starts held and is released only after the first commit, once
 * every requirement mounted with it has registered. Server HTML is held too.
 */
export function Readiness<Detail = unknown>({ children, status, delay = 0 }: ReadinessProps<Detail>) {
  const entries = useRef(new Map<object, Requirement>())
  const [revision, invalidate] = useReducer((value: number) => value + 1, 0)
  const [mounted, setMounted] = useState(false)
  const [delayed, setDelayed] = useState(false)

  const registry = useMemo<Registry>(() => ({
    set(identity, requirement) {
      const current = entries.current.get(identity)
      if (current !== undefined && current.ready === requirement.ready && Object.is(current.detail, requirement.detail)) return
      entries.current.set(identity, requirement)
      invalidate()
    },
    delete(identity) {
      if (entries.current.delete(identity)) invalidate()
    }
  }), [])

  // Descendant layout effects run first, so every requirement mounted with the boundary is known here.
  useLayoutEffect(() => setMounted(true), [])

  const requirements = useMemo(() => [...entries.current.values()], [revision])
  const met = mounted && requirements.every(requirement => requirement.ready)

  // The delay starts again whenever a requirement stops being ready.
  if (!met && delayed) setDelayed(false)
  useEffect(() => {
    if (!met || delay === 0) return
    const timer = setTimeout(() => setDelayed(true), delay)
    return () => clearTimeout(timer)
  }, [met, delay])

  const ready = met && (delay === 0 || delayed)
  const state = useMemo<ReadinessState>(() => ({ ready, requirements }), [ready, requirements])

  return <StateContext.Provider value={state}>
    <RegistryContext.Provider value={registry}>
      <div data-readiness="" inert={!ready} style={{ display: "contents" }}>{children}</div>
    </RegistryContext.Provider>
    {typeof status === "function" ? status(state as ReadinessState<Detail>) : status}
  </StateContext.Provider>
}

/**
 * Declares one requirement of the nearest boundary for as long as the calling
 * component is mounted. It follows `ready` both ways. `detail` is carried as-is
 * and compared by identity, so pass a stable value such as a string.
 */
export function useRequirement(ready: boolean, detail?: unknown): void {
  const registry = useContext(RegistryContext)
  if (registry === null) throw new Error("useRequirement must be called inside a Readiness boundary.")
  // The call site is the identity: one object for this mounted component.
  const [identity] = useState(() => ({}))

  useLayoutEffect(() => {
    registry.set(identity, { ready, detail })
  }, [registry, identity, ready, detail])

  useLayoutEffect(() => () => registry.delete(identity), [registry, identity])
}

/**
 * Reads the nearest boundary. Inside `status`, that is the boundary the status
 * belongs to. `Detail` states what the boundary's requirements pass as detail.
 */
export function useReadiness<Detail = unknown>(): ReadinessState<Detail> {
  const state = useContext(StateContext)
  if (state === null) throw new Error("useReadiness must be called inside a Readiness boundary.")
  return state as ReadinessState<Detail>
}
