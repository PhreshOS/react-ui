import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, useState, type ReactNode } from "react"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { defaultAppearance } from "../source/main.js"
import { luminance, mixColor } from "../source/foundation/color.js"
import { resolveVisual } from "../source/foundation/visual.js"
import { surfacePaint } from "../source/surface/surface.js"
import {
    UIProvider, Button, Input, Textarea, Checkbox, Switch, RadioGroup, Select, Slider,
    type InputProps, type TextareaProps, type CheckboxProps, type SwitchProps, type RadioGroupProps,
    type SelectProps, type SliderProps, type Color, type ScaleLevel
} from "../source/main.js"
import { cssColor as normalized, hairline, lifted, paintDeclarations, surfaceFill } from "./support/paint.js"

const colors = defaultAppearance.colors.light

afterEach(cleanup)

it.each(["checkbox", "switch", "radio"] as const)("rises the %s indicator in its color when selected", async kind => {
    const sample = kind === "checkbox" ? <Checkbox label="Choice" color="secondary" />
        : kind === "switch" ? <Switch label="Choice" color="secondary" />
        : <RadioGroup label="Choices" color="secondary"><RadioGroup.Item value="one" label="Choice" /></RadioGroup>
    renderUI(sample)
    const input = screen.getByRole(kind, { name: "Choice" })
    const indicator = input.closest("label")!.querySelector<HTMLElement>(".phreshos-surface")!
    expect(lifted(paintDeclarations(indicator)["box-shadow"])).toBe(false)
    expect(surfaceFill(indicator)).toBe(mixColor(colors.background, "#000000", 0.03))

    const user = userEvent.setup()
    await user.click(input)
    await user.unhover(input)
    expect((input as HTMLInputElement).checked).toBe(true)
    expect(surfaceFill(indicator)).toBe(colors.secondary)
})

it("exposes value callbacks and one shared color and size contract", () => {
    expectTypeOf<InputProps["onChange"]>().toEqualTypeOf<((value: string) => void) | undefined>()
    expectTypeOf<TextareaProps["onChange"]>().toEqualTypeOf<InputProps["onChange"]>()
    expectTypeOf<CheckboxProps["onChange"]>().toEqualTypeOf<((value: boolean) => void) | undefined>()
    expectTypeOf<SwitchProps["onChange"]>().toEqualTypeOf<CheckboxProps["onChange"]>()
    expectTypeOf<SelectProps["onChange"]>().toEqualTypeOf<((value: string | null) => void) | undefined>()
    expectTypeOf<SliderProps["onChange"]>().toEqualTypeOf<((value: number) => void) | undefined>()
    expectTypeOf<InputProps["color"]>().toEqualTypeOf<Color | undefined>()
    expectTypeOf<RadioGroupProps["size"]>().toEqualTypeOf<ScaleLevel | undefined>()
    expectTypeOf<"isDisabled">().not.toExtend<keyof InputProps>()
    expectTypeOf<"isSelected">().not.toExtend<keyof CheckboxProps>()
    expectTypeOf<"selectedKey">().not.toExtend<keyof SelectProps>()
})

