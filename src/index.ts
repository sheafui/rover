import { Alpine } from "alpinejs";
import type { default as AlpineType } from "alpinejs";
import CreateRoverInput from "./factories/CreateRoverInput";
import CreateRoverOption from "./factories/CreateRoverOption";
import CreateRoverRoot from "./factories/CreateRoverRoot";
import CreateRoverOptions from "./factories/CreateRoverOptions";
import { RoverOptionsContext, RoverRootContext } from "./types";
import { CSS_TEXT } from "./factories/CreatorRoverSeparator";

type RoverValue =
    | null
    | 'input'
    | 'button'
    | 'options'
    | 'option'
    | 'options-group'
    | 'loading'
    | 'separator'
    | 'empty';

export default function rover(Alpine: Alpine): void {

    Alpine.directive('rover', (el: AlpineType.ElementWithXAttributes, { value, modifiers }: AlpineType.DirectiveData, { Alpine, effect }: AlpineType.DirectiveUtilities) => {
        switch (value as RoverValue) {
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
            case 'options': handleOptionsGroup(Alpine, el);
                break;
            case 'loading': handleIsLoading(Alpine, el, modifiers);
                break;
            case 'separator': handleSeparator(Alpine, el);
                break;
            case 'empty': handleEmptyState(Alpine, el);
                break;
            default:
                console.error('invalid x-rover value', value, 'use input, button, option, options, group or leave mepty for root level instead');
                break;
        }
    }).before('bind');

    /*--------------------------------------
    * Root level directive handler
    * -------------------------------------        
    */
    function handleRoot(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes,
        effect: AlpineType.DirectiveUtilities['effect']
    ) {

        Alpine.bind(el, {
            'x-on:keydown.escape'(e) {
                if (this.__isOpen) {
                    e.preventDefault();
                    this.__close();
                    queueMicrotask(() => this.$refs.__input.focus({ preventScroll: true }));
                }
            },
            'x-data'() {
                return CreateRoverRoot({ el, effect })
            }
        })
    }

    /*--------------------------------------
     * input part directive handler
     * -------------------------------------        
     */
    function handleInput(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes
    ): void {
        Alpine.bind(el, {
            'x-ref': '__input',
            'x-model': '__searchQuery',
            'x-bind:id'() { return this.$id('rover-input') },

            'role': 'combobox',
            'tabindex': '0',
            'aria-autocomplete': 'list',
            'x-data'() {
                return CreateRoverInput(Alpine)
            }
        })
    }

    /*--------------------------------------
     * options part directive handler
     * -------------------------------------        
     */
    function handleOptions(el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {

            'x-ref': '__options',
            'x-bind:id'() { return this.$id('rover-options') },
            'role': 'listbox',
            'x-on:click.away'(this: RoverOptionsContext, $event) {
                this.__handleClickAway($event)
            },
            'x-data'() {
                return CreateRoverOptions(Alpine);
            },
            'x-show'() { return this.$data.__static ? true : this.$data.__isOpen; },
        })
    }

    /*--------------------------------------
     * option part directive handler
     * -------------------------------------        
     */
    function handleOption(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {

        Alpine.bind(el, {
            'x-id'() { return ['rover-option'] },
            'x-bind:id'() { return this.$id('rover-option') },
            'role': 'option',
            'x-show'(this: RoverRootContext) {
                return this.$data.__isVisible(this.$el.dataset.key as string);
            },
            'x-data'() {
                // @todo: move to constructor function here for memory gains
                return CreateRoverOption(Alpine, this.__nextId());
            },
        });
    }

    /*--------------------------------------
     * options group directive handler
     * -------------------------------------        
     */
    function handleOptionsGroup(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {

        Alpine.bind(el, {
            'x-id'() { return ['rover-options-group'] },
            'x-bind:id'() { return this.$id('rover-options-group') },
            'role': 'option',
            'x-show'() {
                // we need to hide it if it's doesnt have any child  
                return true;
            },
        });
    }

    /*--------------------------------------
     * button part directive handler
     * -------------------------------------        
     */
    function handleButton(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-ref': '__button',
            'x-bind:id'() { return this.$id('rover-button') },
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

    /*--------------------------------------
     * empty state directive handler
     * -------------------------------------        
     */
    function handleEmptyState(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-bind:id'() { return this.$id('rover-button') },

            'tabindex': '-1',
            'aria-haspopup': 'true',
            // more missing dynamic features 
            'x-show'() {
                return Array.isArray(this.__filteredKeys) && this.__filteredKeys.length === 0 && this.__searchQuery.length > 0;
            }
        });
    }

    /*--------------------------------------
     * loading state directive handler
     * -------------------------------------        
     */
    function handleIsLoading(Alpine: Alpine, el: AlpineType.ElementWithXAttributes, modifiers: AlpineType.DirectiveData['modifiers']) {

        // get the current alpine scope of the el.
        let data = Alpine.$data(el);

        if (modifiers.filter((item: string) => item === 'hide')) {
            // 
        }

        if (data) {
            // @todo
        }

    }

    /*-------------------------------------
    * separator directive handler
    * -------------------------------------        
    */
    function handleSeparator(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-init'() {
                this.$el.dataset.slot = 'rover-separator';

                if (!document.querySelector('#rover-separator-styles')) {

                    const style = document.createElement('style');

                    style.id = 'rover-separator-styles';

                    style.textContent = CSS_TEXT;

                    document.head.appendChild(style);
                }
            }
        });
    }
}