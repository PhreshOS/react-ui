# `@phreshos/react-ui`

Environment-neutral React components and the visual language of PhreshOS.

[Appearance](https://docs.phreshos.com/system/appearance) ·
[React SDK](https://docs.phreshos.com/sdks/react) ·
[Source](https://github.com/PhreshOS/react-ui)

## Role

React UI owns reusable visual contracts that accept the corresponding PhreshOS
System values directly. The Desktop and Programs compose those primitives instead of
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

React and React DOM are peer dependencies because the application and React UI
must share one React runtime.

```tsx
import { Button, Surface } from "@phreshos/react-ui"

<Surface>
  <Button>Continue</Button>
</Surface>
```

Without a provider, components use React UI's `defaultAppearance` and reactively
follow the browser's complete visual preferences. `UIProvider` supplies the
Appearance, Preferences, and direction explicitly established for a React UI
subtree. Each omitted property inherits independently from the nearest provider
or follows its own default resolution. A provider with no properties introduces
no boundary or behavior.
React UI also exports `defaultAppearance` for callers that need the value
explicitly. A complete System Appearance can be passed directly; React UI uses
the visual fields it owns and ignores additional System fields such as
wallpapers.

React UI is neutral between left-to-right and right-to-left interfaces.
An explicit `UIProvider` direction creates a boundary that participates in
native DOM inheritance without creating a layout box. When direction is
omitted, the provider leaves DOM inheritance unchanged. React UI reads the
nearest explicit direction—or `<html dir>` when there is none—only for
JavaScript behavior and portals that cannot rely on native inheritance.

```tsx
import { UIProvider, Select } from "@phreshos/react-ui"

<UIProvider direction="rtl">
  <Select label="Choice" options={[{ value: "one", label: "One" }]} />
</UIProvider>
```

```tsx
import { UIProvider, Button, useBrowserPreferences } from "@phreshos/react-ui"

function Example() {
  const browser = useBrowserPreferences()

  return <UIProvider preferences={{ ...browser, theme: "dark" }}>
    <Button>Dark subtree</Button>
  </UIProvider>
}
```

`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, and `RadioGroup.Item`
use the shared Surface implementation while retaining their native behavior. Color and material
are independent inputs. `color` accepts an Appearance color and resting level such
as `background:base` or `primary:soft`, or a direct CSS color. Surface defaults
to `background:base`; solid controls default to `default:base`.
Every independently owned base paint is exposed through its component's
`color` prop. Hover, press, focus, selection, and inactive treatments derive
from that base rather than introducing separate color inputs. Surface and solid controls compare
the fill with an adaptive perceptual boundary biased toward lighter text, then
use the Appearance candidate on the opposite side; interaction shades keep that
choice.
The omitted value follows the component's meaning: neutral controls use
`default:base`, while a role with inherent visual meaning may choose another
Appearance color. Every semantic default remains overridable through `color`.
`size` accepts `xsmall`, `small`, `medium` (default), `large`, or `xlarge`;
spacing and radius follow Appearance, while typography remains inherited and
component sizes are relative to the surrounding text. `disabled` prevents activation and focus;
`pending` prevents activation while retaining focus.

```tsx
<Button>Cancel</Button>
<Button color="primary:base" onPress={save}>Save</Button>
<Button color="danger:soft" size="small">Delete</Button>
```

`Surface` is the material- and shadow-owning element. It renders a `div` by default, while
`as` selects another React element and preserves that element's native properties
and ref type. Surface owns its paint, opacity, frost, refraction, grain, edge,
outer shadow, and radius. `radius` accepts a size level, `full`, a
number in pixels, or a CSS radius and defaults to `medium`.

```tsx
<Surface color="background:soft" radius="large">Derived values</Surface>
<Surface as="button" type="button" color="#345678" radius={18}>Action</Surface>
<Surface as={Grid} columns={3} gap="medium">Grid content</Surface>
```

`as` can also select an outside React component. A valid Surface host preserves
the `style`, `dir`, and `children` it receives on one host element and forwards
its ref to that same element. This lets layout components carry the material
without a wrapper. The host retains ownership of its own behavior and layout
properties; Surface retains ownership of material, edge, shadow, radius, and
required geometry.

`MaterialOptions` defines `opacity`, `backdrop`, `grain`, `grainAmount`,
`distortion`, and `saturation`. Every material-bearing component, including
Surface, exposes these values through its `material` prop. Color remains a
separate property. Omission uses the resource-efficient `basic` rendering mode.
`none` ignores Material and paints the resolved color as a normal background;
`basic` adds Material paint, grain, and its edge while remaining solid, with
Material opacity applied only to the grain; `extended` applies that opacity to
the complete Material instead; and `full` adds backdrop, distortion, and
saturation. A `MaterialOptions` object selects full rendering with those
overrides. Effect options accept a scale level or a direct number; opacity
affects Surface paint only, never its content. The material edge is part of the
same Surface rather than a second public entity.

The modes are progressive: each level preserves the rendering of the previous
one and adds only its own Material capability.

Surface-based controls expose the same separate `color` and `material` props.
`ShadowOptions` similarly groups `x`, `y`, `blur`, `spread`, and `opacity` under
the `shadow` prop. Omission or `true` follows the active `appearance.shadow`
branch, while `false` removes the shadow. Each option accepts a scale level or
direct number. The shadow is a neutral black
outer shadow. Surface-based controls expose the same `shadow` prop.
For text fields and Select, `material` targets the field or trigger; for Checkbox,
Switch, and RadioGroup.Item, it targets the indicator. RadioGroup supplies material defaults
to its options, and an Item can override them. Shadow follows the same targets and
inheritance path.

```tsx
<Button color="primary:base" material="full">Save</Button>
<Surface material={{ opacity: 0.6, backdrop: 0 }}>Translucent</Surface>
<Input label="Name" radius="large" material={{ grain: "small" }} shadow={{ blur: "small" }} />
```

`Panel` composes an outer `Surface`, an optional header, and an inset content
`Surface`. Both materials retain Surface defaults; the content inset follows
Appearance spacing. Positioning, modality, and lifecycle belong to the caller.

Component families use one public path: the family name is the root and parts
that depend on it are properties of that family. For example, use
`Panel.Header` and `Dialog.Title`; those parts are not separate top-level
components. Components with independent contracts remain top-level exports.

```tsx
import { Panel } from "@phreshos/react-ui"

<Panel>
  <Panel.Header><h2>Title</h2></Panel.Header>
  <Panel.Content style={{ padding: 16 }}>Content</Panel.Content>
</Panel>
```

Native properties and the root ref target the outer Surface. `Panel.Header`
owns the optional leading region, while `Panel.Content` is the independently
configurable inner Surface.

`Window` provides one Surface with a ready header-and-content layout.
`Window.Header.Identity` presents the icon and truncating title,
`Window.Header.Center` is optional flexible space, and
`Window.Header.Actions` aligns compact controls at the end. `Window.Content`
fills the remaining area without deciding its overflow behavior. The header
uses the enclosing Surface rather than creating another material layer, and it
can also be composed independently inside any Surface. Its controls are React
UI Buttons; callers connect them to their own window operations. Pointer and
double-click handlers on the header can implement a drag area, while the center
and actions keep their interactions separate.

```tsx
<Window>
  <Window.Header active={active} onPointerDown={beginDrag}>
    <Window.Header.Identity icon={icon} title={title} />
    <Window.Header.Actions>
      <Window.Header.Minimize onPress={minimize} />
      <Window.Header.Maximize maximized={maximized} onPress={toggleMaximize} />
      <Window.Header.Close onPress={close} />
    </Window.Header.Actions>
  </Window.Header>
  <Window.Content>{children}</Window.Content>
</Window>
```

## Overlays

Overlay components expose each behavioral role as a named part. Roots own open
state, triggers own activation, positioned content owns its Surface, and the
semantic content remains explicit.

```tsx
<DropdownMenu>
  <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <Menu aria-label="Document actions">
      <Menu.Item onAction={open}>Open</Menu.Item>
      <Menu.Item color="danger:base" onAction={remove}>Delete</Menu.Item>
    </Menu>
  </DropdownMenu.Content>
</DropdownMenu>
```

`Popover` presents anchored non-modal content. `DropdownMenu` and
`ContextMenu` open the same `Menu` contract through different interactions.
Menu is selection-free by default. Selectable menus use string identities
through `value`, `defaultValue`, `onChange`, and `disabledValues`, matching the
other selectable collections; root-level command dispatch uses `onItemAction`.
`Dialog` blocks interaction behind it and may be dismissable, while
`AlertDialog` requires an explicit decision by default. `Tooltip` supplies a
short description on focus or hover. Portal cleanup, focus restoration,
keyboard behavior, nested ownership, and entrance and exit transactions remain
component-owned.

## Inputs

Every input uses Appearance colors and the same five `size` levels as Button.
`color` selects the fill independently from material. Input, Textarea, Select,
and Button use `default:base` when it is omitted. Invalid
fields use danger instead. Text fields share Surface's glass edge. Interaction shades
derive from the base color's lightness, and text or selection marks use the Appearance
background or foreground that is perceptually opposite the base fill.
That text or mark color stays unchanged across interaction shades.
These are component-owned derivations, not additional Appearance settings.
Theme names never imply particular colors. No component requires a Client or
Server SDK.

Fields distinguish hover, pointer focus, keyboard focus, and invalid state.
Shared CSS transitions use `appearance.transaction` for colors and corner
radius. The material fill and opacity values transition on the painted layers, not on the
Surface host. Select menus scale from `1.05` to `1` while fading in, and reverse
that motion when exiting, using React Aria's animation lifecycle. Preferences with animations disabled make
these changes immediate without changing the Appearance value.
Blur, distortion, geometry, and Surface host opacity are not transitioned; gradients
and structurally removed effects change directly rather than adding extra
layers or keeping disabled effects alive.

Motion animates toggle presses, selection marks, and switch travel. CSS transitions
animate paint and the Select chevron. Preferences with animations disabled remove spatial
feedback and make state transitions immediate. Slider values and native input
behavior are never delayed by visual animation.

| Component | Value contract | Purpose |
| --- | --- | --- |
| `Input` | `value`, `defaultValue`, `onChange(string)` | Single-line text; supports text, email, password, search, URL, and telephone types |
| `Textarea` | `value`, `defaultValue`, `onChange(string)` | Multiline text; four rows by default, vertically resizable |
| `DateField` | `CalendarDate \| null` through `value`, `defaultValue`, and `onChange` | A locale-aware date whose year, month, and day are edited as independent segments |
| `TimeField` | `Time \| null` through `value`, `defaultValue`, and `onChange` | A locale-aware clock time whose visible units are edited as independent segments |
| `Calendar` | `CalendarDate \| null` selection | A keyboard-navigable month view for choosing one date |
| `RangeCalendar` | `DateRange \| null` selection | A month view for choosing an inclusive start and end date |
| `DatePicker` | The same `CalendarDate \| null` contract as DateField | Segmented date entry with a calendar selection popover |
| `DateRangePicker` | The same `DateRange \| null` contract as RangeCalendar | Two segmented date fields with a shared range calendar popover |
| `Checkbox` | `checked`, `defaultChecked`, `onChange(boolean)` | Independent selection; `indeterminate` represents a mixed state |
| `Switch` | `checked`, `defaultChecked`, `onChange(boolean)` | An on/off setting |
| `RadioGroup` / `RadioGroup.Item` | Group `value`, `defaultValue`, `onChange(string)`; Item `value` | One exclusive choice; vertical by default, optionally horizontal |
| `Select` | `value: string \| null`, `defaultValue`, `onChange(string \| null)` | One choice from `options: { value, label, disabled? }[]` |
| `ComboBox` | Selected `value: string \| null` and query `inputValue: string` | One searchable choice from `options: { value, label, disabled? }[]` |
| `ListBox` | Single string or multiple string-array `value`, `defaultValue`, and `onChange` | A visible selectable collection with composable items and sections |
| `Tree` | Optional selection plus controlled or uncontrolled string-array expansion | Nested hierarchical navigation with arbitrary branch depth |
| `Slider` | `value`, `defaultValue`, `onChange(number)` | One numeric value; `minValue`, `maxValue`, `step`, and `onChangeEnd`; horizontal by default |

Use `label` for visible labels, or `aria-label` / `aria-labelledby` for an
accessible name without visible text. `description` provides associated help.
`disabled` prevents interaction and removes the control from keyboard focus.
`name` participates in native form submission. Controlled values remain owned
by the caller; omit them and use defaults for internal state and form reset.

Text fields, ComboBox, Checkbox, Switch, and RadioGroup also support `readOnly`: the
value cannot change, but the control remains focusable. These fields and
Select support `required`, `invalid`, `errorMessage`, and React Aria's native
or ARIA validation behavior. A RadioGroup Item's selection and validation belong to its
group. Slider represents a bounded number rather than a required text or
choice field, and has no read-only or validation-error mode. Select has no
read-only mode; disable it when selection must be unavailable.

`Input`, `Textarea`, `DateField`, `TimeField`, `DatePicker`, `DateRangePicker`,
`Calendar`, `RangeCalendar`, `Select`, and `ComboBox` accept `radius`. Other inputs
retain their intrinsic indicator shapes. `className` and `style` address the field's root;
default visual properties remain component-owned. Input and Textarea refs
target their native text controls; other refs target the root div. Checkbox,
Switch, and RadioGroup.Item additionally accept `inputRef` for their native input.

```tsx
import { Input, Textarea, DateField, TimeField, Calendar, RangeCalendar, DatePicker, DateRangePicker, Checkbox, RadioGroup, Switch, Select, ComboBox, ListBox, Tree, Slider } from "@phreshos/react-ui"
import { parseDate, parseTime } from "@internationalized/date"

<Input label="Name" name="name" required />
<Textarea label="Description" name="description" />
<DateField label="Due date" name="dueDate" defaultValue={parseDate("2026-09-21")} />
<TimeField label="Start time" name="startTime" defaultValue={parseTime("09:30")} />
<DatePicker label="Appointment" name="appointment" defaultValue={parseDate("2026-09-21")} />
<Calendar aria-label="Release date" defaultValue={parseDate("2026-09-21")} />
<RangeCalendar aria-label="Trip dates" defaultValue={{ start: parseDate("2026-09-21"), end: parseDate("2026-09-24") }} />
<DateRangePicker label="Trip dates" defaultValue={{ start: parseDate("2026-09-21"), end: parseDate("2026-09-24") }} />
<Checkbox label="Remember this choice" name="remember" />
<Switch label="Notifications" name="notifications" defaultChecked />
<RadioGroup label="Layout" name="layout" defaultValue="grid">
  <RadioGroup.Item label="Grid" value="grid" />
  <RadioGroup.Item label="List" value="list" />
</RadioGroup>
<Select label="Sort" name="sort" options={[
  { value: "name", label: "Name" },
  { value: "date", label: "Date" }
]} />
<ComboBox label="Region" name="region" options={[
  { value: "eu", label: "Europe" },
  { value: "us", label: "United States" }
]} />
<ListBox aria-label="Programs" defaultValue="editor">
  <ListBox.Section id="productivity">
    <ListBox.Header>Productivity</ListBox.Header>
    <ListBox.Item id="editor">Editor</ListBox.Item>
    <ListBox.Item id="terminal">Terminal</ListBox.Item>
  </ListBox.Section>
</ListBox>
<Tree aria-label="Project files" defaultExpanded={["source"]}>
  <Tree.Item id="source" textValue="Source">
    <Tree.Content>Source</Tree.Content>
    <Tree.Item id="main" textValue="main.ts">
      <Tree.Content>main.ts</Tree.Content>
    </Tree.Item>
  </Tree.Item>
</Tree>
<Slider label="Volume" name="volume" defaultValue={50} minValue={0} maxValue={100} step={1} />
```

`ComboBox` filters option labels as the user types. Selection uses `value` and
`onChange`; its query is independently controllable through `inputValue` and
`onInputChange`. Use `defaultValue` and `defaultInputValue` for uncontrolled
state.

`ListBox` uses single selection by default and accepts `selectionMode="multiple"`
for a string array or `"all"`. Its Items require stable string identities.
Sections group options under Headers; they do not introduce expandable hierarchy.
ListBox owns collection layout, selection, focus, keyboard behavior, and item
presentation. An enclosing Surface or ScrollArea remains an explicit consumer
composition.

`Tree` represents hierarchy rather than grouping. Branches may contain other
branches to any depth. Expansion uses `expanded`, `defaultExpanded`, and
`onExpandedChange`, all expressed as string identities. Selection is disabled
by default and uses the same explicit single- or multiple-selection contract as
Table when enabled. `Tree.Content` supplies each row's visible content and its
accessible disclosure control; `Tree.Collection` recursively renders
data-backed child collections.

Each control delegates focus, keyboard, form, and selection behavior to its
accessible behavioral primitive rather than recreating those systems. Select's
popup and ComboBox's searchable popup use Surface defaults. Toggle indicators use Motion internally and respect
animation preferences. The preview Program demonstrates each input's
sizes, colors, state, and interaction without overriding its visual defaults.

## Tabs

`Tabs` organizes related peer views under one selected string identity. Its
horizontal list divides the available width equally, while its active indicator
moves continuously between selections.

```tsx
<Tabs defaultValue="overview">
  <Tabs.List aria-label="Project views">
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="activity">Activity</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">Project overview</Tabs.Panel>
  <Tabs.Panel id="activity">Recent activity</Tabs.Panel>
</Tabs>
```

Each `Tabs.Tab` identity must match one `Tabs.Panel`. Use `Tabs.Panels` when
the panels come from a dynamic collection; static panels may remain direct
children of `Tabs`.

## Table

`Table` presents structured rows and columns with accessible navigation. Row
selection uses the same string-value contract as ListBox, while sorting reports
the requested column and direction without taking ownership of the data order.

```tsx
<Table
  aria-label="Processes"
  selectionMode="multiple"
  value={selectedProcesses}
  onChange={setSelectedProcesses}
  sort={sort}
  onSortChange={setSort}
>
  <Table.Header>
    <Table.Column id="name" isRowHeader allowsSorting>Name</Table.Column>
    <Table.Column id="state" allowsSorting>State</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row id="editor">
      <Table.Cell>Editor</Table.Cell>
      <Table.Cell>Running</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

Selection is disabled by default. Set `selectionMode` to `"single"` or
`"multiple"` to enable it. Sortable columns emit `{ column, direction }`
through `onSortChange`; reorder the rows in application state and pass the
descriptor back through `sort`. `Table.Body` supports static rows, dynamic
`items`, and `renderEmptyState`.

Table owns tabular behavior and row presentation without adding a material
container or scrolling boundary. Compose Surface and ScrollArea around it when
the surrounding interface needs either one.

## ProgressBar

`ProgressBar` communicates the progress of an operation without becoming an
input. Determinate progress exposes its current value and percentage;
indeterminate progress omits the current value and presents ongoing activity.

```tsx
<ProgressBar label="Uploading" value={64} />
<ProgressBar aria-label="Connecting" indeterminate />
```

The default range is `0` through `100`. `formatOptions` controls the generated
value text, while `valueLabel` supplies an explicit visible and accessible
value. Color, size, typography, and motion follow the active React UI contracts.

## Development

```sh
bun install --frozen-lockfile
bun run verify
```

`verify` checks the contracts, tests the components, builds the package, and
validates its published shape.

`check` performs static checks, `build` creates distributable output, and `test`
runs Vitest assertions from `tests/`. Run `build` before testing built artifacts.
`verify` runs `check`, `build`, and `test` in order. Operational tooling belongs
in `scripts/`; tests and their fixtures belong in `tests/`. Verification uses
the committed dependency graph without local package substitutions.

## Related repositories

- [`@phreshos/core`](https://github.com/PhreshOS/core) owns the System contracts.
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