describe.each([["Input", Input], ["Textarea", Textarea]] as const)("%s", (_, Control) => {
    it("scopes placeholder paint to the native control and inherits its contrast color", () => {
        renderUI(<Control label="Name" placeholder="Enter a name" />)
        const field = screen.getByRole("textbox")
        expect(field.classList.contains("phreshos-ui-text-control")).toBe(true)
        const sheets = [...document.head.querySelectorAll("style")].filter(sheet => sheet.textContent?.includes(".phreshos-ui-text-control::placeholder"))
        expect(sheets).toHaveLength(1)
        expect(sheets[0]?.textContent).toContain("color: inherit")
        expect(sheets[0]?.textContent).toContain("opacity: 0.55")
    })

    it("associates labels, descriptions, and invalid errors", () => {
        renderUI(<Control label="Name" description="A public name" invalid errorMessage="Enter a name" />)
        const input = screen.getByRole("textbox", { name: "Name" })
        expect(input.getAttribute("aria-invalid")).toBe("true")
        expect(descriptions(input)).toContain("A public name")
        expect(descriptions(input)).toContain("Enter a name")
    })

    it("supports controlled editing without native event leakage", async () => {
        const onChange = vi.fn()
        function Field() {
            const [value, setValue] = useState("A")
            return <Control label="Name" value={value} onChange={next => { setValue(next); onChange(next) }} />
        }
        renderUI(<Field />)
        await userEvent.setup().type(screen.getByRole("textbox"), "bc")
        expect(onChange).toHaveBeenLastCalledWith("Abc")
        expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("Abc")
    })

    it("honors disabled, required, read-only, and native names", async () => {
        const onChange = vi.fn()
        const view = renderUI(<Control label="Name" disabled required name="name" defaultValue="A" onChange={onChange} />)
        expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(true)
        expect((screen.getByRole("textbox") as HTMLInputElement).required).toBe(true)
        view.rerender(wrap(<Control label="Name" readOnly name="name" defaultValue="A" onChange={onChange} />))
        const field = screen.getByRole("textbox") as HTMLInputElement
        field.focus()
        await userEvent.setup().type(field, "B")
        expect(document.activeElement).toBe(field)
        expect(field.value).toBe("A")
        expect(field.name).toBe("name")
        expect(onChange).not.toHaveBeenCalled()
    })

    it("resets an uncontrolled native form field", async () => {
        renderUI(<form data-testid="form"><Control label="Name" name="name" defaultValue="Initial" /></form>)
        await userEvent.setup().type(screen.getByRole("textbox"), " changed")
        const form = screen.getByTestId("form") as HTMLFormElement
        expect(new FormData(form).get("name")).toBe("Initial changed")
        act(() => form.reset())
        expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("Initial")
    })

    it("recesses, rings its boundary on focus, and keeps its value and dimensions", async () => {
        const user = userEvent.setup()
        renderUI(<Control label="Name" defaultValue="Example" />)
        const field = screen.getByRole("textbox") as HTMLInputElement
        const well = field.parentElement!
        const height = field.style.height
        expect(surfaceFill(well)).toBe(mixColor(colors.background, "#000000", 0.03))
        await user.click(field)
        expect(normalized(hairline(paintDeclarations(well)["box-shadow"]))).toBe(normalized(colors.primary))
        expect(paintDeclarations(well).outline).toContain(colors.primary)
        expect(field.style.height).toBe(height)
        expect(field.value).toBe("Example")
    })
})

it.each(["primary", "secondary", "success", "warning", "danger", "info"] as const)("recesses a %s field paint and follows theme changes", role => {
    const sample = <>
        <Input label="Single" color={role} />
        <Textarea label="Multiple" color={role} />
        <Select label="Choice" color={role}><Select.Item id="one">One</Select.Item></Select>
    </>
    const view = renderUI(sample)

    for (const theme of ["light", "dark"] as const) {
        view.rerender(<UIProvider preferences={{ theme, animations: true }}>{sample}</UIProvider>)
        const expected = surfacePaint(resolveVisual(defaultAppearance, { theme, animations: true }), role, "recessed", undefined, undefined, undefined).fill
        for (const well of [...screen.getAllByRole("textbox").map(field => field.parentElement!), screen.getByRole("button")]) {
            expect(surfaceFill(well)).toBe(expected)
            expect(lifted(paintDeclarations(well)["box-shadow"])).toBe(false)
        }
    }
})

it("gives invalid fields a danger boundary over their chosen color", () => {
    renderUI(<Input label="Name" color="success" invalid />)
    expect(normalized(hairline(paintDeclarations(screen.getByRole("textbox").parentElement!)["box-shadow"]))).toBe(normalized(colors.danger))
})

