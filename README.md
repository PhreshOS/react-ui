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
follow the browser's visual preferences. `UIProvider` supplies the Appearance,
Preferences, and direction explicitly established for a subtree. Each omitted
property inherits independently from the nearest provider. A provider with no
properties introduces no boundary or behavior. A complete System Appearance can
be passed directly; React UI uses its visual fields and ignores the rest.

React UI is neutral between left-to-right and right-to-left interfaces. An
explicit `UIProvider` direction creates a boundary that participates in native
DOM inheritance without creating a layout box. When direction is omitted, React
UI follows `<html dir>` for JavaScript behavior and portals.

```tsx
<UIProvider direction="rtl" preferences={{ theme: "dark" }}>
  <Application />
</UIProvider>
```

## Visual model

Every component is built from one primitive, `Surface`, and one Material. A
Surface is where the Material sits relative to its surroundings:

| Depth | Meaning | Treatment |
| --- | --- | --- |
| `raised` (default) | Something you act on | A lit rim with a slight inward spill, and the outer Appearance shadow |
| `flat` | A region level with its surroundings | A softer rim |
| `recessed` | Something that holds a value you enter | A slightly deeper paint and a dim rim |

Every Surface shares one Material edge: its rim catches the same light along
its top and bottom, so neither edge reads as a bevel, and only faintly along
its sides, and a very thin dark hairline
separates it from whatever it sits on. Buttons, selected tabs, thumbs, windows,
and overlays rise. Text fields, tracks, rails, and wells recess. How deep a
recess sinks and how much light the rim receives follow the lightness of the
canvas continuously, so every canvas receives a matching treatment.

```tsx
<Surface>Raised</Surface>
<Surface depth="flat">Level</Surface>
<Surface depth="recessed">Holds a value</Surface>
```

`Surface` renders a `div` by default; `as` selects another element or
component. A host applies the `className`, `style`, and `children` it receives
on one element and forwards its ref to it. Consumer classes and styles always
take precedence over Surface's own paint.

### Color

`color` accepts an Appearance color (`primary`), an Appearance color at one
level (`primary:soft`), or a direct CSS color. Levels move a color toward the
canvas (`subtle`, `soft`) or toward the content color (`strong`, `intense`), so
each level keeps its meaning in both Themes.

`default` is a neutral paint close to the canvas; `primary` is the identity
color. A component's omitted color follows its meaning: neutral controls use
`default`, fields recess the `background`, and selection, progress, and on-states
use `primary`. Every owned paint remains customizable through `color`.

Content on a paint uses whichever Appearance content color reads more clearly
on its resting paint, by perceived lightness contrast. Hover and press move the same base toward the content color; a pressed
raised Surface settles onto its surroundings. Focus rings in the owner's color,
or the identity color when the owner is neutral. A focused or invalid value
holder also claims its hairline. There are no separate state colors.

### Material

`MaterialOptions` defines `opacity`, `backdrop`, `grain`, `grainAmount`,
`distortion`, and `saturation`. Every Surface-based component accepts them
through `material`. Rendering is progressive: `none` paints the resolved color
only; `basic` (default) adds grain and the edge while remaining solid;
`extended` applies Material opacity; `full` adds backdrop, saturation, and
distortion. A `MaterialOptions` object selects full rendering with those
overrides. Backdrop effects are omitted whenever the final paint is opaque.

`shadow` groups `x`, `y`, `blur`, `spread`, and `opacity` for raised Surfaces;
`false` removes it.

### Radius

`radius` accepts a size level, `full`, pixels, or CSS. Two rules derive every
default from the Appearance radius:

1. Every Surface carries the Appearance radius. Shells and containers such as
   Window, Panel and its content, Dialog, and Popover carry it as it is. A
   control scales it with its height, so the medium control height carries it
   exactly and every size keeps the same shape, wherever it sits: list Items and
   the selected Tab are controls.
2. Shapes whose form is their meaning, such as Radio, Switch, Slider, progress
   rails, and scrollbar thumbs, stay fully rounded.

## Component rules

Three rules hold across the library, so learning a few components teaches the
rest.

1. **Everything that owns a paint** accepts `color`, `size`, `radius`,
   `material`, `disabled`, `className`, and `style`.
2. **Everything that holds a value is a field**: `label`, `description`,
   `errorMessage`, `invalid`, `required`, `readOnly`, and `value`,
   `defaultValue`, `onChange(value)`.
3. **Every collection is composed of Items** identified by a string `id`:
   Select, ComboBox, ListBox, Menu, Tabs, Table, Tree, and Accordion. Actions
   report that identity through `onAction(id)`, and an Item is unavailable
   through its own `disabled`.

```tsx
<Button color="primary" onPress={install}>Install</Button>

<Input label="Name" value={name} onChange={setName} />

<Select label="Program" value={program} onChange={setProgram}>
  <Select.Item id="tilo">Tilo</Select.Item>
  <Select.Item id="lemo">Lemo</Select.Item>
</Select>
```

