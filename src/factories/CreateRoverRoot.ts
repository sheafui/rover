import RoverCollection from "../core/RoverCollection";

import type { default as AlpineType } from "alpinejs";
import { RoverRootData } from "src/types";
import { SLOT_NAME as OPTION_SLOT_NAME } from "./CreateRoverOption";
export default function CreateRoverRoot(
    { el, effect }: { el: AlpineType.ElementWithXAttributes, effect: AlpineType.DirectiveUtilities['effect'] }
): RoverRootData {

    const collection = new RoverCollection();

    type CompareByFn = (a: unknown, b: unknown) => boolean;
    
    const SLOT_NAME = 'rover-root';

    return {
        __state: null,
        __isOpen: false,
        __isMultiple: false,
        __isTyping: false,
        __isLoading: false,
        __uid: 0,

        // for component like command pallate where the input is on the popover 
        // we need to ignore the open/close internally
        // that why this flag exists
        __static: false,

        // this is responsible when the user leave the options area, if this true it
        //  keeps the old activated element activated and not otherwise 
        __keepActivated: true,
        __optionsEl: undefined,
        __compareBy: undefined,
        __activedKey: undefined,
        __selectedKeys: undefined,
        __filteredKeys: null,
        __isDisabled: false,

        // search 
        __searchQuery: '',

        __add: (k: string, v: string, d: boolean) => collection.add(k, v, d),
        __forget: (k: string) => collection.forget(k),
        __activate: (k: string) => collection.activate(k),
        __isActive: (k: string) => collection.isActivated(k),
        __deactivate: () => collection.deactivate(),
        __getValueByKey: (k: string) => collection.getValueByKey(k),

        // navigation:
        __activateNext: () => collection.activateNext(),
        __activatePrev: () => collection.activatePrev(),
        __activateFirst: () => collection.activateFirst(),
        __activateLast: () => collection.activateLast(),

        // visibilty
        __isVisible(key: string) {

            // if the search isn't active always show all options
            if (this.__searchQuery === '') return true;

            if (!this.__filteredKeys) return true;

            return this.__filteredKeys.includes(key);
        },

        init() {

            this.$el.dataset.slot = SLOT_NAME;

            effect(() => {
                this.__isLoading = collection.pending.state;
            });

            effect(() => {
                this.__activedKey = collection.getKeyByIndex(collection.activeIndex.value);
            })

            effect(() => {

                let results = collection.search(this.__searchQuery).map((result) => result.key);

                console.log(collection.navIndex);
                if (results.length >= 0) {
                    this.__filteredKeys = results
                } else {
                    this.__filteredKeys = null;
                }

                if (
                    this.__activedKey &&
                    this.__filteredKeys &&
                    !this.__filteredKeys.includes(this.__activedKey)
                ) {
                    collection.deactivate();
                }

                if (
                    this.__isOpen &&
                    !collection.getActiveItem() &&
                    this.__filteredKeys &&
                    this.__filteredKeys.length
                ) {
                    collection.activate(this.__filteredKeys[0]);
                }
            });



            if (this.__isMultiple) {
                this.__selectedKeys = [];
            } else {
                this.__selectedKeys = null;
            }

            this.__isMultiple = Alpine.extractProp(el, 'multiple', false) as boolean;

            this.__isDisabled = Alpine.extractProp(el, 'disabled', false) as boolean;

            this.__compareBy = Alpine.extractProp(el, 'by', '') as string;

            const initialValueFallback: Array<string> | string = this.__isMultiple ? [] : '';

            // @ts-expect-error - Alpine.extractProp types are too restrictive, awaiting fix
            let initialValue = Alpine.extractProp(el, 'initial-value', initialValueFallback);

            this.__state = initialValue;

            this.__registerEventsDelector();


            // if there is not input tied with this rover, keep always open true
            // if (!this.$refs.__input) {
            //     this.__isOpen = true;
            // }
        },

        __open() {
            if (this.__isOpen) return

            this.__isOpen = true;

            let input = this.$refs.__input;

            requestAnimationFrame(() => {
                input.focus({ preventScroll: true });
                this.__activateSelectedOrFirst();
            })
        },

        __activateSelectedOrFirst(activateSelected = true) {
            if (!this.__isOpen) return;

            // If something is already active from keyboard, don't override
            let activeItem = collection.getActiveItem();
            if (activeItem) return;

            // Try to activate the first selected item
            if (activateSelected && this.__selectedKeys) {
                const keyToActivate = this.__isMultiple
                    ? this.__selectedKeys[0]
                    : this.__selectedKeys;

                if (keyToActivate) {
                    this.__activate(keyToActivate);

                    //@todo: Scroll into the view'ss container port... 
                    return;
                }
            }

            collection.activateFirst();
        },

        __close() {

            this.__isOpen = false;

            this.__deactivate()
        },

        __handleSelection(key: string) {
            let value = this.__getValueByKey(key);

            if (!this.__isMultiple) {
                this.__selectedKeys = key;

                if (this.__state === value) {
                    this.__state = null;
                    this.__selectedKeys = null;
                } else {
                    this.__state = value;
                }

                if (!this.__static) {
                    this.__close();
                }

                return;
            }

            if (!Array.isArray(this.__selectedKeys)) {
                this.__selectedKeys = [];
            }

            if (!Array.isArray(this.__state)) {
                this.__state = [];
            }

            let index = this.__state.findIndex((j: unknown) => this.__compare(j, value));

            let keyIndex = this.__selectedKeys.indexOf(key);

            if (index === -1) {
                this.__state.push(value);
                this.__selectedKeys.push(key);
            } else {
                this.__state.splice(index, 1);
                this.__selectedKeys.splice(keyIndex, 1);
            }
        },

        __selectActive() {
            if (!this.__activedKey) return;

            this.__handleSelection(this.__activedKey);
        },
        __startTyping() {
            this.__isTyping = true
        },
        __stopTyping() {
            this.__isTyping = false
        },
        __resetInput() {
            let input = this.$refs.__input;

            if (!input) return;

            let value = this.__getCurrentValue();

            input.value = value;
        },
        __getCurrentValue() {

            if (!this.$refs.__input) return '';

            if (!this.__state) return '';

            // if (this.__displayValue) return this.__displayValue(this.__state)

            if (typeof this.__state === 'string') return this.__state;

            return ''
        },

        __compare(a: unknown, b: unknown): boolean {
            let by: CompareByFn = this.__compareBy as CompareByFn;

            if (!this.__compareBy) {
                by = (a: unknown, b: unknown) => Alpine.raw(a) === Alpine.raw(b);
            }

            else if (typeof this.__compareBy === 'string') {
                const property = this.__compareBy;
                by = (a: unknown, b: unknown) => {

                    if ((!a || typeof a !== 'object') || (!b || typeof b !== 'object')) {
                        return Alpine.raw(a) === Alpine.raw(b);
                    }

                    const objA = a as Record<string, unknown>;
                    const objB = b as Record<string, unknown>;

                    return objA[property] === objB[property];
                };
            }

            return by(a, b);
        },

        __nextId() {
            return ++this.__uid;
        },

        __registerEventsDelector() {

            const findClosestOption = (el: Element) => Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME);

            const delegate = (handler: (optionEl: HTMLElement) => void) => {
                return function (e: Event) {
                    e.stopPropagation();

                    if (!(e.target instanceof Element)) return;

                    const optionEl = findClosestOption(e.target);

                    if (!optionEl) return;

                    handler(optionEl as HTMLElement);
                };
            };

            this.$nextTick(() => {

                this.__optionsEl = this.$refs.__options;

                if (!this.__optionsEl) return;

                this.__optionsEl.addEventListener('click',
                    delegate((optionEl) => {
                        if (!optionEl.dataset.key) return;  // Add safety check

                        this.__handleSelection(optionEl.dataset.key);

                        if (!this.__isMultiple && !this.__static) {
                            this.__close()
                            this.__resetInput()
                        }

                        this.$nextTick(() => this.$refs?.__input?.focus({ preventScroll: true }))
                    })
                );

                this.__optionsEl.addEventListener('mouseover',
                    delegate((optionEl) => {
                        if (!optionEl.dataset.key) return;
                    //    this activate didn't get autocomplete why ? 
                        this.__activate(optionEl.dataset.key);
                    })
                );

                this.__optionsEl.addEventListener('mousemove',
                    delegate((optionEl) => {
                        if (this.__isActive(optionEl.dataset.key || '')) return;
                        if (!optionEl.dataset.key) return;
                        this.__activate(optionEl.dataset.key);
                    })
                );

                this.__optionsEl.addEventListener('mouseout',
                    delegate(() => {
                        if (this.__keepActivated) return;
                        this.__deactivate();
                    })
                );

                // listen on the root level

                this.$root.addEventListener('keydown', (e: KeyboardEvent) => {

                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault(); e.stopPropagation();
                            this.__activateNext();
                            break;

                        case 'ArrowUp':
                            e.preventDefault(); e.stopPropagation();
                            this.__activatePrev();
                            break;

                        case 'Enter':
                            e.preventDefault(); e.stopPropagation();
                            this.__selectActive()
                            if (!this.__isMultiple) {
                                this.__close()
                                this.__resetInput()
                            }
                            break;
                         case 'Escape':
                            e.preventDefault(); e.stopPropagation();
                            this.__close();
                            this.$nextTick(() => this.$refs?.__input?.focus({ preventScroll: true }))
                            break;
                        default:
                            if (this.__static) return;

                            this.__open();

                            break;

                    }
                });
            });
        },
    }
}
