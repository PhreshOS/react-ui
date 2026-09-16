// @vitest-environment node
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import manifest from "../package.json" with { type: "json" }
import { test } from "vitest"

test("package contract", async () => {
  const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const temporary = mkdtempSync(join(tmpdir(), "phreshos-react-ui-package-"))
  const cache = join(temporary, "npm-cache")
  const corePackage = `@phreshos/core@${manifest.dependencies["@phreshos/core"]}`

  assert.equal(typeof manifest.dependencies["@phreshos/core"], "string")
  assert.equal(manifest.peerDependencies["@phreshos/core"], undefined)

  try {
    const output = execFileSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", temporary],
      {
        cwd: repository,
        encoding: "utf8",
        env: { ...process.env, npm_config_cache: cache }
      }
    )
    const packed = JSON.parse(output)[0]
    const paths = new Set(packed.files.map(file => file.path))

    assert(paths.has("dist/main.js"), "the package has no JavaScript entry point")
    assert(paths.has("dist/main.d.ts"), "the package has no declaration entry point")
    assert(paths.has("dist/panel.js"), "the package has no Panel implementation")
    assert(paths.has("dist/panel.d.ts"), "the package has no Panel contract")
    for (const name of ["ui-provider", "direction", "input", "textarea", "checkbox", "radio", "switch", "select", "slider", "popover", "menu", "dropdown-menu", "context-menu", "dialog", "alert-dialog", "tooltip"]) {
      assert(paths.has(`dist/${name}.js`), `the package has no ${name} implementation`)
      assert(paths.has(`dist/${name}.d.ts`), `the package has no ${name} contract`)
    }
    assert(paths.has("dist/icons/main.js"), "the package has no JavaScript icons entry point")
    assert(paths.has("dist/icons/main.d.ts"), "the package has no declaration icons entry point")
    assert(paths.has("LICENSE"), "the package has no license")
    assert(paths.has("README.md"), "the package has no README")
    assert(paths.has("package.json"), "the package has no manifest")

    for (const path of paths) {
      assert(
        path === "LICENSE" || path === "README.md" || path === "package.json" || path.startsWith("dist/"),
        `private repository material entered the package: ${path}`
      )
    }

    const consumer = join(temporary, "consumer")
    const archive = join(temporary, packed.filename)

    mkdirSync(consumer)
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ private: true, type: "module" }, null, 2)
    )
    execFileSync(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--no-package-lock",
        archive,
        corePackage,
        "@types/react@^19.2.18",
        "@types/react-dom@^19.2.4"
      ],
      {
        cwd: consumer,
        stdio: "inherit",
        env: { ...process.env, npm_config_cache: cache }
      }
    )

    writeFileSync(
      join(consumer, "runtime.mjs"),
      `import assert from "node:assert/strict"
  import { defaultAppearance as coreDefaultAppearance } from "@phreshos/core"
  import * as icons from "@phreshos/react-ui/icons"
  import {
    AlertDialog, Button, ContextMenu, Dialog, DropdownMenu,
    Flex,
    Grid,
    Menu, Panel, Popover,
    Surface,
    Tooltip,
    Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider,
    UIProvider,
    defaultAppearance,
    resolveRadius,
    resolveSpacing,
    useBrowserPreferences,
    useColor,
    useDirection,
    useDocumentDirection,
    usePreferences,
    useScale
  } from "@phreshos/react-ui"

  for (const exported of [UIProvider, AlertDialog, Button, ContextMenu, Dialog, DropdownMenu, Flex, Grid, Menu, Panel, Popover, Surface, Tooltip, Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider, resolveRadius, resolveSpacing, useBrowserPreferences, useColor, useDirection, useDocumentDirection, usePreferences, useScale]) {
    assert.notEqual(exported, undefined)
  }
  assert.equal(defaultAppearance, coreDefaultAppearance)
  assert.deepEqual(Object.keys(icons), [])
  `
    )
    execFileSync(process.execPath, [join(consumer, "runtime.mjs")], { stdio: "inherit" })

    writeFileSync(
      join(consumer, "consumer.tsx"),
      `import { AlertDialog, UIProvider, Button, ContextMenu, Dialog, DropdownMenu, Flex, Grid, Menu, Panel, Popover, Surface, Tooltip, Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider, defaultAppearance, useBrowserPreferences, useColor, useDirection, useDocumentDirection, usePreferences, useScale, type Preferences } from "@phreshos/react-ui"

  const surface = <Surface as="button" type="button" color="background:soft" material={{ opacity: 0.4 }}>Surface</Surface>
  const standalone = <Button>Default Appearance and browser Preferences</Button>
  const preferences: Preferences = { theme: "dark", animations: true }
  const themed = <UIProvider preferences={preferences}><Surface>Dark subtree</Surface></UIProvider>
  // @ts-expect-error Preferences is one complete value, not a partial override
  const partialPreferences = <UIProvider preferences={{ theme: "dark" }}><Surface /></UIProvider>

  function Derived() {
    const browser = useBrowserPreferences()
    const resolved = usePreferences()
    const spacing = useScale(defaultAppearance.spacing)
    const primary = useColor(defaultAppearance.colors.light.primary)

    return <span style={{ color: primary.base, padding: spacing.small }} data-browser-theme={browser.theme} data-animations={resolved.animations}>Derived</span>
  }

  function Direction() {
    const direction = useDirection()
    return <span data-direction={direction} data-document-direction={useDocumentDirection()} />
  }

  const commands = [{ id: "open", label: "Open" }]

  const view = (
    <UIProvider appearance={defaultAppearance} direction="rtl" preferences={{ theme: "light", animations: true }}>
      <Panel>
        <Panel.Header><h2>Example</h2></Panel.Header>
        <Panel.Content style={{ padding: 12 }}><Grid columns={2} gap="small">
          <Flex align="center" justify="between">
            <Button onPress={() => undefined} material={{ opacity: "large" }}>Save</Button>
            {surface}
            <Surface color="background:soft" radius={12} material={{ backdrop: 8 }}>Surface</Surface>
            <Derived />
            <Input label="Name" onChange={value => value.toUpperCase()} />
            <Textarea label="Notes" rows={3} />
            <Checkbox label="Remember" onChange={value => !value} />
            <Switch label="Enabled" defaultChecked />
            <RadioGroup label="Mode" defaultValue="one"><Radio label="One" value="one" /></RadioGroup>
            <Select label="Choice" options={[{value: "one", label: "One"}]} onChange={value => value?.toUpperCase()} />
            <Slider label="Volume" onChange={value => value.toFixed(0)} />
          </Flex>
        </Grid></Panel.Content>
      </Panel>
      <Popover><Popover.Trigger>Info</Popover.Trigger><Popover.Content><Popover.Dialog aria-label="Info"><Popover.Close>Close</Popover.Close></Popover.Dialog></Popover.Content></Popover>
      <DropdownMenu><DropdownMenu.Trigger>Actions</DropdownMenu.Trigger><DropdownMenu.Content><Menu aria-label="Actions"><Menu.Item>Open</Menu.Item></Menu></DropdownMenu.Content></DropdownMenu>
      <Menu aria-label="Dynamic actions" items={commands}>{command => <Menu.Item id={command.id}>{command.label}</Menu.Item>}</Menu>
      <ContextMenu><ContextMenu.Trigger><button>Target</button></ContextMenu.Trigger><ContextMenu.Content><Menu aria-label="Context actions"><Menu.Item>Open</Menu.Item></Menu></ContextMenu.Content></ContextMenu>
      <Dialog><Dialog.Trigger>Open</Dialog.Trigger><Dialog.Backdrop><Dialog.Content><Dialog.Title>Dialog</Dialog.Title><Dialog.Close>Close</Dialog.Close></Dialog.Content></Dialog.Backdrop></Dialog>
      <AlertDialog><AlertDialog.Trigger>Delete</AlertDialog.Trigger><AlertDialog.Backdrop><AlertDialog.Content><AlertDialog.Title>Delete?</AlertDialog.Title><AlertDialog.Close>Cancel</AlertDialog.Close></AlertDialog.Content></AlertDialog.Backdrop></AlertDialog>
      <Tooltip><Tooltip.Trigger>Help</Tooltip.Trigger><Tooltip.Content>Help text</Tooltip.Content></Tooltip>
      <Direction />
    </UIProvider>
  )

  void view
  void standalone
  void themed
  void partialPreferences
  `
    )
    writeFileSync(
      join(consumer, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            jsx: "react-jsx",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            noEmit: true,
            strict: true,
            target: "ESNext"
          },
          include: ["consumer.tsx"]
        },
        null,
        2
      )
    )

    const typescript = resolve(repository, "node_modules/typescript/bin/tsc")
    execFileSync(process.execPath, [typescript, "-p", join(consumer, "tsconfig.json")], {
      cwd: consumer,
      stdio: "inherit"
    })
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}, 120_000)
