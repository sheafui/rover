import type { Alpine } from "alpinejs";
import type { default as AlpineType } from "alpinejs";
import CreateRoverOption from "./factories/CreateRoverOption";
import CreateRoverRoot from "./factories/CreateRoverRoot";
import { RoverOptionContext, RoverRootContext } from "./types";
import registerMagics from "./magics";


type RoverValue =
    | null
    | 'input'
    | 'button'
    | 'options'
    | 'option'
    | 'group'
    | 'loading'
    | 'separator'
    | 'empty';

export default function rover(Alpine: Alpine): void {

    Alpine.directive('rover', (
        el: AlpineType.ElementWithXAttributes,
        { value, modifiers }: AlpineType.DirectiveData,
        { Alpine, effect }: AlpineType.DirectiveUtilities
    ) => {
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
            case 'group': handleOptionsGroup(Alpine, el);
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
    }).before('data');

    // magics registration
    registerMagics(Alpine);

    function handleRoot(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes,
        effect: AlpineType.DirectiveUtilities['effect']
    ) {
        // the only reliable and reactive (I found) way to merge underneath datastack in alpine at this point
        // we can use the `addScopeToNode` utility, but it won't be reactive, 
        // and also need the interception features wich is not a public API yet
        Alpine.bind(el, {
            'x-data'() {
                return {
                    ...CreateRoverRoot({ effect })
                }
            }
        });
    }

    function handleInput(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes
    ): void {
        Alpine.bind(el, {
            'x-bind:id'() { return this.$id('rover-input') },
            'tabindex': '0',
            'aria-autocomplete': 'list',
            'x-bind:aria-controls'() { return  },
            'x-bind:aria-activedescendant'() {
                const activeValue = this.__activatedValue;
                if (!activeValue) return undefined;

                return this.__optionIndex?.get(activeValue)?.id ?? undefined;
            },
        });
    }

    function handleOptions(el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-bind:id'() { return this.$id('rover-options') },
            'role': 'listbox',
            'aria-orientation': 'vertical',
            'x-bind:data-loading'() {
                return this.__isLoading;
            }
        })
    }

    function handleOption(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes,
    ) {
        Alpine.bind(el, {
            'x-id'() { return ['rover-option'] },
            'x-bind:id'() { return this.$id('rover-option') },
            'role': 'option',
            'x-bind:aria-disabled'() { return this.$el.hasAttribute('disabled') ? 'true' : 'false' },
            'x-data'(this: RoverOptionContext) {
                return CreateRoverOption(Alpine);
            },
        });
    }

    function handleOptionsGroup(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes
    ) {
        Alpine.bind(el, {
            'x-id'() { return ['rover-group'] },
            'x-bind:id'() {
                return this.$id('rover-group');
            },
            'role': 'group',
            'x-init'(this: RoverRootContext) {
                const groupId = this.$id('rover-group');

                this.$el.setAttribute('aria-labelledby', `${groupId}-label`);
            },
        });
    }

    function handleButton(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-ref': '__button',
            'x-bind:id'() { return this.$id('rover-button') },
            'tabindex': '-1',
        })
    }

    function handleEmptyState(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-bind:id'() { return this.$id('rover-button') },
            'tabindex': '-1',
            'aria-haspopup': 'true',
            'x-show'() {
                return Array.isArray(this.__filteredValues) && this.__filteredValues.length === 0 && this.__inputManager.value.length > 0;
            }
        });
    }

    function handleIsLoading(Alpine: Alpine, el: AlpineType.ElementWithXAttributes, modifiers: AlpineType.DirectiveData['modifiers']) {
        // let data = Alpine.$data(el);

        const shouldHide = modifiers.includes('hide');

        Alpine.bind(el, {
            'x-show'(this: RoverRootContext) {
                return shouldHide ? !this.__isLoading : this.__isLoading;
            },
            'role': 'status',
            'aria-live': 'polite',
            'aria-atomic': 'true',
        });
    }

    function handleSeparator(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-init'(this: RoverRootContext) {

                const id = String(this.__nextSeparatorId());

                this.$el.dataset.key = id;

                this.__pushSeparatorToItems(id);

                this.$el.setAttribute('role', 'separator');
                this.$el.setAttribute('aria-orientation', 'horizontal');
            }
        });
    }
}