it("forwards native text-control refs and preserves textarea rows", () => {
    const input = createRef<HTMLInputElement>()
    const textarea = createRef<HTMLTextAreaElement>()
    renderUI(<><Input aria-label="Single" ref={input} /><Textarea aria-label="Multiple" ref={textarea} rows={7} /></>)
    expect(input.current).toBe(screen.getByRole("textbox", { name: "Single" }))
    expect(textarea.current?.rows).toBe(7)
})

it("shares Button height and follows the nearest Appearance", () => {
    const appearance = { colors: { light: { background: "#223344" }, dark: { background: "#ccddee" } } }
    const sample = <><Input aria-label="Name" size="large" /><Button size="large">Save</Button></>
    const view = render(<UIProvider appearance={appearance} preferences={{ theme: "light", animations: true }}>{sample}</UIProvider>)
    const field = screen.getByRole("textbox")
    expect(field.style.height).toBe(screen.getByRole("button").style.height)
    const lightWell = surfaceFill(field.parentElement!)
    // A dark canvas has no room below it, so its recess rises instead.
    expect(luminance(lightWell)!).toBeGreaterThan(luminance("#223344")!)
    view.rerender(<UIProvider appearance={appearance} preferences={{ theme: "dark", animations: true }}>{sample}</UIProvider>)
    expect(luminance(surfaceFill(field.parentElement!))!).toBeLessThan(luminance("#ccddee")!)
    expect(surfaceFill(field.parentElement!)).not.toBe(lightWell)
})

describe.each([["Checkbox", Checkbox, "checkbox"], ["Switch", Switch, "switch"]] as const)("%s", (_, Control, role) => {
    it("anchors its hidden native input to the visible control", () => {
        renderUI(<Control label="Enabled" />)
        expect(screen.getByRole(role).closest("label")?.style.position).toBe("relative")
    })

    it("associates its label and description and toggles with pointer and Space", async () => {
        const onChange = vi.fn()
        const user = userEvent.setup()
        renderUI(<Control label="Enabled" description="An option" onChange={onChange} />)
        const input = screen.getByRole(role, { name: "Enabled" })
        expect(descriptions(input)).toContain("An option")
        await user.click(input)
        expect(onChange).toHaveBeenLastCalledWith(true)
        await user.keyboard("[Space]")
        expect(onChange).toHaveBeenLastCalledWith(false)
    })

    it("remains controlled, then follows updated props", async () => {
        const onChange = vi.fn()
        const view = renderUI(<Control label="Enabled" checked={false} onChange={onChange} />)
        await userEvent.setup().click(screen.getByRole(role))
        expect(onChange).toHaveBeenCalledWith(true)
        expect((screen.getByRole(role) as HTMLInputElement).checked).toBe(false)
        view.rerender(wrap(<Control label="Enabled" checked onChange={onChange} />))
        expect((screen.getByRole(role) as HTMLInputElement).checked).toBe(true)
    })

    it.each(["disabled", "readOnly"] as const)("blocks changes while %s", async state => {
        const onChange = vi.fn()
        renderUI(<Control label="Enabled" disabled={state === "disabled"} readOnly={state === "readOnly"} onChange={onChange} />)
        await userEvent.setup().click(screen.getByRole(role))
        expect(onChange).not.toHaveBeenCalled()
    })

    it("submits and resets its boolean field", async () => {
        renderUI(<form data-testid="form"><Control label="Enabled" name="enabled" value="yes" defaultChecked /></form>)
        const form = screen.getByTestId("form") as HTMLFormElement
        expect(new FormData(form).get("enabled")).toBe("yes")
        await userEvent.setup().click(screen.getByRole(role))
        expect(new FormData(form).has("enabled")).toBe(false)
        act(() => form.reset())
        expect((screen.getByRole(role) as HTMLInputElement).checked).toBe(true)
    })
})

