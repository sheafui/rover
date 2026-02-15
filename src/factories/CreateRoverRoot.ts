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

    return {
        __collection: collection,

        __optionsEls: undefined,
        __groupsEls: undefined,
        __optionIndex: undefined,

        __isOpen: false,
        __isTyping: false,
        __isLoading: false,
        __g_id: -1,
        __s_id: -1,
        __static: false,
        __keepActivated: true,
        __optionsEl: undefined,
        __prevActivatedValue: undefined,
        __activatedValue: undefined,
        __items: [],
        _x__searchQuery: '',
        __filteredValues: null,

        __prevVisibleArray: null as string[] | null,
        __prevActiveValue: undefined,

        __effectRAF: null,

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
            this.__setupManagers();

            effect(() => {
                this.__isLoading = collection.pending.state;
            });

            this.$watch('_x__searchQuery', (query: string) => {
                this.__isLoading = true;

                if (query.length > 0) {
                    const results = this.__searchUsingQuery(query).map((r: Item) => r.value);

                    const prev = this.__filteredValues;

                    const changed = !prev || prev.length !== results.length || results.some((v: unknown, i: number) => v !== prev[i]);

                    if (changed) {
                        this.__filteredValues = results;
                    }
                } else {
                    if (this.__filteredValues !== null) {
                        this.__filteredValues = null;
                    }
                }

                if (this.__activatedValue && this.__filteredValues && !this.__filteredValues.includes(this.__activatedValue)) {
                    this.__deactivate();
                }

                if (this.__isOpen && !this.__getActiveItem() && this.__filteredValues && this.__filteredValues.length) {
                    this.__activate(this.__filteredValues[0]);
                }

                this.__isLoading = false;
            });

            this.$nextTick(() => {
                this.__optionsEls = Array.from(
                    this.$el.querySelectorAll('[x-rover\\:option]')
                ) as Array<HTMLElement>;

                this.__optionIndex = new Map();
                this.__optionsEls.forEach((el: HTMLElement) => {
                    const v = el.dataset.value;
                    if (v) this.__optionIndex.set(v, el);
                });

                effect(() => {
                    const activeItem = this.__getByIndex(collection.activeIndex.value);
                    const activeValue = this.__activatedValue = activeItem?.value;

                    const visibleValuesArray = this.__filteredValues;

                    if (this.__effectRAF) cancelAnimationFrame(this.__effectRAF);

                    this.__effectRAF = requestAnimationFrame(() => {
                        this.patchItemsVisibility(visibleValuesArray);
                        this.patchItemsActivity(activeValue);
                        this.__effectRAF = null;
                    });
                });
            });
        },

        patchItemsVisibility(visibleValuesArray: string[] | null) {

            if (!this.__optionsEls || !this.__optionIndex) return;

            const prevArray = this.__prevVisibleArray;

            if (visibleValuesArray === prevArray) return;

            if (visibleValuesArray === null) {
                if (prevArray === null) return;

                this.__optionsEls.forEach((opt: HTMLElement) => {
                    if (opt.hidden) opt.hidden = false;
                });

                this.__prevVisibleArray = null;
                return;
            }

            const currentSet = new Set(visibleValuesArray);

            const prevSet = prevArray ? new Set(prevArray) : null;

            if (prevSet === null) {
                // First filter - show only matching items
                this.__optionsEls.forEach((opt: HTMLElement) => {
                    const value = opt.dataset.value;
                    if (!value) return;

                    const shouldHide = !currentSet.has(value);
                    if (opt.hidden !== shouldHide) {
                        opt.hidden = shouldHide;
                    }
                });

                this.__prevVisibleArray = visibleValuesArray;
                return;
            }

            // Incremental diff - only update changed items
            for (const value of prevSet) {
                if (!currentSet.has(value as string)) {
                    const el = this.__optionIndex.get(value);
                    if (el) el.hidden = true;
                }
            }

            for (const value of currentSet) {
                if (!prevSet.has(value)) {
                    const el = this.__optionIndex.get(value);
                    if (el) el.hidden = false;
                }
            }

            this.__prevVisibleArray = visibleValuesArray;
        },

        patchItemsActivity(activeValue: string | undefined) {

            const prevActiveValue = this.__prevActiveValue;

            if (prevActiveValue === activeValue) return;

            if (prevActiveValue) {
                const prevOpt = this.__optionIndex.get(prevActiveValue);
                if (prevOpt) {
                    prevOpt.removeAttribute('data-active');
                    prevOpt.removeAttribute('aria-current');
                }
            }

            if (activeValue) {
                const activeOpt = this.__optionIndex.get(activeValue);
                if (activeOpt) {
                    activeOpt.setAttribute('data-active', 'true');
                    activeOpt.setAttribute('aria-current', 'true');

                    requestAnimationFrame(() => {
                        activeOpt.scrollIntoView({ block: 'nearest' });
                    });
                }
            }

            this.__prevActiveValue = activeValue;
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
            this.__items.push({ type: 's', id });
        },

        __pushGroupToItems(id: string) {
            this.__items.push({ type: 'g', id });
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
            if (this.__effectRAF) cancelAnimationFrame(this.__effectRAF);

            this.__inputManager?.destroy();
            this.__optionManager?.destroy();
            this.__optionsManager?.destroy();
            this.__buttonManager?.destroy();
        }
    }
}
