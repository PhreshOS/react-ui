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

Structures that own native spacing pass the explicit Theme value to React UI's
general derivation hook:

```tsx
import { useScale } from "@phreshos/react-ui"

const spacing = useScale(theme.spacing)

<section style={{ gap: spacing.large }} />
```

Explicit values such as `4rem` are used directly — passing them through a
Theme hook would perform no additional work.

`Surface` keeps a native `<div>` as its public container and gives every
instance one locally owned pure-SVG material plus only the backdrop layers its
settings enable. The material uses a deterministic 64×64 micro-pattern derived
from the former shader grain; it creates no canvas, WebGL context, or shared
texture:

```tsx
<Surface className="grid rounded-xl shadow-lg">
  ...
</Surface>

<Surface color="strong" grain="large">...</Surface>
<Surface color="#101114" grain={0.2} backdrop={4} opacity={0.9}>...</Surface>
<Surface distortion={70} waves={8} ripples={4} saturation={1.4} brightness={1.04}>...</Surface>
```

`color` resolves from `Theme.background`; its semantic levels derive from that
same source and a direct color remains an explicit local override. `grain`,
`grainAmount`, `backdrop`, `opacity`, `distortion`, `waves`,
`ripples`, `saturation`, and `brightness` resolve from `Theme.surface`, accept
their semantic levels or direct values, and remain bounded by Core's Theme
limits. Radius and foreground remain ordinary Theme styles. Grain intensity
controls tonal distance while grain amount controls retained cell density.
Each Surface owns one uniform one-pixel inset edge derived from its resolved
material color; consumers supply only their radius and do not redraw the edge.
When either is zero, Surface creates no grain pattern or paths. Refraction and
native frost use independent backdrop layers so blur does not soften the
displaced image. Enabled organic, wave, and ripple fields are combined
mathematically before one displacement pass; each zero-valued field is absent,
and the filter and refraction layer are absent when all three are zero.
Backdrop blur emits no CSS function at zero. Neutral saturation and brightness
at one are also omitted. Animation defaults to zero; only a Surface with
visible grain and a positive rate joins the internal document clock, while
every texture and seed remains local to its own Surface.

The Theme stores unrestricted CSS background, foreground, and accent sources.
React UI derives the fixed `subtle`, `soft`, `base`, `strong`, and `intense`
treatments from any supplied color, preserving the value exactly at `base`.
`useColor(value)` memoizes that calculation without implicitly choosing a
Theme property. CSS performs the nearby mixing in OKLCH, and the System retains
only the concrete Theme color:

```tsx
import { useColor } from "@phreshos/react-ui"

const colors = useColor(theme.accent)

<strong style={{ color: colors.strong }} />
```

Shape-owning components accept the shared `Radius` value directly. Semantic
levels are derived from the Theme's concrete radius through the same
`scale()` rule used for spacing, while numbers and CSS values remain explicit
overrides:

```tsx
<Button radius="large">...</Button>
<Button radius="2rem">...</Button>
```

Structures whose native element owns the shape derive from the explicit
radius value through the same React UI hook:

```tsx
import { useScale } from "@phreshos/react-ui"

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