it("represents mixed checkboxes independently from their submitted checked value", () => {
    renderUI(<Checkbox label="All" indeterminate defaultChecked />)
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement
    expect(checkbox.indeterminate).toBe(true)
    expect(checkbox.checked).toBe(true)
})

it("keeps sibling field descriptions and validation messages separate", () => {
    renderUI(<>
        <Input label="First" description="First help" invalid errorMessage="First error" />
        <Input label="Second" description="Second help" />
        <Checkbox label="Consent" invalid errorMessage="Consent required" />
        <Switch label="Feature" invalid errorMessage="Feature unavailable" />
    </>)
    expect(descriptions(screen.getByRole("textbox", { name: "First" }))).toEqual(expect.arrayContaining(["First help", "First error"]))
    expect(descriptions(screen.getByRole("textbox", { name: "Second" }))).not.toContain("First error")
    expect(descriptions(screen.getByRole("checkbox", { name: "Consent" }))).toContain("Consent required")
    expect(descriptions(screen.getByRole("switch", { name: "Feature" }))).toContain("Feature unavailable")
})

it("keeps RadioGroup selection exclusive, skips disabled options, and submits the value", async () => {
    const onChange = vi.fn()
    const firstInput = createRef<HTMLInputElement>()
    renderUI(<form data-testid="form"><RadioGroup label="Mode" name="mode" defaultValue="one" onChange={onChange}>
        <RadioGroup.Item label="One" value="one" inputRef={firstInput} /><RadioGroup.Item label="Two" value="two" disabled /><RadioGroup.Item label="Three" value="three" />
    </RadioGroup></form>)
    expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeTruthy()
    expect(firstInput.current?.checked).toBe(true)
    screen.getByRole("radio", { name: "One" }).focus()
    await userEvent.setup().keyboard("[ArrowDown]")
    expect(onChange).toHaveBeenLastCalledWith("three")
    expect((screen.getByRole("radio", { name: "One" }) as HTMLInputElement).checked).toBe(false)
    expect(firstInput.current?.checked).toBe(false)
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("mode")).toBe("three")
})

it.each(["readOnly", "disabled"] as const)("RadioGroup blocks changes while %s", async state => {
    const onChange = vi.fn()
    renderUI(<RadioGroup label="Mode" defaultValue="one" readOnly={state === "readOnly"} disabled={state === "disabled"} onChange={onChange}>
        <RadioGroup.Item label="One" value="one" /><RadioGroup.Item label="Two" value="two" />
    </RadioGroup>)
    const user = userEvent.setup()
    await user.click(screen.getByRole("radio", { name: "Two" }))
    screen.getByRole("radio", { name: "One" }).focus()
    await user.keyboard("[ArrowDown]")
    expect(onChange).not.toHaveBeenCalled()
})

it("RadioGroup follows controlled props without repeating its validation error for each Item", () => {
    const view = renderUI(<RadioGroup label="Mode" value="one" invalid errorMessage="Choose another mode">
        <RadioGroup.Item label="One" value="one" /><RadioGroup.Item label="Two" value="two" />
    </RadioGroup>)
    expect(screen.getAllByText("Choose another mode")).toHaveLength(1)
    view.rerender(wrap(<RadioGroup label="Mode" value="two"><RadioGroup.Item label="One" value="one" /><RadioGroup.Item label="Two" value="two" /></RadioGroup>))
    expect((screen.getByRole("radio", { name: "Two" }) as HTMLInputElement).checked).toBe(true)
    view.rerender(wrap(<RadioGroup label="Mode" value={null}><RadioGroup.Item label="One" value="one" /><RadioGroup.Item label="Two" value="two" /></RadioGroup>))
    expect(screen.getAllByRole("radio").every(radio => !(radio as HTMLInputElement).checked)).toBe(true)
})

const options = <>
    <Select.Item id="one">One</Select.Item>
    <Select.Item id="two" disabled>Two</Select.Item>
    <Select.Item id="three">Three</Select.Item>
</>

