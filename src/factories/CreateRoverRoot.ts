import RoverCollection from "../core/RoverCollection";

import type { default as AlpineType } from "alpinejs";
import { Item, RoverInputContext, RoverRootData } from "src/types";
import { SLOT_NAME as OPTION_SLOT_NAME } from "./CreateRoverOption";
import { input } from "src/InputManager";

export default function CreateRoverRoot(
    { el,
        effect
    }: {
        el: AlpineType.ElementWithXAttributes,
        effect: AlpineType.DirectiveUtilities['effect']
    }
): RoverRootData {

    const collection = new RoverCollection();

    type CompareByFn = (a: unknown, b: unknown) => boolean;

    const SLOT_NAME = 'rover-root';

    return {
        collection,
        // cache
        __optionsEls: undefined,
        __groupsEls: undefined,
        // states
        __state: null,
        __isOpen: false,
        __isMultiple: false,
        __isTyping: false,
        __isLoading: false,
        __o_id: -1,
        __g_id: -1,
        __s_id: -1,
        __static: false,
        __keepActivated: true,
        __optionsEl: undefined,
        __compareBy: undefined,
        __activatedKey: undefined,
        __selectedKeys: undefined,
        __isDisabled: false,
        __items: [],
        __searchQuery: '',
        __filteredKeys: null,
        __filteredKeysSet: new Set<string>(),

        __add: (k: string, v: string, d: boolean) => collection.add(k, v, d),
        __forget: (k: string) => collection.forget(k),
        __activate: (k: string) => collection.activate(k),
        __deactivate: () => collection.deactivate(),
        __isActive: (k: string) => collection.isActivated(k),
        __getValueByKey: (k: string) => collection.getValueByKey(k),
        __getActiveItem: () => collection.getActiveItem(),
        __activateNext: () => collection.activateNext(),
        __activatePrev: () => collection.activatePrev(),
        __activateFirst: () => collection.activateFirst(),
        __activateLast: () => collection.activateLast(),
        __searchUsingQuery: (query: string) => collection.search(query),
        __getKeyByIndex: (index: number) => collection.getKeyByIndex(index),

        __onOpenCallback: () => { },
        __onOpen(callback: () => void) {
            this.__onOpenCallback = callback;
        },
        __onCloseCallback: () => { },
        __onClose(callback: () => void) {
            this.__onCloseCallback = callback;
        },
        onkeydown: (handler: (event: KeyboardEvent, key: string | null) => void) => {
            this.$root.addEventListener('keydown', (event: KeyboardEvent) => {
                const activeKey = this.__activatedKey || null;
                handler(event, activeKey);
            });
        },
        init() {
            this.$el.dataset.slot = SLOT_NAME;

            // LOADING STUFF
            effect(() => {
                this.__isLoading = collection.pending.state;
            });

            // SYNC ACTIVATED KEY
            effect(() => {
                this.__activatedKey = this.__getKeyByIndex(collection.activeIndex.value);
            });

            // SEARCH REACTIVITY
            effect(() => {
                if (String(this.__searchQuery).length > 0) {
                    let results = this.__searchUsingQuery(this.__searchQuery).map((result: Item) => result.key);

                    if (results.length >= 0) {
                        this.__filteredKeys = results;
                    }
                } else {
                    this.__filteredKeys = null;
                }

                if (this.__activatedKey && this.__filteredKeys && !this.__filteredKeys.includes(this.__activatedKey)) {
                    this.__deactivate();
                }

                if (this.__isOpen && !this.__getActiveItem() && this.__filteredKeys && this.__filteredKeys.length) {
                    this.__activate(this.__filteredKeys[0]);
                }
            });


            this.$nextTick(() => {
                this.__optionsEls = Array.from(
                    this.$el.querySelectorAll('[data-slot=rover-option]')
                ) as HTMLElement[];

                this.__groupsEls = Array.from(
                    this.$el.querySelectorAll('[data-slot=rover-group]')
                ) as HTMLElement[];

                // HANDLING INDIVIDUAL OPTION VISIBILITY, SELECTION, ACTIVE STATE 
                effect(() => {
                    const activeKey = this.__activatedKey;
                    const visibleKeys = this.__filteredKeys ? new Set(this.__filteredKeys) : null;

                    const selectedKeys = new Set(Array.isArray(this.__selectedKeys)
                        ? this.__selectedKeys
                        : this.__selectedKeys
                            ? [this.__selectedKeys]
                            : []
                    );

                    // Batch all DOM updates
                    requestAnimationFrame(() => {

                        const options = this.__optionsEls;

                        options.forEach((opt: Element) => {
                            const htmlOpt = opt as HTMLElement;
                            const key = htmlOpt.dataset.key;

                            if (!key) return;

                            if (visibleKeys !== null) {
                                htmlOpt.hidden = !visibleKeys.has(key);
                            } else {
                                htmlOpt.hidden = false;
                            }

                            if (key === activeKey) {
                                htmlOpt.setAttribute('data-active', 'true');
                                htmlOpt.setAttribute('aria-current', 'true');

                                // Scroll into view if needed
                                htmlOpt.scrollIntoView({ block: 'nearest' });

                            } else {
                                htmlOpt.removeAttribute('data-active');
                                htmlOpt.removeAttribute('aria-current');
                            }

                            if (selectedKeys.has(key)) {
                                htmlOpt.setAttribute('aria-selected', 'true');
                                htmlOpt.setAttribute('data-selected', 'true');
                            } else {
                                htmlOpt.setAttribute('aria-selected', 'false');
                                htmlOpt.removeAttribute('data-selected');
                            }
                        });

                        // handle groups visibility based on visible options
                        const groups = this.__groupsEls;

                        groups.forEach((group: Element) => {
                            const htmlGroup = group as HTMLElement;
                            const options = htmlGroup.querySelectorAll('[data-slot=rover-option]');

                            // Check if group has any visible options
                            const hasVisibleOption = Array.from(options).some((opt: Element) => {

                                const htmlOpt = opt as HTMLElement;

                                return visibleKeys
                                    ? visibleKeys.has(htmlOpt.dataset.key || '')
                                    : true;
                            });

                            htmlGroup.hidden = !hasVisibleOption;
                        });
                    });
                });
            });

            this.__isDisabled = Alpine.extractProp(el, 'disabled', false) as boolean;
            this.__compareBy = Alpine.extractProp(el, 'by', '') as string;

            this.__registerEventsDelector();

            this.$nextTick(() => {
                if (this.$refs.__input) {
                    this.__handleInputEvents();
                }
            });

            // if there is not input tied with this rover, keep always open true
            this.$nextTick(() => {
                if (!this.$refs.__input) {
                    this.__isOpen = true;
                }
            });
        },
        __open() {
            if (this.__isOpen) return

            this.__isOpen = true;

            requestAnimationFrame(() => {
                this.$refs?.__input?.focus({ preventScroll: true });
            })

            this.__onOpenCallback();
        },

        __pushSeparatorToItems(key: string) {
            this.__items.push({
                type: 's',
                key,
            });
        },

        __pushGroupToItems(key: string) {
            this.__items.push({
                type: 'g',
                key,
            });
        },

        __pushOptionToItems(key: string) {
            this.__items.push({
                type: 'o',
                key,
            });
        },

        __close() {
            this.__isOpen = false;
            this.__deactivate();
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
                console.log(this.__state);

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
            if (!this.__activatedKey) return;
            this.__handleSelection(this.__activatedKey);
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
            if (typeof this.__state === 'string') return this.__state;
            return ''
        },

        __compare(a: unknown, b: unknown): boolean {
            let by: CompareByFn = this.__compareBy as CompareByFn;

            if (!this.__compareBy) {
                by = (a: unknown, b: unknown) => Alpine.raw(a) === Alpine.raw(b);
            } else if (typeof this.__compareBy === 'string') {
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

        __nextOptionId() {
            return ++this.__o_id;
        },

        __nextGroupId() {
            return ++this.__g_id;
        },

        __nextSeparatorId() {
            return ++this.__s_id;
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
                        if (!optionEl.dataset.key) return;

                        // this.__handleSelection(optionEl.dataset.key);

                        this.$nextTick(() => this.$refs?.__input?.focus({ preventScroll: true }))
                    })
                );

                this.__optionsEl.addEventListener('mouseover',
                    delegate((optionEl) => {
                        if (!optionEl.dataset.key) return;
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

                // this.$root.addEventListener('keydown', (e: KeyboardEvent) => {
                //     switch (e.key) {
                //         case 'ArrowDown':
                //             e.preventDefault(); e.stopPropagation();
                //             this.__activateNext();
                //             break;

                //         case 'ArrowUp':
                //             e.preventDefault(); e.stopPropagation();
                //             this.__activatePrev();
                //             break;

                //         case 'Enter':
                //             e.preventDefault(); e.stopPropagation();
                //             this.__selectActive()
                //             if (!this.__isMultiple) {
                //                 this.__close()
                //                 this.__resetInput()
                //             }
                //             break;

                //         case 'Escape':
                //             e.preventDefault(); e.stopPropagation();
                //             this.__close();
                //             this.$nextTick(() => this.$refs?.__input?.focus({ preventScroll: true }))
                //             break;

                //         default:
                //             if (this.__static) return;
                //             this.__open();
                //             break;
                //     }
                // });
            });
        },

        __handleInputEvents() {

            this.$refs.__input.addEventListener('focus', () => {
                // on flat variant we need to activate the first key as
                //  soon as the user focus the input
                this.__startTyping();
            })

            this.$refs.__input.addEventListener('input', (e: InputEvent) => {
                e.stopPropagation();

                if (this.__isTyping) {
                    this.__open();
                }
            });

            this.$refs.__input.addEventListener('blur', () => {
                this.__stopTyping();
            });

            this.$refs.__input.addEventListener('keydown', (e: KeyboardEvent) => {

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault(); e.stopPropagation();
                        if (!this.__isOpen) {
                            this.__open()
                            break;
                        }
                        this.__activateNext();
                        break;

                    case 'ArrowUp':
                        e.preventDefault(); e.stopPropagation();

                        if (!this.__isOpen) {
                            this.__open()
                            break;
                        }

                        this.__activatePrev();
                        break;

                    case 'Enter':
                        e.preventDefault(); e.stopPropagation();

                        this.__selectActive()

                        this.__stopTyping()

                        if (!this.__isMultiple) {
                            this.__close()
                            this.__resetInput()
                        }

                        break;
                    default:
                        if (this.__static) return;

                        this.__open();

                        break;
                }
            });
        },
        ...input(),
    }
}