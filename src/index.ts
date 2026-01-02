import { Alpine } from "alpinejs";
import type { default as AlpineType } from "alpinejs";
import CreateComboboxInput from "./factories/CreateComboboxInput";
import CreateComboboxOption from "./factories/CreateComboboxOption";
import CreateComboboxRoot from "./factories/CreateComboboxRoot";

type ComboboxValue =
    | null
    | 'input'
    | 'button'
    | 'options'
    | 'option'
    | 'options-group'
    | 'loading'
    | 'separator'
    | 'empty';

export default function combobox(Alpine: Alpine): void {

    Alpine.directive('combobox', (el: AlpineType.ElementWithXAttributes, { value, modifiers }: AlpineType.DirectiveData, { Alpine, effect }: AlpineType.DirectiveUtilities) => {
        switch (value as ComboboxValue) {
            case null: handleRoot(Alpine, el, effect);
                break;
            case 'input': handleInput(Alpine, el);
                break;
            case 'button': handleButton(Alpine, el);
                break;
            case 'options': handleOptions(el);
                break;
            case 'option': handleOption(Alpine, el);
                break;
            case 'options-group': handleOptionsGroup(Alpine, el);
                break;
            case 'loading': handleIsLoasing(Alpine, el, modifiers);
                break;
            case 'separator': handleSeparator(Alpine, el);
                break;
            case 'empty': handleEmptyState(Alpine, el);
                break;
            default:
                console.error('invalid x-combobox value', value, 'use input, button, option, options or leave mepty for root level instead');
                break;
        }
    }).before('bind');

    function handleRoot(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes,
        effect: AlpineType.DirectiveUtilities['effect']
    ) {

        Alpine.bind(el, {
            'x-data'() {
                return CreateComboboxRoot({ el, effect })
            }
        })
    }

    function handleInput(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes
    ): void {
        Alpine.bind(el, {
            'x-ref': '__input',
            'x-model': '__searchQuery',
            'x-bind:id'() { return this.$id('combobox-input') },

            'role': 'combobox',
            'tabindex': '0',
            'aria-autocomplete': 'list',
            'x-data'() {
                return CreateComboboxInput(Alpine)
            }
        })
    }

    function handleOptions(el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {

            'x-ref': '__options',
            'x-bind:id'() { return this.$id('combobox-options') },
            'role': 'listbox',

            'x-init'() {
                this.$data.__static = Alpine.extractProp(this.$el, 'static', false);

                if (Alpine.bound(this.$el, 'keepActivated')) {
                    this.__keepActivated = true;
                }

                return this.$el.dataset.slot = 'options';
            },

            'x-show'() { return this.$data.__static ? true : this.$data.__isOpen; },
        })
    }

    function handleOption(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {

        Alpine.bind(el, {
            'x-id'() { return ['combobox-option'] },
            'x-bind:id'() { return this.$id('combobox-option') },
            'role': 'option',
            'x-show'() {
                return this.$data.__isVisible(this.$el.dataset.key);
            },
            'x-data'() {
                // @todo: move to constructor function here for memory gains
                return CreateComboboxOption(Alpine, this.__nextId())
            },
        });
    }

    function handleOptionsGroup(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {

        Alpine.bind(el, {
            'x-id'() { return ['combobox-options-group'] },
            'x-bind:id'() { return this.$id('combobox-options-group') },
            'role': 'option',
            'x-show'() {
                // we need to hide it if it's doesnt have any child  
                return true;
            },
        });
    }

    function handleButton(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {

        Alpine.bind(el, {
            'x-ref': '__button',
            'x-bind:id'() { return this.$id('combobox-button') },

            'tabindex': '-1',
            'aria-haspopup': 'true',
            // more missing dynamic features 

            'x-on:click'(e) {
                if (this.__isDisabled) return

                if (this.__isOpen) {
                    this.__close()
                    this.__resetInput()
                } else {
                    e.preventDefault()
                    this.__open()
                }

                requestAnimationFrame(() => this.$refs.__input.focus({ preventScroll: true }))
            },
        })
    }

    function handleEmptyState(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-bind:id'() { return this.$id('combobox-button') },

            'tabindex': '-1',
            'aria-haspopup': 'true',
            // more missing dynamic features 
            'x-show'() {
                return Array.isArray(this.__filteredKeys) && this.__filteredKeys.length === 0;
            }
        });
    }

    function handleIsLoasing(Alpine: Alpine, el: AlpineType.ElementWithXAttributes, modifiers: AlpineType.DirectiveData['modifiers']) {

        // get the current alpine scope of the el.
        let data = Alpine.$data(el);

        if (modifiers.filter((item: string) => item === 'hide')) {
            // 
        }

        if (data) {
            // @todo
        }

    }

    function handleSeparator(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        // when the search is happening if there is any items above it that hidden (filtered out), we need to hide this separator
        // as well as we need to do the same thing if the items the below it hidden 
        Alpine.bind(el, {
            // @todo
        });
    }
}