it("lays selection beneath the chosen option and veils hover without keyboard focus", async () => {
    const user = userEvent.setup()
    renderUI(<Select label="Choice" defaultValue="one">{options}</Select>)
    await user.click(screen.getByRole("button"))
    const selected = screen.getByRole("option", { name: "One" })
    const third = screen.getByRole("option", { name: "Three" })
    expect(surfaceFill(selected)).not.toBe("transparent")
    expect(surfaceFill(third)).toBe("transparent")
    await user.hover(third)
    expect(third.getAttribute("data-focused")).toBeNull()
    expect(surfaceFill(third)).not.toBe("transparent")
    await user.keyboard("[ArrowDown]")
    expect(third.getAttribute("data-focused")).toBe("true")
})

it("refreshes Select paint when the theme changes while its collection remains open", async () => {
    const select = <Select label="Choice" defaultValue="one">{options}</Select>
    const view = render(<UIProvider preferences={{ theme: "light", animations: true }}>{select}</UIProvider>)
    await userEvent.setup().click(screen.getByRole("button"))
    const selected = screen.getByRole("option", { name: "One" })
    const light = surfaceFill(selected)
    view.rerender(<UIProvider preferences={{ theme: "dark", animations: true }}>{select}</UIProvider>)
    expect(surfaceFill(selected)).not.toBe(light)
    expect(screen.getByRole("listbox")).not.toBeNull()
})

it("Select typeahead changes a string value, closes, and restores trigger focus", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderUI(<Select label="Choice" onChange={onChange}>{options}</Select>)
    const trigger = screen.getByRole("button", { name: /Choice/ })
    trigger.focus()
    await user.keyboard("[Space]thr[Enter]")
    expect(onChange).toHaveBeenLastCalledWith("three")
    expect(screen.queryByRole("listbox")).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(trigger))
})

it("keeps a long controlled Select open across rerenders and constrains scrolling to its list", async () => {
    const user = userEvent.setup()
    const entries = Array.from({ length: 100 }, (_, index) => ({ value: String(index), label: `Model ${index}` }))
    const onChange = vi.fn()
    const view = renderUI(<Select label="Model" value="80" onChange={onChange}>{entries.map(entry => <Select.Item key={entry.value} id={entry.value}>{entry.label}</Select.Item>)}</Select>)
    const trigger = screen.getByRole("button", { name: /Model/ })

    await user.click(trigger)
    const list = screen.getByRole("listbox")
    const scrollArea = list.closest<HTMLElement>("[data-phreshos-scroll-area]")!
    const material = scrollArea.parentElement!
    const popover = material.parentElement!
    expect(material.style.maxHeight).toContain("min(")
    expect(material.style.display).toBe("flex")
    expect(material.style.flexDirection).toBe("column")
    expect(scrollArea.style.minHeight).toBe("0px")
    expect(scrollArea.querySelector<HTMLElement>("[data-phreshos-scroll-area-viewport]")!.style.overflowY).toBe("scroll")
    expect(list.style.overflow).toBe("")
    expect(list.style.maxHeight).toBe("")
    expect(popover.style.maxHeight).not.toBe("")

    view.rerender(wrap(<Select label="Model" value="80" onChange={onChange}>{entries.map(entry => <Select.Item key={entry.value} id={entry.value}>{entry.label}</Select.Item>)}</Select>))
    fireEvent.scroll(list)
    expect(screen.getByRole("listbox")).toBe(list)
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard("[ArrowDown][Enter]")
    expect(onChange).toHaveBeenLastCalledWith("81")
    expect(screen.queryByRole("listbox")).toBeNull()
})

it("Select rejects disabled options, dismisses with Escape, and cleans up its portal", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const view = renderUI(<Select label="Choice" onChange={onChange}>{options}</Select>)
    await user.click(screen.getByRole("button"))
    fireEvent.click(screen.getByRole("option", { name: "Two" }))
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard("[Escape]")
    expect(screen.queryByRole("listbox")).toBeNull()
    await user.click(screen.getByRole("button"))
    view.unmount()
    expect(screen.queryByRole("listbox")).toBeNull()
})

