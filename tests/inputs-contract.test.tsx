import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, useState, type ReactNode } from "react"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { defaultAppearance } from "@phreshos/core"
import { resolveColorLevel, solidColors } from "../source/color.js"
import {
    AppearanceProvider, Button, Input, Textarea, Checkbox, Switch, Radio, RadioGroup, Select, Slider,
    type InputProps, type TextareaProps, type CheckboxProps, type SwitchProps, type RadioGroupProps,
    type SelectProps, type SliderProps, type ControlColor, type ScaleLevel
} from "../source/main.js"

afterEach(cleanup)

it.each(["checkbox", "switch", "radio"] as const)("shares Material on the %s indicator while retaining selection colors", async kind => {
    const sample = kind === "checkbox" ? <Checkbox label="Choice" color="secondary:base" />
        : kind === "switch" ? <Switch label="Choice" color="secondary:base" />
        : <RadioGroup label="Choices" color="secondary:base"><Radio value="one" label="Choice" /></RadioGroup>
    const { container } = renderUI(sample)
    const base = container.querySelector<SVGRectElement>("[data-material-base]")
    const material = container.querySelector("[data-material-fill]")
    const border = container.querySelector<HTMLElement>("[data-surface-edge]")
    const indicator = border?.parentElement
    expect(base).not.toBeNull()
    expect(indicator?.tagName).toBe("SPAN")
    expect(indicator?.style.background).toBe("transparent")
    expect(indicator?.style.boxShadow).toBe("")
    expect(material?.getAttribute("opacity")).toBe(String(defaultAppearance.material.light.opacity))
    expect(css(base?.style.fill ?? "")).toBe(css(resolveColorLevel(defaultAppearance.colors.background.light, "base")))

    const user = userEvent.setup()
    await user.click(screen.getByRole(kind, { name: "Choice" }))
    await user.unhover(screen.getByRole(kind, { name: "Choice" }))
    expect((screen.getByRole(kind) as HTMLInputElement).checked).toBe(true)
    expect(css(base?.style.fill ?? "")).toBe(css(resolveColorLevel(defaultAppearance.colors.secondary.light, "base")))
    expect(indicator?.style.borderRadius).toBe(kind === "checkbox" ? "4.75px" : "19px")
})

it("exposes value callbacks and one shared color and size contract", () => {
    expectTypeOf<InputProps["onChange"]>().toEqualTypeOf<((value: string) => void) | undefined>()
    expectTypeOf<TextareaProps["onChange"]>().toEqualTypeOf<InputProps["onChange"]>()
    expectTypeOf<CheckboxProps["onChange"]>().toEqualTypeOf<((value: boolean) => void) | undefined>()
    expectTypeOf<SwitchProps["onChange"]>().toEqualTypeOf<CheckboxProps["onChange"]>()
    expectTypeOf<SelectProps["onChange"]>().toEqualTypeOf<((value: string | null) => void) | undefined>()
    expectTypeOf<SliderProps["onChange"]>().toEqualTypeOf<((value: number) => void) | undefined>()
    expectTypeOf<InputProps["color"]>().toEqualTypeOf<ControlColor | undefined>()
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
        expect(sheets[0]?.textContent).toContain("opacity: 0.6")
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

    it("shows hover and pointer focus without changing its value or dimensions", async () => {
        const user = userEvent.setup()
        renderUI(<Control label="Name" color="secondary:base" defaultValue="Example" />)
        const field = screen.getByRole("textbox") as HTMLInputElement
        const height = field.style.height
        const paints = solidColors(defaultAppearance.colors.secondary.light, defaultAppearance.colors.background.light, defaultAppearance.colors.foreground.light)

        await user.hover(field)
        expect(materialColor(field)).toBe(css(paints.hover.background))

        await user.click(field)
        expect(materialColor(field)).toBe(css(paints.pressed.background))
        expect(field.style.caretColor).toBe(css(paints.pressed.color))
        expect(field.style.height).toBe(height)
        expect(field.value).toBe("Example")
    })
})

