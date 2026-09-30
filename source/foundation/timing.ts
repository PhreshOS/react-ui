import type { Transaction, Easing } from "@phreshos/core"

/**
 * What moves, which decides how it moves:
 *
 * - `change`: something changing in its place, such as a color, a control's state, or an overlay
 *   appearing. It is short, and the same whatever the size of what changes.
 * - `window`: a box carried across a distance, such as a Window moving or resizing. A light body
 *   answering a hand: it sets off at once and settles softly.
 * - `view`: a whole scene carried across a distance, such as the view over the plane. It moves as
 *   a body on a spring: it arrives without passing its place, and a move taken on the way carries
 *   on at the speed it already has.
 */
export type MotionKind = "change" | "window" | "view"

export type TimingOptions = Readonly<{
  /** How far it goes, in pixels; nothing for a change in place. */
  distance?: number
  /** Whether it leaves the person's sight: then it sets off softly, or it is gone in the first frames. */
  leaving?: boolean
  /** The Appearance tempo, or a tempo made from it; 1 by default. */
  tempo?: number
}>

/**
 * The motion of one change: how long it takes and how it moves, from what moves, how far, and the
 * tempo. The shape of every motion is the System's own; the tempo only stretches or shortens time,
 * so every motion keeps its shape and its length beside every other.
 *
 * Across a distance, the time grows with the distance, gently, as the square root, within bounds:
 * a fixed short time would cross a far distance so fast that frames show as jumps.
 */
export function timing(kind: MotionKind, options: TimingOptions = {}): Transaction {
  const tempo = options.tempo ?? 1

  // A change in place is the same for one tempo, so it is one value that effects can depend on. Only
  // the few tempos in use are kept: a tempo dragged across its range leaves none of its steps behind.
  if (kind === "change") {
    let cached = changes.get(tempo)
    if (!cached) {
      if (changes.size >= 8) changes.delete(changes.keys().next().value!)
      changes.set(tempo, cached = Object.freeze({ duration: Math.round(change.duration * tempo), easing: change.easing }))
    }
    return cached
  }

  const pace = paces[kind]
  const distance = options.distance ?? 0

  // Near, the time grows as the square root; a long crossing adds a little more for each pixel
  // past a first stretch, so a far journey is not crossed at a rush.
  const designed = Math.min(pace.maximum, Math.max(pace.minimum, pace.base + pace.growth * Math.sqrt(distance) + pace.far * Math.max(0, distance - 1000)))

  return Object.freeze({ duration: Math.round(designed * tempo), easing: options.leaving ? departure : pace.easing })
}

const change = Object.freeze({ duration: 102, easing: "ease-out" as Easing })

const changes = new Map<number, Transaction>()

/** The curve of something leaving the view: soft to start, gathering speed as it goes. */
const departure: Easing = Object.freeze([0.65, 0, 0.35, 1] as const)

type Pace = Readonly<{ base: number, growth: number, far: number, minimum: number, maximum: number, easing: Easing }>

const paces: Record<Exclude<MotionKind, "change">, Pace> = {
  view: { base: 187, growth: 8.5, far: 0, minimum: 255, maximum: 850, easing: Object.freeze({ spring: Object.freeze({ bounce: 0 }) }) },
  window: { base: 72, growth: 3.4, far: 0.0425, minimum: 110, maximum: 553, easing: Object.freeze([0.22, 1, 0.36, 1] as const) }
}