it("Select shows only the chosen Item's text in its trigger", () => {
    renderUI(<Select label="Choice" defaultValue="one">{options}</Select>)
    const value = screen.getByRole("button").querySelector(".react-aria-SelectValue")!
    // The list's selection mark stays in the list; in the trigger it would add height.
    expect(value.querySelector("svg")).toBeNull()
    expect(value.textContent).toBe(screen.getByRole("button").textContent)
})

it("Select supports controlled null, uncontrolled form values, and disabled triggers", () => {
    const view = renderUI(<form data-testid="form"><Select label="Choice" name="choice" defaultValue="one">{options}</Select></form>)
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("choice")).toBe("one")
    view.rerender(wrap(<Select label="Choice" value={null} disabled placeholder="Choose">{options}</Select>))
    const button = screen.getByRole("button") as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.textContent).toContain("Choose")
})

it("Select restores its default on form reset and associates validation feedback", async () => {
    renderUI(<form data-testid="form"><Select label="Choice" name="choice" defaultValue="one"
        description="Choose one item" invalid errorMessage="Selection unavailable">{options}</Select></form>)
    const trigger = screen.getByRole("button")
    expect(descriptions(trigger)).toContain("Choose one item")
    expect(descriptions(trigger)).toContain("Selection unavailable")
    trigger.focus()
    await userEvent.setup().keyboard("[Space]thr[Enter]")
    const form = screen.getByTestId("form") as HTMLFormElement
    expect(new FormData(form).get("choice")).toBe("three")
    act(() => form.reset())
    expect(new FormData(form).get("choice")).toBe("one")
})

it("Slider exposes a labeled numeric range and clamps keyboard changes to its limits", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderUI(<Slider label="Volume" description="Playback volume" minValue={10} maxValue={30} step={5} defaultValue={20} onChange={onChange} />)
    const slider = screen.getByRole("slider", { name: "Volume" }) as HTMLInputElement
    expect(descriptions(slider)).toContain("Playback volume")
    slider.focus()
    await user.keyboard("[ArrowRight]")
    expect(onChange).toHaveBeenLastCalledWith(25)
    await user.keyboard("[End][ArrowRight]")
    expect(slider.value).toBe("30")
    await user.keyboard("[Home]")
    expect(slider.value).toBe("10")
})

it("Slider supports controlled values and submits through a real form input", () => {
    const view = renderUI(<form data-testid="form"><Slider label="Volume" name="volume" value={25} /></form>)
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("volume")).toBe("25")
    view.rerender(wrap(<Slider label="Volume" value={75} disabled orientation="vertical" />))
    const slider = screen.getByRole("slider") as HTMLInputElement
    expect(slider.value).toBe("75")
    expect(slider.disabled).toBe(true)
})

it("Slider reports committed values and resets to the default without changing its range", async () => {
    const onChangeEnd = vi.fn()
    renderUI(<form data-testid="form"><Slider label="Volume" defaultValue={20} minValue={10} maxValue={30} step={5} onChangeEnd={onChangeEnd} /></form>)
    const input = screen.getByRole("slider") as HTMLInputElement
    input.focus()
    await userEvent.setup().keyboard("[ArrowRight]")
    expect(onChangeEnd).toHaveBeenLastCalledWith(25)
    act(() => (screen.getByTestId("form") as HTMLFormElement).reset())
    expect(input.value).toBe("20")
    expect(input.min).toBe("10")
    expect(input.max).toBe("30")
})

function wrap(children: ReactNode) {
    return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: true }}>{children}</UIProvider>
}

function renderUI(children: ReactNode) {
    return render(wrap(children))
}

function descriptions(element: HTMLElement) {
    return element.getAttribute("aria-describedby")?.split(" ").map(id => document.getElementById(id)?.textContent) ?? []
}
