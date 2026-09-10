# `@phreshos/react-ui`

Environment-neutral React components and the visual language of PhreshOS.

[Appearance](https://docs.phreshos.com/system/appearance) ·
[React SDK](https://docs.phreshos.com/sdks/react) ·
[Source](https://github.com/PhreshOS/react-ui)

## Role

React UI interprets Core Appearance and Theme contracts as reusable visual
primitives. The Desktop and Programs compose those primitives instead of
reimplementing material, spacing, color, radius, or interaction behavior.

The package does not depend on a Client or Server runtime and does not own
authoritative application state. React owns runtime-neutral state adaptation;
applications own composition.

## Installation

| Package manager | Command |
| --- | --- |
| npm | `npm install @phreshos/react-ui` |
| pnpm | `pnpm add @phreshos/react-ui` |
| Bun | `bun add @phreshos/react-ui` |
| Yarn | `yarn add @phreshos/react-ui` |

Core is a built-in runtime dependency. React and React DOM remain peer
dependencies because the application and React UI must share one React
runtime.

```tsx
import { Button, Surface } from "@phreshos/react-ui"

<Surface>
  <Button>Continue</Button>
</Surface>
```

Without a provider, components use Core's `defaultAppearance` and reactively
follow the browser color scheme. `AppearanceProvider` independently overrides
either value for a subtree; omitted values inherit from the nearest provider.
React UI also exports that same canonical `defaultAppearance` value for callers
that need it explicitly.
See [Appearance](https://docs.phreshos.com/system/appearance) for the contract
interpreted by the provider and components.

```tsx
import { AppearanceProvider, Button } from "@phreshos/react-ui"

<AppearanceProvider theme="dark">
  <Button>Dark subtree</Button>
</AppearanceProvider>
```

`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, and `Radio`
use the shared Material through Surface while retaining their own colors. Omit `color` for
a neutral shade of Appearance's background, or select `primary`, `secondary`,
`success`, `warning`, `danger`, or `info` for a semantic color.
Solid controls use the `base` color level, without mixing it with white or black.
Hover and press derive shades of that fill. The resting fill chooses the
higher-contrast text from Appearance's background and foreground once; interaction
shades keep that choice.
`size` accepts `xsmall`, `small`, `medium` (default), `large`, or `xlarge`;
spacing and radius follow Appearance. `disabled` prevents activation and focus;
`pending` prevents activation while retaining focus.

```tsx
<Button>Cancel</Button>
<Button color="primary" onPress={save}>Save</Button>
<Button color="danger" size="small">Delete</Button>
```

`Material` is the raw visual substance: paint, opacity, frost, refraction, and
grain. It fills the geometry of its nearest positioned container,
inherits that container's radius, and adds no content, layout, interaction, or
shadow. The container must establish its own geometry and isolation.

```tsx
<div style={{ position: "relative", isolation: "isolate", width: 240, height: 120, borderRadius: 18 }}>
  <Material color="soft" />
</div>
```

`Surface` is the standard geometric host for a `Material`. It establishes the
required positioning and isolation, resolves radius, renders the Material, and
then renders its content. It never creates or consumes a shadow. Shadow remains
an independent visual concern. `color` accepts a background level
(`subtle`, `soft`, `base`, `strong`, `intense`) derived from Appearance's background,
or a direct CSS color. `radius` accepts a size level, a number in pixels, or a
CSS radius. Defaults are `color="base"` and `radius="medium"`.

```tsx
<Surface color="soft" radius="large">Derived values</Surface>
<Surface color="#345678" radius={18}>Direct values</Surface>
<Surface as="button" type="button">Native button Surface</Surface>
```

`MaterialProps` defines `color`, `opacity`, `backdrop`, `grain`, `grainAmount`,
`distortion`, and `saturation`. `SurfaceOptions` composes that complete contract
with `radius`; Material never depends on Surface or host geometry. Omitted values
follow the current Appearance. Effect
options accept a scale level or a direct number; opacity affects material only,
never the host's children. Surface's glass edge reads the resolved material and
foreground colors.

`as` selects the native non-void HTML host and preserves its correlated native
properties and ref type. For example, `as="button"` accepts button properties
and targets an `HTMLButtonElement` ref. Void elements cannot be Surface hosts
because they cannot contain Material and content. Inputs therefore use a
Surface container around the native input.

Radius belongs to host geometry, while Surface's border belongs to its geometric
boundary. Material may determine the border treatment, but it neither owns nor
renders that border.

Material-bearing controls accept `surface?: SurfaceOptions`. Explicit options
override their material defaults without changing their native behavior or
content color. Unspecified values preserve the control's own color and radius.
For text fields and Select, the options target the field/trigger material; for
Checkbox, Switch, and Radio, they target the indicator. RadioGroup supplies
defaults to its options, and a Radio can provide its own `surface` value.

```tsx
<Button color="primary" surface={{ opacity: 0.6, backdrop: 0 }}>Save</Button>
<Input label="Name" surface={{ radius: "large" }} />
```

`Panel` composes an outer `Surface`, an optional header, and an inset content
`Surface`. Both materials retain Surface defaults; the content inset follows
Appearance spacing. Positioning, modality, and lifecycle belong to the caller.

```tsx
import { Panel } from "@phreshos/react-ui"

<Panel header={<h2>Title</h2>} contentProps={{ style: { padding: 16 } }}>
  Content
</Panel>
```

Native properties and the forwarded ref target the outer Surface.
`contentProps` targets the inner Surface; `children` supplies its content.

## Inputs

Every input uses Appearance colors and the same five `size` levels as Button.
`color` selects the semantic fill. Input, Textarea, and Select remain
neutral when it is omitted; selection controls default to `primary`. Invalid
fields use danger instead. Text fields share Surface's glass edge. Interaction shades
derive from the base color's lightness, and text or selection marks use whichever
Appearance background or foreground has higher contrast against the base fill.
That text or mark color stays unchanged across interaction shades.
These are component-owned derivations, not additional Appearance settings.
Theme names never imply particular colors. No component requires a Client or
Server SDK.

Fields distinguish hover, pointer focus, keyboard focus, and invalid state.
Shared CSS transitions use a fixed 120ms ease-out timing for colors and corner
radius. Material fill and opacity transition on the painted layers, not on the
Surface host. Select menus combine a small placement-aware slide with an overlay
opacity fade for entry and exit, using React Aria's animation lifecycle. Reduced-motion preferences make
these changes immediate. No Appearance configuration is added for motion yet.
Blur, distortion, geometry, and Surface host opacity are not transitioned; gradients
and structurally removed effects change directly rather than adding extra
layers or keeping disabled effects alive.

Motion animates toggle presses, selection marks, switch travel, the Select
chevron, and Slider thumb feedback. Reduced-motion preferences remove spatial
feedback and make state transitions immediate. Slider values and native input
behavior are never delayed by visual animation.

| Component | Value contract | Purpose |
| --- | --- | --- |
| `Input` | `value`, `defaultValue`, `onChange(string)` | Single-line text; supports text, email, password, search, URL, and telephone types |
| `Textarea` | `value`, `defaultValue`, `onChange(string)` | Multiline text; four rows by default, vertically resizable |
| `Checkbox` | `checked`, `defaultChecked`, `onChange(boolean)` | Independent selection; `indeterminate` represents a mixed state |
| `Switch` | `checked`, `defaultChecked`, `onChange(boolean)` | An on/off setting |
| `RadioGroup` / `Radio` | Group `value`, `defaultValue`, `onChange(string)`; Radio `value` | One exclusive choice; vertical by default, optionally horizontal |
| `Select` | `value: string \| null`, `defaultValue`, `onChange(string \| null)` | One choice from `options: { value, label, disabled? }[]` |
| `Slider` | `value`, `defaultValue`, `onChange(number)` | One numeric value; `minValue`, `maxValue`, `step`, and `onChangeEnd`; horizontal by default |

Use `label` for visible labels, or `aria-label` / `aria-labelledby` for an
accessible name without visible text. `description` provides associated help.
`disabled` prevents interaction and removes the control from keyboard focus.
`name` participates in native form submission. Controlled values remain owned
by the caller; omit them and use defaults for internal state and form reset.

Text fields, Checkbox, Switch, and RadioGroup also support `readOnly`: the
value cannot change, but the control remains focusable. These fields and
Select support `required`, `invalid`, `errorMessage`, and React Aria's native
or ARIA validation behavior. A Radio's selection and validation belong to its
group. Slider represents a bounded number rather than a required text or
choice field, and has no read-only or validation-error mode. Select has no
read-only mode; disable it when selection must be unavailable.

`Input`, `Textarea`, and `Select` accept `radius`. Other inputs retain their
intrinsic indicator shapes. `className` and `style` address the field's root;
default visual properties remain component-owned. Input and Textarea refs
target their native text controls; other refs target the root div. Checkbox,
Switch, and Radio additionally accept `inputRef` for their native input.

```tsx
import { Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider } from "@phreshos/react-ui"

<Input label="Name" name="name" required />
<Textarea label="Description" name="description" />
<Checkbox label="Remember this choice" name="remember" />
<Switch label="Notifications" name="notifications" defaultChecked />
<RadioGroup label="Layout" name="layout" defaultValue="grid">
  <Radio label="Grid" value="grid" />
  <Radio label="List" value="list" />
</RadioGroup>
<Select label="Sort" name="sort" options={[
  { value: "name", label: "Name" },
  { value: "date", label: "Date" }
]} />
<Slider label="Volume" name="volume" defaultValue={50} minValue={0} maxValue={100} step={1} />
```

React Aria owns focus, keyboard, form, and selection behavior. Select's popup
uses Surface defaults. Toggle indicators use Motion internally and respect
reduced-motion preferences. The preview Program demonstrates each input's
sizes, colors, state, and interaction without overriding its visual defaults.

## Development

```sh
bun install --frozen-lockfile
bun run verify
```

`verify` checks the contracts, tests the components, builds the package, and
validates its published shape.

## Related repositories

- [`@phreshos/core`](https://github.com/PhreshOS/core) owns Appearance, Theme,
  and the shared values interpreted here.
- [`@phreshos/react`](https://github.com/PhreshOS/react) owns runtime-neutral
  React state adaptation.
- [PhreshOS System](https://github.com/PhreshOS/system) composes the visual
  language into the Desktop.
- [Settings](https://github.com/PhreshOS/settings-program) presents owner-facing
  Appearance controls.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository workflow and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

Licensed under the [MIT License](LICENSE). Copyright © 2026 Zohayr SLILEH.
