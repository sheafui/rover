import RoverCollection from "../core/RoverCollection";

import type { default as AlpineType } from "alpinejs";
import { Item, RoverRootData } from "src/types";
import { createInputManager } from "src/Managers/InputManager";
import { createOptionManager } from "src/Managers/OptionManager";
import { createOptionsManager } from "src/Managers/OptionsManager";
import { createButtonManager } from "src/Managers/ButtonManager";

export default function CreateRoverRoot(
    {
        effect
    }: {
        effect: AlpineType.DirectiveUtilities['effect']
    }
): RoverRootData {

    const collection = new RoverCollection();

    const SLOT_NAME = 'rover-root';

    return {
        __collection: collection,
        // cache
        __optionsEls: undefined,
        __groupsEls: undefined,

        // states
        __isOpen: false,
        __isTyping: false,
        __isLoading: false,
        __g_id: -1,
        __s_id: -1,
        __static: false,
        __keepActivated: true,
        __optionsEl: undefined,
        __prevActivatedValue: undefined, // it's purpose is part of the activation optimizer
        __activatedValue: undefined,
        __items: [],
        _x__searchQuery: '',
        __filteredValues: null,
        __filteredValuesSet: new Set<string>(),
        // rover managers 
        __inputManager: undefined,
        __optionsManager: undefined,
        __optionManager: undefined,
        __buttonManager: undefined,

        __add: (value: string, disabled: boolean) => collection.add(value, disabled),
        __forget: (value: string) => collection.forget(value),
        __activate: (value: string) => collection.activate(value),
        __deactivate: () => collection.deactivate(),
        __isActive: (value: string) => collection.isActivated(value),
        __getActiveItem: () => collection.getActiveItem(),
        __activateNext: () => collection.activateNext(),
        __activatePrev: () => collection.activatePrev(),
        __activateFirst: () => collection.activateFirst(),
        __activateLast: () => collection.activateLast(),
        __searchUsingQuery: (query: string) => collection.search(query),
        __getByIndex: (index: number | null | undefined) => collection.getByIndex(index),

        init() {
            this.$el.dataset.slot = SLOT_NAME;

            this.__setupManagers();

            // LOADING STUFF
            effect(() => {
                this.__isLoading = collection.pending.state;
            });

            // SEARCH REACTIVITY
            effect(() => {
                if (String(this._x__searchQuery).length > 0) {
                    let results = this.__searchUsingQuery(this._x__searchQuery)
                        .map((result: Item) => result.value);

                    if (results.length >= 0) {
                        this.__filteredValues = results;
                    }
                } else {
                    this.__filteredValues = null;
                }

                if (this.__activatedValue && this.__filteredValues && !this.__filteredValues.includes(this.__activatedValue)) {
                    this.__deactivate();
                }

                if (this.__isOpen && !this.__getActiveItem() && this.__filteredValues && this.__filteredValues.length) {
                    this.__activate(this.__filteredValues[0]);
                }
            });

            // has two purpose, wait in case of `x-for`, don't overload the initial process 
            // and defer processing this bit to the next steps
            this.$nextTick(() => {
                this.__optionsEls = Array.from(
                    this.$el.querySelectorAll('[x-rover\\:option]')
                ) as Array<HTMLElement>;

                // optmizer: will add intial overhead but make long interaction smoothers
                this.__optionIndex = new Map();

                this.__optionsEls.forEach((el: HTMLElement) => {
                    const v = el.dataset.value;
                    if (v) this.__optionIndex.set(v, el);
                });

                // this.__groupsEls = Array.from(
                //     this.$el.querySelectorAll('[x-rover\\:group]')
                // ) as Array<HTMLElement>;

                // HANDLING INDIVIDUAL OPTION VISIBILITY AND ACTIVE STATE 
                effect(() => {
                    const activeItem = this.__getByIndex(collection.activeIndex.value);

                    const activeValue = this.__activatedValue = activeItem?.value;

                    const visibleValues = this.__filteredValues ? new Set(this.__filteredValues) : null;

                    // batches all DOM updates to the next repaint.
                    // This prevents multiple forced reflows when updating thousands of elements.                    
                    // Removing it causes the browser to recalc styles/layout immediately, massively slowing performance.
                    // without this, it's 50-100x slower at 1000+ items
                    requestAnimationFrame(() => {
                        
                        const s0 = performance.now();
                        const options = this.__optionsEls;

                        options.forEach((opt: HTMLElement) => {
                            const value = opt.dataset.value;

                            if (!value) return;

                            // Update visibility
                            if (visibleValues !== null) {
                                opt.hidden = !visibleValues.has(value);
                            } else {
                                opt.hidden = false;
                            }

                            // Update active state
                            if (value === activeValue) {
                                opt.setAttribute('data-active', 'true');
                                opt.setAttribute('aria-current', 'true');
                                opt.scrollIntoView({ block: 'nearest' });
                            } else {
                                opt.removeAttribute('data-active');
                                opt.removeAttribute('aria-current');
                            }
                        });

                        console.log(performance.now() - s0);

                        // @TODO 
                        // Handle groups visibility based on visible options
                        // const groups = this.__groupsEls;

                        // groups.forEach((group: HTMLElement) => {
                        //     const options = group.querySelectorAll('[x-rover\\:option]');

                        //     // Check if group has any visible options
                        //     const hasVisibleOption = Array.from(options).some((opt: Element) => {
                        //         const htmlOpt = opt as HTMLElement;
                        //         const value = htmlOpt.dataset.value;

                        //         return visibleValues
                        //             ? visibleValues.has(value || '')
                        //             : true;
                        //     });
                        //     group.hidden = !hasVisibleOption;
                        // });
                        this.__prevActivatedValue = activeValue;
                    });
                });
            });
        },

        __setupManagers() {
            this.__inputManager = createInputManager(this);
            this.__optionManager = createOptionManager(this);
            this.__optionsManager = createOptionsManager(this);
            this.__buttonManager = createButtonManager(this);
        },

        __open() {
            if (this.__isOpen) return;

            this.__isOpen = true;

            requestAnimationFrame(() => {
                this.$refs?._x__input?.focus({ preventScroll: true });
            });
        },

        __pushSeparatorToItems(id: string) {
            this.__items.push({
                type: 's',
                id,
            });
        },

        __pushGroupToItems(id: string) {
            this.__items.push({
                type: 'g',
                id,
            });
        },

        __startTyping() {
            this.__isTyping = true;
        },

        __stopTyping() {
            this.__isTyping = false;
        },

        __nextGroupId() {
            return ++this.__g_id;
        },

        __nextSeparatorId() {
            return ++this.__s_id;
        },

        destroy() {
            this.__inputManager?.destroy();
            this.__optionManager?.destroy();
            this.__optionsManager?.destroy();
            this.__buttonManager?.destroy();
        }
    }
}