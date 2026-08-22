# `@phreshos/react-ui`

A React component library for coherent PhreshOS Program interfaces.

## Installation

```bash
bun add @phreshos/react-ui @phreshos/core react react-dom
```

React UI accepts an explicit `ThemeProperties` snapshot and does not require a
running PhreshOS environment:

```tsx
import { standardTheme } from "@phreshos/core"
import { Button, Flex, ThemeProvider } from "@phreshos/react-ui"

function Example() {
  return <ThemeProvider theme={standardTheme}>
    <Flex align="center" gap="small">
      <Button onPress={() => console.log("save")}>Save</Button>
    </Flex>
  </ThemeProvider>
}
```

## Package status

This package is one component of a larger architecture that remains under
active testing. Its public surface is intentionally small and will grow only
as component contracts are established. It is usable outside a running
system, though its standard Theme contract comes from `@phreshos/core`.

The library is being built up from behavior contracts rather than from a
primitive dependency's component catalog. `Button` uses React Aria Components
for normalized pointer, keyboard, focus, disabled, and pending behavior,
without exposing that library as the public design language. Components still
under evaluation may compare React Aria Components against Base UI privately,
in tests.

The library's future icon language has a tree-shakeable public subpath,
`@phreshos/react-ui/icons`. That subpath deliberately exports nothing until an
icon source and its contracts have been selected.

`Grid` and `Flex` are appearance-neutral layout primitives. They preserve
native element properties, styles, and refs while naming the layout decisions
that recur throughout an interface:

```tsx
<Grid columns="repeat(auto-fit, minmax(12rem, 1fr))" gap="1rem">
  ...
</Grid>

<Flex align="center" justify="between" gap={12} wrap>
  ...
</Flex>
```

Numeric gaps are expressed in pixels. Grid dimensions may be positive integer
counts or native CSS track expressions, leaving responsive behavior to CSS
rather than introducing a second breakpoint system.

Inside a `ThemeProvider`, React UI derives its own spacing levels from the
Theme's concrete default spacing:

```tsx
<Flex gap="small">...</Flex>
<Grid gap="large">...</Grid>
```

Structures that own native spacing pass the explicit Theme value to the
general React SDK hook instead:

```tsx
import { useScale } from "@phreshos/react"

const spacing = useScale(theme.spacing)

<section style={{ gap: spacing.large }} />
```

Explicit values such as `4rem` are used directly — passing them through a
Theme hook would perform no additional work.

`Surface` is temporarily running as a div-only diagnostic. It renders exactly
one native `<div>` and creates no canvas, renderer, animation loop, or graphics
context:

```tsx
<Surface className="grid rounded-xl shadow-lg">
  ...
</Surface>

<Surface color="strong" grain="large">...</Surface>
<Surface color="#101114" grain={0.2} animation={8} backdrop={4} opacity={0.9}>...</Surface>
```

The canvas-specific `color`, `grain`, `animation`, and `opacity` properties are
accepted and consumed so existing callers remain valid, but they currently do
nothing and never reach the DOM. Radius and foreground remain ordinary Theme
styles. Backdrop remains a div-owned CSS effect and emits no filter property
when its resolved value is zero.

The Theme stores unrestricted CSS background, foreground, and accent sources.
Core derives the fixed `subtle`, `soft`, `base`, `strong`, and `intense`
treatments from any supplied color, preserving the value exactly at `base`.
`useColor(value)` in the React SDK memoizes that calculation without
implicitly choosing a Theme property. CSS performs the nearby mixing in
OKLCH, so React UI does not own or persist a parallel palette of its own:

```tsx
import { useColor } from "@phreshos/react"

const colors = useColor(theme.accent)

<strong style={{ color: colors.strong }} />
```

`GlassSurface` is the shared translucent material. The Theme supplies its
background, foreground, and concrete default values for distortion, blur,
saturation, brightness, and material opacity. The component derives its tint
from the background and applies the foreground to its content, while accent
remains independent for emphasis and interaction. The surface may also derive
a small or large treatment from each numeric default without turning those
levels into system state.

Derived opacity is capped at thirty percent and never fades the surface's
content. Layout, spacing, radius, and external elevation remain ordinary
container concerns:

```tsx
<GlassSurface className="rounded-xl p-3">
  ...
</GlassSurface>

<GlassSurface color="soft" distortion="large" blur="small" opacity="medium">
  ...
</GlassSurface>
```

Shape-owning components accept the shared `Radius` value directly. Semantic
levels are derived from the Theme's concrete radius through the same
`scale()` rule used for spacing, while numbers and CSS values remain explicit
overrides:

```tsx
<GlassSurface radius="large">...</GlassSurface>
<GlassSurface radius="2rem">...</GlassSurface>
```

Structures whose native element owns the shape derive from the explicit
radius value through the same general React SDK hook:

```tsx
import { useScale } from "@phreshos/react"

const radius = useScale(theme.radius)

<section style={{ borderRadius: radius.large }} />
```

`Button` is the library's first interactive primitive. Its translucent
control treatment matches the desktop's Start and sign-out controls, letting
the surrounding Theme material remain visible. It derives spacing and radius
from the Theme while keeping a single activation path across pointer, Enter,
and Space input:

```tsx
<Button onPress={save}>Save</Button>
<Button size="large" pending>Saving</Button>
<Button disabled>Unavailable</Button>
```

Pending Buttons remain focusable but cannot activate. Disabled Buttons leave
the focus order entirely. The native element defaults to `type="button"`, so
placing it inside a form never triggers an accidental submission.

`ThemeProvider` accepts a plain `ThemeProperties` snapshot, such as Core's
`standardTheme`, so the library remains usable without either environment SDK.
A Program can adapt its
observable Host value at the application boundary:

```tsx
import { HostProvider, useHostTheme } from "@phreshos/react"
import { ThemeProvider } from "@phreshos/react-ui"

function ThemedApplication({ children }) {
  const theme = useHostTheme()

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

<HostProvider provide={["theme"]} fallback={null}>
  <ThemedApplication>{children}</ThemedApplication>
</HostProvider>
```

## Standing requirements

- Components preserve one recognizable visual identity.
- Props that select a semantic treatment accept only the values documented by
  that component. Explicit native styles and supported CSS spacing, radius,
  and color values remain available where the component contract allows them.
- `ThemeProvider` requires an explicit `theme` prop; it never discovers an
  environment SDK or silently selects a global theme.
- The provider applies a replacement `theme` value immediately to its
  descendants.
- Providers are scoped and nestable. The nearest `ThemeProvider` supplies the
  complete theme for its descendants without affecting its parent or
  siblings.
- Accessibility, keyboard behavior, focus, and form behavior are contractual.
- Components must work inside structurally isolated Program iframes.
- Public types and JSDoc are part of the product.

## Development

```bash
bun install --frozen-lockfile
bun run verify
```

`verify` type-checks the source and tests, runs the behavior suite, rebuilds the
package, packs the publication artifact, installs it into a temporary consumer,
and checks its runtime, TypeScript, and public subpath entry points.

`Button` is the only interactive component currently exported. Private
acceptance suites also compare Field, Select, Dialog, and Context Menu
candidates against the same implementation-independent behaviors; those
candidates are not part of the package's public surface. Field covers labeling,
descriptions, validation, native states, and value changes. Select covers
collections, keyboard input, disabled options, form submission, and cleanup.
Dialog covers modal semantics, focus, dismissal, nesting, state changes, and
cleanup. Context Menu covers invocation, focus, actions, disabled items,
dismissal, and cleanup.