it.each(["primary", "secondary", "success", "warning", "danger", "info"] as const)("shows %s on resting fields and follows theme changes", role => {
    const sample = <>
        <Input label="Single" color={`${role}:base`} />
        <Textarea label="Multiple" color={`${role}:base`} />
        <Select label="Choice" color={`${role}:base`} options={[{ value: "one", label: "One" }]} />
    </>
    const view = renderUI(sample)

    for (const theme of ["light", "dark"] as const) {
        view.rerender(<AppearanceProvider appearance={defaultAppearance} theme={theme}>{sample}</AppearanceProvider>)
        const tint = defaultAppearance.colors[role][theme]
        const paint = solidColors(tint, defaultAppearance.colors.background[theme], defaultAppearance.colors.foreground[theme]).rest

        for (const field of [...screen.getAllByRole("textbox"), screen.getByRole("button")]) {
            expect(materialColor(field)).toBe(css(paint.background))
            expect(field.style.background).toBe("transparent")
            expect(field.style.color).toBe(css(paint.color))
            expect(field.style.borderWidth).toBe("0px")
        }
    }
})

it("gives invalid fields danger precedence over their chosen color", () => {
    renderUI(<Input label="Name" color="success:base" invalid />)
    expect(materialColor(screen.getByRole("textbox"))).toBe(css(resolveColorLevel(defaultAppearance.colors.danger.light, "base")))
})

it("forwards native text-control refs and preserves textarea rows", () => {
    const input = createRef<HTMLInputElement>()
    const textarea = createRef<HTMLTextAreaElement>()
    renderUI(<><Input aria-label="Single" ref={input} /><Textarea aria-label="Multiple" ref={textarea} rows={7} /></>)
    expect(input.current).toBe(screen.getByRole("textbox", { name: "Single" }))
    expect(textarea.current?.rows).toBe(7)
})

it("shares Button height and responds to the nearest concrete theme colors", () => {
    const appearance = {
        ...defaultAppearance,
        colors: {
            ...defaultAppearance.colors,
            background: { light: "#111111", dark: "#eeeeee" },
            foreground: { light: "#eeeeee", dark: "#111111" }
        }
    }
    const sample = <><Input aria-label="Name" size="large" /><Button size="large">Save</Button></>
    const view = render(<AppearanceProvider appearance={appearance} theme="light">{sample}</AppearanceProvider>)
    const field = screen.getByRole("textbox")
    expect(field.style.height).toBe(screen.getByRole("button").style.height)
    expect(materialColor(field)).toBe(css(resolveColorLevel("#111111", "base")))
    view.rerender(<AppearanceProvider appearance={appearance} theme="dark">{sample}</AppearanceProvider>)
    expect(materialColor(field)).toBe(css(resolveColorLevel("#eeeeee", "base")))
})

describe.each([["Checkbox", Checkbox, "checkbox"], ["Switch", Switch, "switch"]] as const)("%s", (_, Control, role) => {
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
    renderUI(<form data-testid="form"><RadioGroup label="Mode" name="mode" defaultValue="one" onChange={onChange}>
        <Radio label="One" value="one" /><Radio label="Two" value="two" disabled /><Radio label="Three" value="three" />
    </RadioGroup></form>)
    expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeTruthy()
    screen.getByRole("radio", { name: "One" }).focus()
    await userEvent.setup().keyboard("[ArrowDown]")
    expect(onChange).toHaveBeenLastCalledWith("three")
    expect((screen.getByRole("radio", { name: "One" }) as HTMLInputElement).checked).toBe(false)
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("mode")).toBe("three")
})

it.each(["readOnly", "disabled"] as const)("RadioGroup blocks changes while %s", async state => {
    const onChange = vi.fn()
    renderUI(<RadioGroup label="Mode" defaultValue="one" readOnly={state === "readOnly"} disabled={state === "disabled"} onChange={onChange}>
        <Radio label="One" value="one" /><Radio label="Two" value="two" />
    </RadioGroup>)
    const user = userEvent.setup()
    await user.click(screen.getByRole("radio", { name: "Two" }))
    screen.getByRole("radio", { name: "One" }).focus()
    await user.keyboard("[ArrowDown]")
    expect(onChange).not.toHaveBeenCalled()
})

it("RadioGroup follows controlled props without repeating its validation error for each Radio", () => {
    const view = renderUI(<RadioGroup label="Mode" value="one" invalid errorMessage="Choose another mode">
        <Radio label="One" value="one" /><Radio label="Two" value="two" />
    </RadioGroup>)
    expect(screen.getAllByText("Choose another mode")).toHaveLength(1)
    view.rerender(wrap(<RadioGroup label="Mode" value="two"><Radio label="One" value="one" /><Radio label="Two" value="two" /></RadioGroup>))
    expect((screen.getByRole("radio", { name: "Two" }) as HTMLInputElement).checked).toBe(true)
})

