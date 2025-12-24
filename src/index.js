import CreateComboboxInput from "./factories/CreateComboboxInput";
import CreateComboboxOption from "./factories/CreateComboboxOption";
import CreateComboboxRoot from "./factories/CreateComboboxRoot";

export default function combobox(Alpine) {

    Alpine.directive('combobox', (el, { value, modifiers, expression }, { Alpine, effect }) => {
        
        console.log('directive founded');

        switch (value) {
            case null: handleRoot(Alpine, el, effect);
                break;
            case 'input': handleInput(Alpine, el);
                break;
            case 'button': handleButton(Alpine, el);
                break;
            case 'options': handleOptions(el);
                break;
            case 'option': handleOption(Alpine, el, effect);
                break;
            case 'options-group': handleOptionsGroup(Alpine, el, effect);
                break;
            case 'loading': handleIsLoasing(Alpine, el, modifiers, expression);
                break;
            case 'separator': handleSeparator(Alpine, el, modifiers, expression);
                break;
            case 'empty', 'on-empty': handleEmptyState(Alpine, el, modifiers, expression);
                break;
            default:
                console.error('invalid x-combobox value', value, 'use input, button, option, options or leave mepty for root level instead');
                break;
        }
    }).before('bind');

    function handleRoot(Alpine, el, effect) {

        Alpine.bind(el, {
            'x-data'() {
                return CreateComboboxRoot({ el, effect })
            }
        })
    }

    function handleInput(Alpine, el) {
        Alpine.bind(el, {
            'x-ref': '__input',
            'x-model': '__searchQuery',
            'x-bind:id'() { return this.$id('combobox-input') },

            'role': 'combobox',
            'tabindex': '0',
            'aria-autocomplete': 'list',
            'x-data'() {
                return CreateComboboxInput()
            }

        })
    }

    function handleOptions(el) {
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

    function handleOption(Alpine, el, effect) {

        Alpine.bind(el, {
            'x-id'() { return ['combobox-option'] },
            'x-bind:id'() { return this.$id('combobox-option') },
            'role': 'option',
            'x-show'() {
                return this.$data.__isVisible(this.$el.dataset.key);
            },
            'x-data'() {
                // @todo: move to constructor function here for memory gains
                return CreateComboboxOption(Alpine, this.__nextId(), effect) 
            },
        });
    }

    function handleOptionsGroup(Alpine, el, effect) {

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

    function handleButton(Alpine, el) {

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

    function handleEmptyState(Alpine, el) {
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

    function handleIsLoasing(Alpine, el, modifiers) {

        // get the current alpine scope of the el.
        let data = Alpine.$data(el);

        if (data.__isLoading) {
            // @todo
        }

    }

    function handleSeparator(Alpine, el, modifiers) {
        // when the search is happening if there is any items above it that hidden (filtered out), we need to hide this separator
        // as well as we need to do the same thing if the items the below it hidden 
    }
}