import { extractProp, type Alpine } from "alpinejs";
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
        { value, modifiers, expression }: AlpineType.DirectiveData,
        { Alpine, effect, evaluate }: AlpineType.DirectiveUtilities
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
            case 'option': handleOption(Alpine, el, expression, evaluate);
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
            'x-ref': '__input',
            'x-model': '__searchQuery',
            'x-bind:id'() { return this.$id('rover-input') },
            'role': 'combobox',
            'tabindex': '0',
            'aria-autocomplete': 'list',
        });
    }

    function handleOptions(el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-ref': '__options',
            'x-bind:id'() { return this.$id('rover-options') },
            'role': 'listbox',
            'x-init'() {
                if (Alpine.bound(this.$el, 'keepActivated')) {
                    this.__keepActivated = true;
                }
            }
        })
    }

    function handleOption(
        Alpine: Alpine,
        el: AlpineType.ElementWithXAttributes,
        expression: AlpineType.DirectiveData['expression'],
        evaluate: AlpineType.DirectiveUtilities['evaluate']
    ) {
        Alpine.bind(el, {
            'x-id'() { return ['rover-option'] },
            'x-bind:id'() { return this.$id('rover-option') },
            'role': 'option',
            'x-data'(this: RoverOptionContext) {
                let value: string | null = null;

                console.log(Alpine.extractProp(el, 'value', ''));
                
                if (expression !== '') {
                    value = evaluate(expression)
                }

                return CreateRoverOption(Alpine, this.__nextOptionId(), value);
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
                return this.$id('rover-group')
            },
            'role': 'group',
            'x-init'(this: RoverRootContext) {
                const groupId = this.$id('rover-group')

                this.$el.setAttribute('aria-labelledby', `${groupId}-label`)

                const id = String(this.__nextGroupId());
                this.$el.dataset.key = id;
                this.__pushGroupToItems(id);
            },
        })
    }

    function handleButton(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-ref': '__button',
            'x-bind:id'() { return this.$id('rover-button') },
            'tabindex': '-1',
            'aria-haspopup': 'true',
        })
    }

    function handleEmptyState(Alpine: Alpine, el: AlpineType.ElementWithXAttributes) {
        Alpine.bind(el, {
            'x-bind:id'() { return this.$id('rover-button') },
            'tabindex': '-1',
            'aria-haspopup': 'true',
            'x-show'() {
                return Array.isArray(this.__filteredKeys) && this.__filteredKeys.length === 0 && this.__searchQuery.length > 0;
            }
        });
    }

    function handleIsLoading(Alpine: Alpine, el: AlpineType.ElementWithXAttributes, modifiers: AlpineType.DirectiveData['modifiers']) {
        let data = Alpine.$data(el);

        if (modifiers.filter((item: string) => item === 'hide')) {
            // 
        }

        if (data) {
            // @todo
        }
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