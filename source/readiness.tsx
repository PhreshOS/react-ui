import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from "react"
import type { ReactElement, ReactNode } from "react"

type RequirementIdentity = object

type RequirementEntry = Readonly<{
  message?: string
  createdAt: Date
  readyAt: Date | null
}>

/** One requirement observed during the boundary's initial readiness cycle. */
export interface ReadinessRequirement {
  readonly message: string
  readonly createdAt: Date
  readonly readyAt: Date | null
}

interface ReadinessRegistry {
  readonly complete: (identity: RequirementIdentity) => void
  readonly register: (identity: RequirementIdentity, message: string | undefined) => void
  readonly release: (identity: RequirementIdentity) => void
  readonly update: (identity: RequirementIdentity, message: string | undefined) => void
}

interface ReadinessContextValue {
  readonly ready: boolean
  readonly requirements: readonly ReadinessRequirement[]
  readonly registry: ReadinessRegistry
}

const ReadinessContext = createContext<ReadinessContextValue | null>(null)

export interface ReadinessProps {
  /** Interface prepared behind this initial readiness boundary. */
  readonly children: ReactNode

  /** Optional presentation rendered while initial requirements remain pending. */
  readonly fallback?: (requirements: readonly ReadinessRequirement[]) => ReactNode

  /** Message used when the oldest pending requirement has none of its own. */
  readonly message?: string
}

/** Prevents interaction with one React subtree until its initial requirements are ready. */
export function ReadinessRoot({
  children,
  fallback,
  message = "Loading…"
}: ReadinessProps) {
  const parent = useContext(ReadinessContext)
  const requirements = useRef(new Map<RequirementIdentity, RequirementEntry>())
  const revealedRef = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [revision, invalidate] = useReducer(value => value + 1, 0)

  const registry = useMemo<ReadinessRegistry>(() => ({
    register(identity, nextMessage) {
      if (revealedRef.current) return
      const current = requirements.current.get(identity)
      if (current != null) {
        if (current.readyAt == null) return
        // React Strict Mode restores mounted effects before the initial tree settles.
        requirements.current.set(identity, {
          ...current,
          message: nextMessage,
          readyAt: null
        })
        invalidate()
        return
      }
      requirements.current.set(identity, {
        message: nextMessage,
        createdAt: new Date(),
        readyAt: null
      })
      invalidate()
    },
    update(identity, nextMessage) {
      if (revealedRef.current) return
      const current = requirements.current.get(identity)
      if (current == null || current.message === nextMessage) return
      requirements.current.set(identity, { ...current, message: nextMessage })
      invalidate()
    },
    complete(identity) {
      if (revealedRef.current) return
      const current = requirements.current.get(identity)
      if (current == null || current.readyAt != null) return
      requirements.current.set(identity, { ...current, readyAt: new Date() })
      invalidate()
    },
    release(identity) {
      if (revealedRef.current) return
      const current = requirements.current.get(identity)
      if (current == null || current.readyAt != null) return
      requirements.current.set(identity, { ...current, readyAt: new Date() })
      invalidate()
    }
  }), [])

  const currentRequirements = useMemo<readonly ReadinessRequirement[]>(() => {
    return [...requirements.current.values()].map(requirement => ({
      message: requirement.message ?? message,
      createdAt: new Date(requirement.createdAt),
      readyAt: requirement.readyAt == null ? null : new Date(requirement.readyAt)
    }))
  }, [message, revision])
  const currentMessage = currentRequirements.find(requirement => requirement.readyAt == null)?.message ?? message
  const completeParent = useManagedRequirement(parent?.registry ?? null, currentMessage)

  useLayoutEffect(() => {
    if (
      revealedRef.current
      || [...requirements.current.values()].some(requirement => requirement.readyAt == null)
    ) return
    // Descendant layout effects register first, so an empty set here represents a settled commit.
    revealedRef.current = true
    setRevealed(true)
  }, [revision])

  useLayoutEffect(() => {
    if (revealed) completeParent()
  }, [completeParent, revealed])

  const context = useMemo<ReadinessContextValue>(() => ({
    ready: revealed,
    requirements: currentRequirements,
    registry
  }), [currentRequirements, registry, revealed])

  return <ReadinessContext.Provider value={context}>
    <div
      data-readiness=""
      data-ready={revealed ? "true" : "false"}
      inert={revealed ? undefined : true}
      style={{ display: "contents" }}
    >{children}</div>
    {!revealed && fallback?.(currentRequirements)}
  </ReadinessContext.Provider>
}

export interface ReadinessRequirementProps {
  /** Message exposed while this mounted requirement remains pending. */
  readonly message?: string
}

/** One declarative requirement whose pending lifetime matches this component's mount. */
export function ReadinessRequirement({ message }: ReadinessRequirementProps) {
  useRequirement(message)
  return null
}

/** Registers one requirement and returns its stable, idempotent completion. */
export function useRequirement(message?: string) {
  const context = useContext(ReadinessContext)
  if (context == null) throw new Error("useRequirement must be used inside Readiness")
  return useManagedRequirement(context.registry, message)
}

/** Reads the nearest boundary's current initial-readiness state. */
export function useReadiness(): Readonly<{
  ready: boolean
  requirements: readonly ReadinessRequirement[]
}> {
  const context = useContext(ReadinessContext)
  if (context == null) throw new Error("useReadiness must be used inside Readiness")
  return useMemo(() => ({
    ready: context.ready,
    requirements: context.requirements
  }), [context.ready, context.requirements])
}

function useManagedRequirement(registry: ReadinessRegistry | null, message: string | undefined) {
  const identity = useRef<RequirementIdentity>({})
  const completed = useRef(false)

  useLayoutEffect(() => {
    if (!completed.current) registry?.register(identity.current, message)
    return () => registry?.release(identity.current)
  }, [registry])

  useLayoutEffect(() => {
    if (!completed.current) registry?.update(identity.current, message)
  }, [message, registry])

  return useCallback(() => {
    if (completed.current) return
    completed.current = true
    registry?.complete(identity.current)
  }, [registry])
}

interface ReadinessComponent {
  (properties: ReadinessProps): ReactElement | null
  readonly Requirement: typeof ReadinessRequirement
}

export const Readiness = Object.assign(ReadinessRoot, {
  Requirement: ReadinessRequirement
}) as ReadinessComponent

export type ReadinessFallback = NonNullable<ReadinessProps["fallback"]>
