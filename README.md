Here’s a polished, updated README reflecting your latest changes and new API patterns:

---

# Alpine Rover

> **One directive. Many components. Fully declarative. Zero JavaScript required.**

The most powerful and flexible selection engine for Alpine.js and Laravel Blade. Build comboboxes, selects, autocompletes, command palettes, tag inputs, and more—fully declarative, keyboard-friendly, and virtual-scroll ready.

## The Why

At SheafUI, we kept duplicating selection logic across multiple components: selects, command palettes, autocompletes, tag inputs… Each needed keyboard navigation, search filtering, activation management, and accessibility. **This plugin consolidates it all.**

In short: Alpine Rover brings the **$combobox$ pattern** to any component in a clean, declarative way.

## Features

* **One Engine, Many Components** – A single directive powers all selection patterns.
* **Keyboard Navigation** – Arrows, Enter, Escape, Home, End fully supported.
* **Smart Search** – Built-in filtering optimized for large datasets.
* **Virtual Scrolling** – Handle massive lists efficiently.
* **WCAG Accessible** – ARIA-compliant out of the box.
* **Headless** – Style freely with Tailwind or custom CSS.
* **Zero Dependencies** – Only requires Alpine.js.
* **Livewire Ready** – Works seamlessly with Livewire.
* **Flexible Modes** – Single-select, multi-select, tags, autocomplete, command palette, and more.
* **Enable/Disable Defaults** – Users can selectively enable default input and options behaviors.

Here’s a clean, concise “Combobox Component Example” section for the README using only the relevant parts for users to understand and get started quickly:

---

## Combobox Component Example

Use Alpine Rover to build a full-featured combobox:

```html
<div x-data="selectComponent" x-rover>
    <!-- Control -->
    <input x-rover:input placeholder="Search..." />
    <button x-rover:button type="button">Toggle</button>

    <!-- Options -->
    <ul x-rover:options>
        <!-- Empty state -->
        <li x-rover:empty>No results found</li>

        <!-- Options -->
        <template x-for="(item, index) in items" x-bind:key="index">
            <li x-rover:option="item" x-text="item"></li>
        </template>
    </ul>
</div>
```

### Enabling Default Handlers

```js
document.addEventListener('alpine:init', () => {
    Alpine.data('selectComponent', () => ({
        state: null,
        items: ['tenjarine','apple','banana','cherry'],
        selectedKeys: null,

        init() {
            // Activate first or selected item when the dropdown opens
            this.$rover.onOpen(() => this.activateSelectedOrFirst());

            // Enable default input behaviors: focus, typing, keyboard navigation
            this.$rover.input.enableDefaultInputHandlers();

            // Enable default option behaviors: hover, click, activation
            this.$rover.options.enableDefaultOptionsHandlers();

            // Custom behavior: select on Enter
            this.$rover.input.on('keydown', (event, activeKey) => {
                if (event.key === 'Enter' && activeKey !== undefined) {
                    this.handleSelection(activeKey);
                    this.$rover.options.close();
                }
            });

            // Custom behavior: select on click
            this.$rover.options.on('click', (event, closestOptionEl, activeKey) => {
                if (closestOptionEl !== undefined) {
                    this.handleSelection(closestOptionEl.dataset.key);
                    this.$rover.options.close();
                }
            });
        }
    }));
});
```

Users can **selectively disable** any default behavior when needed for custom interactions.

---

## 🚧 Development Status

**Alpine Rover is actively developed** and will reach its first stable release soon.

## License

MIT License - see [LICENSE.md](LICENSE.md)

## Contributing

Contributions are welcome **after the first stable release**. Your patience is appreciated while the core API stabilizes.

## Credits

Part of [SheafUI](https://sheafui.dev) accessible, headless components for Laravel and Alpine.js.
Built by [Mohamed Charrafi](https://github.com/charrafimed).

Made with ❤️ for the Laravel community.