const options = [{ value: "one", label: "One" }, { value: "two", label: "Two", disabled: true }, { value: "three", label: "Three" }]

it("spaces Select options and leaves unselected options transparent, including keyboard focus", async () => {
    const user = userEvent.setup()
    renderUI(<Select label="Choice" options={options} defaultValue="one" />)
    await user.click(screen.getByRole("button"))
    const list = screen.getByRole("listbox")
    expect(list.style.display).toBe("grid")
    expect(parseFloat(list.style.gap)).toBeGreaterThan(0)
    expect(screen.getByRole("option", { name: "One" }).style.background).not.toBe("transparent")
    expect(screen.getByRole("option", { name: "Two" }).style.background).toBe("transparent")
    const third = screen.getByRole("option", { name: "Three" })
    expect(third.style.background).toBe("transparent")
    await user.keyboard("[ArrowDown]")
    expect(third.getAttribute("data-focused")).toBe("true")
    expect(third.style.background).toBe("transparent")
    expect(third.style.outline).toContain("2px solid")
})

it("Select typeahead changes a string value, closes, and restores trigger focus", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderUI(<Select label="Choice" options={options} onChange={onChange} />)
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
    const view = renderUI(<Select label="Model" options={entries} value="80" onChange={onChange} />)
    const trigger = screen.getByRole("button", { name: /Model/ })

    await user.click(trigger)
    const list = screen.getByRole("listbox")
    const material = list.parentElement!
    const popover = material.parentElement!
    expect(material.style.maxHeight).toBe("inherit")
    expect(material.style.boxSizing).toBe("border-box")
    expect(material.style.display).toBe("flex")
    expect(material.style.flexDirection).toBe("column")
    expect(list.style.minHeight).toBe("0px")
    expect(list.style.overflow).toBe("auto")
    expect(list.style.maxHeight).toBe("")
    expect(popover.style.maxHeight).not.toBe("")

    view.rerender(wrap(<Select label="Model" options={entries.map(entry => ({ ...entry }))} value="80" onChange={onChange} />))
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
    const view = renderUI(<Select label="Choice" options={options} onChange={onChange} />)
    await user.click(screen.getByRole("button"))
    fireEvent.click(screen.getByRole("option", { name: "Two" }))
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard("[Escape]")
    expect(screen.queryByRole("listbox")).toBeNull()
    await user.click(screen.getByRole("button"))
    view.unmount()
    expect(screen.queryByRole("listbox")).toBeNull()
})

it("Select supports controlled null, uncontrolled form values, and disabled triggers", () => {
    const view = renderUI(<form data-testid="form"><Select label="Choice" name="choice" options={options} defaultValue="one" /></form>)
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("choice")).toBe("one")
    view.rerender(wrap(<Select label="Choice" options={options} value={null} disabled placeholder="Choose" />))
    const button = screen.getByRole("button") as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.textContent).toContain("Choose")
})

it("Select restores its default on form reset and associates validation feedback", async () => {
    renderUI(<form data-testid="form"><Select label="Choice" name="choice" options={options} defaultValue="one"
        description="Choose one item" invalid errorMessage="Selection unavailable" /></form>)
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
    return <AppearanceProvider appearance={defaultAppearance} theme="light">{children}</AppearanceProvider>
}

function renderUI(children: ReactNode) {
    return render(wrap(children))
}

function descriptions(element: HTMLElement) {
    return element.getAttribute("aria-describedby")?.split(" ").map(id => document.getElementById(id)?.textContent) ?? []
}

function css(value: string) {
    const element = document.createElement("div")
    element.style.background = value
    return element.style.background
}

function materialColor(control: HTMLElement) {
    const host = control instanceof HTMLButtonElement ? control : control.parentElement
    const base = host?.querySelector<SVGRectElement>("[data-material-base]")
    expect(base).not.toBeNull()
    if (!(control instanceof HTMLButtonElement)) {
        expect(host?.tagName).toBe("SPAN")
        expect(host?.querySelector("label")).toBeNull()
        expect(host?.style.padding).toBe("")
    }
    return css(base?.style.fill ?? "")
}
