# Alpine Rover

> **One directive. Many components. Fully declarative. Zero JavaScript required.**

The most powerful and flexible activation engine for Alpine.js. Build comboboxes, selects, autocompletes, command palettes, tag inputs, time pickers and more,  fully declarative, keyboard-friendly, and accessible.

## The Why

At SheafUI, we kept duplicating activation logic across multiple components: selects, command palettes, autocompletes, tag inputs… Each needed keyboard navigation, search filtering, activation management, and accessibility. **This plugin consolidates it all.**

In short: Alpine Rover brings the **combobox pattern** to any component in a clean, declarative way.

## Features

* **One Engine, Many Components** – A single directive powers all selection patterns.
* **Keyboard Navigation** – Arrows, Enter, Escape, Home, End fully supported.
* **Smart Search** – Built-in filtering with unicode and accent normalization.
* **WCAG Accessible** – ARIA attributes managed automatically.
* **Headless** – Style freely with Tailwind or custom CSS.
* **Zero Dependencies** – Only requires Alpine.js.
* **Livewire Ready** – Works seamlessly with Livewire.
* **Flexible Modes** – Single-select, multi-select, tags, autocomplete, command palette, and more.

## Combobox Example

```html
<div x-data="selectComponent" x-rover>

    <input x-rover:input placeholder="Search..." />
    <button x-rover:button type="button">▼</button>

    <ul x-rover:options>
        <li x-rover:empty>No results found</li>
        <li x-rover:loading>Searching...</li>

        <template x-for="item in items" :key="item.value">
            <li
                x-rover:option
                x-bind:value="item.value"
                x-bind:data-label="item.label"
                x-text="item.label"
            ></li>
        </template>
    </ul>
    
</div>
```

```js
Alpine.data('selectComponent', () => ({
    items: [
        { value: 'apple',  label: 'Apple'  },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
    ],
    selected: null,

    init() {
        // keyboard navigation, typing, focus/blur
        this.$rover.input.enableDefaultInputHandlers();

        // hover activation, mouse, keyboard on the list
        this.$rover.options.enableDefaultOptionsHandlers();

        // select on Enter
        this.$rover.input.on('keydown', (e, activeValue) => {
            if (e.key === 'Enter' && activeValue) {
                this.selected = activeValue;
            }
        });

        // select on click
        this.$rover.options.on('click', (e, optionEl) => {
            if (optionEl?.dataset.value) {
                this.selected = optionEl.dataset.value;
            }
        });
    }
}));
```

**What rover handles automatically:**
- Hiding/showing options based on search results
- Hiding groups with no visible children (`x-rover:group`)
- Scroll into view on keyboard navigation
- Full ARIA attributes (`role`, `aria-activedescendant`, `aria-controls`)
- Normalized search — accents, unicode, case insensitive


## 🚧 Development Status

**Alpine Rover is actively developed** and will reach its first stable release soon.

## License

MIT License — see [LICENSE.md](LICENSE.md)

## Contributing

Contributions are welcome **after the first stable release**. Your patience is appreciated while the core API stabilizes.

## Credits

Part of [SheafUI](https://sheafui.dev) — accessible, headless components for Laravel and Alpine.js.
Built by [Mohamed Charrafi](https://github.com/charrafimed).

Made with ❤️ for the Laravel community.