import { createElement, forwardRef, useId, useInsertionEffect } from "react"
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, CSSProperties, ElementType, ReactElement, ReactNode } from "react"
import { canvasDarkness, colorOpacity, contrast, mixColor, readableColor, recessColor, resolveColor, type Color } from "../foundation/color.js"
import type { Direction } from "../foundation/direction.js"
import { resolveRadius, type RadiusProps } from "../foundation/radius.js"
import { useVisual, type Visual } from "../foundation/visual.js"
import { grainImage, grainSeed, grainSize } from "./grain.js"
import { flushPaintRules, paintClass, paintClassesAvailable } from "./paint-class.js"
import { resolveMaterialOptions, type MaterialMode, type MaterialOptions, type MaterialOverrides } from "./material-options.js"
import { resolveShadowOptions, shadowStyle, type ShadowOverrides } from "./shadow-options.js"

export type { MaterialMode, MaterialOptions } from "./material-options.js"
export type { ShadowOptions } from "./shadow-options.js"

/**
 * Where a Surface sits relative to its surroundings. Every depth is the same
 * Material; only the direction of light changes.
 *   raised   — something you act on: an outer shadow and a lit top edge.
 *   flat     — a region level with its surroundings: only a boundary.
 *   recessed — something that holds content: a slightly deeper paint and an
 *              inner shadow instead of an outer one.
 */
export type SurfaceDepth = "raised" | "flat" | "recessed"

export interface SurfaceOwnProps extends MaterialOverrides, ShadowOverrides, RadiusProps {
  readonly color?: Color
  readonly depth?: SurfaceDepth
}

/**
 * The structural properties a component must preserve when it hosts a Surface.
 * It applies `className` and `style` and renders `children` on one element,
 * and forwards its ref to that element.
 */
export interface SurfaceHostProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly dir?: Direction
  readonly style?: CSSProperties
}

export type SurfaceHost = ElementType<SurfaceHostProps>

export type SurfaceProps<As extends SurfaceHost = "div"> = SurfaceOwnProps
  & Readonly<{ as?: As }>
  & Omit<ComponentPropsWithRef<As>, keyof SurfaceOwnProps | "as" | "color">

export type SurfaceComponent = <As extends SurfaceHost = "div">(
  properties: SurfaceProps<As>
) => ReactElement | null

/** Interaction state supplied by the components that own a Surface. */
export interface SurfaceInteraction {
  readonly hovered?: boolean
  readonly pressed?: boolean
  readonly focusVisible?: boolean
  readonly disabled?: boolean
  /** Marks a value-holding Surface whose current value is rejected. */
  readonly invalid?: boolean
}

type SurfaceImplementationProps = SurfaceOwnProps
  & Readonly<{ as?: ElementType, interaction?: SurfaceInteraction }>
  & Omit<ComponentPropsWithoutRef<"div">, keyof SurfaceOwnProps | "as" | "color">

/**
 * The single visual primitive. Components express what they are through
 * color, depth, and interaction; paint, grain, frost, edge, shadow, focus,
 * and the text color are all derived here from Appearance.
 */
export const SurfaceView = forwardRef<Element, SurfaceImplementationProps>(function Surface({
  as: Element = "div",
  color = "background",
  depth = "raised",
  material,
  shadow,
  radius,
  interaction,
  className,
  children,
  style,
  ...properties
}, ref) {
  const visual = useVisual()
  const identity = useId()
  const paint = surfacePaint(visual, color, depth, material, shadow, interaction)
  const borderRadius = radius === undefined && style?.borderRadius !== undefined
    ? style.borderRadius
    : resolveRadius(radius ?? "medium", visual.radius)
  const declarations = [
    ...Object.entries(paint.variables).map(([name, value]) => `${name}: ${value}`),
    "transition-property: box-shadow, color, outline-color, opacity",
    `transition-duration: ${visual.duration}ms`,
    `transition-timing-function: ${visual.easing}`,
    `box-shadow: ${paint.shadow}`,
    `color: ${paint.text}`,
    `outline: 3px solid ${interaction?.focusVisible ? paint.ring : "transparent"}`,
    "outline-offset: 1px",
    `border-radius: ${typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius}`
  ].join("; ")
  const painted = paintClassesAvailable ? paintClass(declarations) : undefined

  useInsertionEffect(flushPaintRules)

  return createElement(Element, {
    ...properties,
    ref,
    className: [surfaceClass, painted, dimmedClass(interaction?.disabled ?? false), className].filter(Boolean).join(" "),
    // Without a document (server rendering), the same declarations travel inline.
    style: painted === undefined ? { ...inlineDeclarations(declarations), ...style } : style
  }, <SurfaceStyle />, paint.distortion > 0 && <Refraction identity={identity} distortion={paint.distortion} />, children)
})