`size` accepts `xsmall`, `small`, `medium` (default), `large`, or `xlarge`.
Spacing and radius follow Appearance; typography is inherited and applied once
at each component's root. `disabled` prevents activation and focus; `pending`
prevents activation while retaining focus.

Component families use one public path: the family name is the root and parts
that depend on it are its properties, such as `Panel.Header` and
`Dialog.Title`.

`Panel` is a frosted shell with an optional header and one content region. The
content takes the shell's color, raised with the `extended` material and the
same Appearance radius, sits half the spacing inside the shell, and pads its
content by the spacing. The header is the same row as a Window header.

```tsx
<Panel>
  <Panel.Header>Connection</Panel.Header>
  <Panel.Content style={{ padding: 12 }}>Connected to the local System.</Panel.Content>
</Panel>
```

`Window` provides one Surface with a ready header-and-content layout.
`Window.Header.Identity` presents the icon and truncating title,
`Window.Header.Center` is optional flexible space, and `Window.Header.Actions`
aligns compact controls at the end. `Window.Content` fills the remaining area
without deciding its overflow. Its controls are Buttons; callers connect them to
their own window operations, and `beginMoveGesture` hands an intentional header
drag to a window host.

```tsx
<Window>
  <Window.Header active={active}>
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
      <Menu.Item id="open" onAction={open}>Open</Menu.Item>
      <Menu.Item id="delete" onAction={remove}>Delete</Menu.Item>
    </Menu>
  </DropdownMenu.Content>
</DropdownMenu>
```

`Popover` presents anchored non-modal content. `DropdownMenu` and
`ContextMenu` open the same `Menu` contract through different interactions.
Menu is selection-free by default. Selectable menus use the same string
selection contract as the other collections, and root-level command dispatch
uses `onAction(id)`.
`Dialog` blocks interaction behind it and may be dismissable, while
`AlertDialog` requires an explicit decision by default. `Tooltip` supplies a
short description on focus or hover. Portal cleanup, focus restoration,
keyboard behavior, nested ownership, and entrance and exit transactions remain
component-owned.

## Inputs

Text fields, Select, ComboBox, and the date fields recess the `background` by
default. Checkbox, Switch, and RadioGroup indicators are recessed beds that rise
in their color when selected. Slider and ProgressBar fill a recessed rail with
their color. Motion follows `appearance.transaction`; Preferences with
animations disabled make every change immediate without changing Appearance.

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
| `Select` | `value: string \| null`, `defaultValue`, `onChange(string \| null)` | One choice from its `Select.Item`s |
| `ComboBox` | Selected `value: string \| null` and query `inputValue: string` | One searchable choice from its `ComboBox.Item`s |
| `ListBox` | Single string or multiple string-array `value`, `defaultValue`, and `onChange` | A visible selectable collection with composable items and sections |
| `Tree` | Optional selection plus controlled or uncontrolled string-array expansion | Nested hierarchical navigation with arbitrary branch depth |
| `Slider` | `value`, `defaultValue`, `onChange(number)` | One numeric value; `minValue`, `maxValue`, `step`, and `onChangeEnd`; horizontal by default |
| `NumberField` | `value: number \| null`, `defaultValue`, `onChange(number \| null)` | A number typed or stepped within `minValue` and `maxValue`, formatted by `formatOptions` |
| `SegmentedControl` / `SegmentedControl.Item` | `value`, `defaultValue`, `onChange(string)`; Item `id` | One of a few visible options, on the Tabs track |
| `ColorField`, `ColorSlider`, `ColorArea`, `ColorSwatchPicker` | Hex `value: string`, `defaultValue`, `onChange(string)` | A color typed, moved along one or two channels, or chosen from swatches; inside a `ColorPicker` they edit its color |
| `DropZone` / `FileTrigger` | `onDrop(File[])` / `onSelect(File[])` | Files dragged onto an area, or chosen from the system file chooser |

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
<Select label="Sort" name="sort">
  <Select.Item id="name">Name</Select.Item>
  <Select.Item id="date">Date</Select.Item>
</Select>
<ComboBox label="Region" name="region">
  <ComboBox.Item id="eu">Europe</ComboBox.Item>
  <ComboBox.Item id="us">United States</ComboBox.Item>
</ComboBox>
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
accessible behavioral primitive rather than recreating those systems.

## Tabs

`Tabs` organizes related peer views under one selected string identity. Its
list is a recessed track divided into equal columns, and the selected Tab rises
out of it, moving continuously between selections.

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
    <Table.Column id="name" rowHeader sortable>Name</Table.Column>
    <Table.Column id="state" sortable>State</Table.Column>
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
value. It fills a recessed rail with `primary` unless `color` says otherwise.

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
