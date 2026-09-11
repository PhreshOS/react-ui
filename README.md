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
use the shared Surface implementation while retaining their native behavior. Color and material
are independent inputs. `color` accepts an Appearance color and resting level such
as `background:base` or `primary:soft`, or a direct CSS color. Surface and neutral
surface hosts default to `background:base`; a component may select a semantic
default required by its own behavior, such as `primary:base` for selection.
Hover and press derive shades of that fill. The resting fill chooses the
higher-contrast text from Appearance's background and foreground once; interaction
shades keep that choice.
`size` accepts `xsmall`, `small`, `medium` (default), `large`, or `xlarge`;
spacing and radius follow Appearance. `disabled` prevents activation and focus;
`pending` prevents activation while retaining focus.

```tsx
<Button>Cancel</Button>
<Button color="primary:base" onPress={save}>Save</Button>
<Button color="danger:soft" size="small">Delete</Button>
```

`Surface` is the material-owning element. It renders a `div` by default, while
`as` selects another React element and preserves that element's native properties
and ref type. Surface owns its paint, opacity, frost, refraction, grain, edge,
radius, and clipping requirements. It never creates or consumes a shadow; shadow
remains an independent visual concern. `radius` accepts a size level, a number in
pixels, or a CSS radius and defaults to `medium`.

```tsx
<Surface color="background:soft" radius="large">Derived values</Surface>
<Surface as="button" type="button" color="#345678" radius={18}>Action</Surface>
<Surface as={Grid} columns={3} gap="medium">Grid content</Surface>
```

`as` can also select an outside React component. A valid Surface host preserves
the `style` and `children` it receives on one host element and forwards its ref
to that same element. This lets layout components carry the material without a
wrapper. The host retains ownership of its own behavior and layout properties;
Surface retains ownership of material, edge, radius, and required geometry.

`MaterialOptions` defines `opacity`, `backdrop`, `grain`, `grainAmount`,
`distortion`, and `saturation`. Surface accepts these properties directly because
it is the material-owning element; it does not accept a nested `material` prop.
Color remains a separate Surface property. Omitted material values follow
`appearance.material`. Effect options accept a scale level or a direct number;
opacity affects Surface paint only, never its content. The material edge is part
of the same Surface rather than a second public entity.

Surface-based controls expose the same separate `color` and `material` props.
For text fields and Select, `material` targets the field or trigger; for Checkbox,
Switch, and Radio, it targets the indicator. RadioGroup supplies material defaults
to its options, and a Radio can override them.

```tsx
<Button color="primary:base" material={{ opacity: 0.6, backdrop: 0 }}>Save</Button>
<Input label="Name" radius="large" material={{ grain: "small" }} />
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
`color` selects the fill independently from material. Input, Textarea, Select,
and Button use `background:base` when it is omitted; selection indicators use
`primary:base`. Invalid
fields use danger instead. Text fields share Surface's glass edge. Interaction shades
derive from the base color's lightness, and text or selection marks use whichever
Appearance background or foreground has higher contrast against the base fill.
That text or mark color stays unchanged across interaction shades.
These are component-owned derivations, not additional Appearance settings.
Theme names never imply particular colors. No component requires a Client or
Server SDK.

Fields distinguish hover, pointer focus, keyboard focus, and invalid state.
Shared CSS transitions use a fixed 120ms ease-out timing for colors and corner
radius. The material fill and opacity values transition on the painted layers, not on the
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