function inlineDeclarations(declarations: string): CSSProperties {
  const result: Record<string, string> = {}
  for (const declaration of declarations.split("; ")) {
    const separator = declaration.indexOf(": ")
    const name = declaration.slice(0, separator)
    result[name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = declaration.slice(separator + 2)
  }
  return result as CSSProperties
}

/** One material- and depth-owning element. The host is a div unless `as` selects another. */
export const Surface = SurfaceView as SurfaceComponent

/**
 * Marks an element that is disabled. Disabling fades only the outermost
 * disabled element: parts inside it, such as a field's well or a disabled
 * calendar's days, are disabled with it and do not fade a second time.
 */
export function dimmedClass(disabled: boolean, className?: string): string | undefined {
  return [disabled ? dimmed : undefined, className].filter(Boolean).join(" ") || undefined
}

const disabledOpacity = 0.46
const dimmed = "phreshos-dimmed"

const surfaceClass = "phreshos-surface"

const materialLevel = Object.freeze({ none: 0, basic: 1, extended: 2, full: 3 } satisfies Record<MaterialMode, number>)

/** Resolves every visual value of one Surface. Pure over its inputs. */
export function surfacePaint(
  visual: Visual,
  color: Color,
  depth: SurfaceDepth,
  options: MaterialMode | MaterialOptions | undefined,
  shadowOptions: ShadowOverrides["shadow"],
  interaction: SurfaceInteraction | undefined
) {
  const { colors } = visual
  const base = resolveColor(color, colors)
  const active = interaction !== undefined && !interaction.disabled
  const shift = active ? interaction.pressed ? 0.1 : interaction.hovered ? 0.05 : 0 : 0
  // Recessed paint sinks slightly below its surroundings; interaction then
  // moves the same base toward the content color so every state stays related.
  const darkness = canvasDarkness(colors)
  // A recess moves away from its surroundings toward whichever extreme has
  // room, by one constant perceptual difference on any canvas.
  const rest = depth === "recessed" ? recessColor(base) : base
  // A transparent Surface has no substance of its own: it takes the content
  // color of whatever it sits on and only reveals interaction as a veil.
  const clear = base === "transparent"
  const fill = clear
    ? shift > 0 ? colorOpacity(colors.foreground, shift * 1.3) : "transparent"
    : mixColor(rest, colors.foreground, shift)

  const mode = clear ? "none" : typeof options === "object" ? "full" : options ?? "basic"
  const level = materialLevel[mode]
  const material = resolveMaterialOptions(typeof options === "object" ? options : {}, visual.material)
  const opacity = level >= materialLevel.extended ? material.opacity : 1
  const translucent = opacity < 1
  const frost = level >= materialLevel.full && translucent
    ? [material.backdrop > 0 ? `blur(${material.backdrop}px)` : "", material.saturation !== 1 ? `saturate(${material.saturation})` : ""].filter(Boolean).join(" ")
    : ""
  const grain = level >= materialLevel.basic && material.grain > 0 && material.grainAmount > 0
    ? grainImage(grainSeed, material.grainAmount, level === materialLevel.basic ? material.grain * material.opacity : material.grain)
    : "none"

  const ringBase = interaction?.invalid
    ? colors.danger
    : !clear && (contrast(base, colors.background) ?? 1) >= 1.6 ? base : colors.primary
  const edged = level >= materialLevel.basic
  const lit = edgeLight(depth, darkness)
  const light = mixColor(fill, "#ffffff", 0.7)
  // Light rises from the middle of the top and bottom edges and spreads along
  // them, fading as it goes, so it leans toward the sides without reaching
  // them; the same slight spill falls inward from both middles. A hairline
  // outside separates the Surface from whatever it sits on. Neither edge
  // dominates, so no Surface reads as a bevel. Depth changes only how much
  // light the rim receives.
  const rim = edged
    ? `linear-gradient(to right, transparent, ${colorOpacity(light, lit.side)} 18%, ${colorOpacity(light, lit.edge)} 50%, ${colorOpacity(light, lit.side)} 82%, transparent)`
    : "none"
  const spill = (edge: "top" | "bottom") => edged && lit.spill > 0
    ? `radial-gradient(50% 6px at 50% ${edge === "top" ? "0" : "100%"}, ${colorOpacity(light, lit.spill)}, transparent)`
    : "none"
  // A recessed Surface holds a value, so focus and validity also claim its hairline.
  const claimed = interaction?.invalid || (depth === "recessed" && interaction?.focusVisible)
  const hairline = !edged
    ? null
    : claimed
      ? `0 0 0 1px ${ringBase}`
      : `0 0 0 0.5px ${colorOpacity("#000000", lit.hairline)}`
  const shadow = visual.shadow
  const outer = clear || depth !== "raised" || shadowOptions === false || (active && interaction.pressed)
    ? null
    : shadowStyle(resolveShadowOptions(typeof shadowOptions === "object" ? shadowOptions : {}, shadow))

  return {
    fill,
    // The label is chosen once for the resting paint: interaction shades stay
    // close to it, and re-deciding per state would flip text on near-ties.
    text: clear ? "inherit" : readableColor(rest, colors),
    ring: colorOpacity(ringBase, 0.34),
    shadow: [hairline, outer === "none" ? null : outer].filter(Boolean).join(", ") || "none",
    distortion: level >= materialLevel.full && translucent ? material.distortion : 0,
    variables: {
      "--phreshos-surface-paint": translucent ? colorOpacity(fill, opacity) : fill,
      "--phreshos-surface-grain": grain,
      "--phreshos-surface-frost": frost || "none",
      "--phreshos-surface-rim": rim,
      "--phreshos-surface-spill-top": spill("top"),
      "--phreshos-surface-spill-bottom": spill("bottom"),
      "--phreshos-surface-duration": `${visual.duration}ms`,
      "--phreshos-surface-easing": visual.easing
    } as CSSProperties
  }
}

/** How much light each part of the rim receives, interpolated along the canvas darkness. */
function edgeLight(depth: SurfaceDepth, darkness: number) {
  const { light, dark } = edgeLightEnds[depth]
  return {
    edge: round(mix(light.edge, dark.edge, darkness)),
    side: round(mix(light.side, dark.side, darkness)),
    spill: round(mix(light.spill, dark.spill, darkness)),
    hairline: round(mix(light.hairline, dark.hairline, darkness))
  }
}

function round(value: number) {
  return Math.round(value * 1_000) / 1_000
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

const edgeLightEnds = Object.freeze({
  raised: {
    light: { edge: 0.55, side: 0.22, spill: 0.15, hairline: 0.16 },
    dark: { edge: 0.18, side: 0.08, spill: 0.035, hairline: 0.55 }
  },
  flat: {
    light: { edge: 0.3, side: 0.14, spill: 0, hairline: 0.12 },
    dark: { edge: 0.1, side: 0.05, spill: 0, hairline: 0.45 }
  },
  recessed: {
    light: { edge: 0.45, side: 0.12, spill: 0, hairline: 0.12 },
    dark: { edge: 0.12, side: 0.04, spill: 0, hairline: 0.45 }
  }
} as const)

/** A separate compositor pass for refraction, present only when it is visible. */
function Refraction({ identity, distortion }: Readonly<{ identity: string, distortion: number }>) {
  const filter = `phreshos-refraction-${identity.replaceAll(":", "")}`

  return <span aria-hidden="true" data-surface-refraction="" style={{
    position: "absolute",
    inset: 0,
    zIndex: -2,
    borderRadius: "inherit",
    pointerEvents: "none",
    backdropFilter: `url("#${filter}")`,
    WebkitBackdropFilter: `url("#${filter}")`
  }}>
    <svg width="0" height="0" focusable="false" style={{ position: "absolute" }}>
      <filter id={filter} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves={2} seed={92} result="noise" />
        <feGaussianBlur in="noise" stdDeviation={2} result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale={distortion} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  </span>
}

/*
 * Paint and edge live on pseudo-elements driven by per-Surface custom
 * properties, so a Surface is one DOM element regardless of its Material.
 * Position and isolation use zero specificity so any consumer class or style
 * can replace them.
 */
const stylesheet = `
:where(.${dimmed}:not(.${dimmed} .${dimmed})) {
  opacity: ${disabledOpacity};
}
:where(.${surfaceClass}) {
  position: relative;
  isolation: isolate;
}
.${surfaceClass}::before,
.${surfaceClass}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.${surfaceClass}::before {
  z-index: -1;
  background-color: var(--phreshos-surface-paint);
  background-image: var(--phreshos-surface-spill-top), var(--phreshos-surface-spill-bottom), var(--phreshos-surface-grain);
  background-size: auto, auto, ${grainSize}px ${grainSize}px;
  -webkit-backdrop-filter: var(--phreshos-surface-frost);
  backdrop-filter: var(--phreshos-surface-frost);
  transition: background-color var(--phreshos-surface-duration) var(--phreshos-surface-easing);
}
.${surfaceClass}::after {
  z-index: 1;
  padding: 0.5px;
  background: var(--phreshos-surface-rim);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}
`

/** React hoists and deduplicates this stylesheet, including inside portals. */
function SurfaceStyle() {
  return <style href="phreshos-react-ui-surface" precedence="phreshos">{stylesheet}</style>
}
