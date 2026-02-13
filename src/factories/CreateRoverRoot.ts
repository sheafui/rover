import RoverCollection from "../core/RoverCollection";

import type { default as AlpineType } from "alpinejs";
import { Item, RoverRootData } from "src/types";
import { SLOT_NAME as OPTION_SLOT_NAME } from "./CreateRoverOption";
import { createInputManager } from "src/Managers/InputManager";
import { createOptionManager } from "src/Managers/OptionManager";
import { createOptionsManager } from "src/Managers/OptionsManager";

export default function CreateRoverRoot(
    {
        // el,
        effect
    }: {
        // el: AlpineType.ElementWithXAttributes,
        effect: AlpineType.DirectiveUtilities['effect']
    }
): RoverRootData {

    const collection = new RoverCollection();

    const SLOT_NAME = 'rover-root';

    return {
        collection,
        // cache
        __optionsEls: undefined,
        __groupsEls: undefined,

        // states
        __isOpen: false,
        __isTyping: false,
        __isLoading: false,
        __o_id: -1,
        __g_id: -1,
        __s_id: -1,
        __static: false,
        __keepActivated: true,
        __optionsEl: undefined,
        __activatedKey: undefined,
        __selectedKeys: undefined,
        __items: [],
        __searchQuery: '',
        __filteredKeys: null,
        __filteredKeysSet: new Set<string>(),

        // rover managers 
        __inputManager: undefined,
        __optionsManager: undefined,
        __optionManager: undefined,

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
        init() {
            this.$el.dataset.slot = SLOT_NAME;


            this.__setupManagers();

            this.__handleSharedInputEvents();

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

                    // const selectedKeys = new Set(Array.isArray(this.__selectedKeys)
                    //     ? this.__selectedKeys
                    //     : this.__selectedKeys
                    //         ? [this.__selectedKeys]
                    //         : []
                    // );

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

                            // if (selectedKeys.has(key)) {
                            //     htmlOpt.setAttribute('aria-selected', 'true');
                            //     htmlOpt.setAttribute('data-selected', 'true');
                            // } else {
                            //     htmlOpt.setAttribute('aria-selected', 'false');
                            //     htmlOpt.removeAttribute('data-selected');
                            // }
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

            // this.__registerEventsDelector();

            // if there is not input tied with this rover, keep always open true
            this.$nextTick(() => {
                if (!this.$refs.__input) {
                    this.__isOpen = true;
                }
            });
        },

        __setupManagers() {
            this.__inputManager = createInputManager(this);

            this.__optionManager = createOptionManager(this);

            this.__optionsManager = createOptionsManager(this);
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

        __startTyping() {
            this.__isTyping = true
        },

        __stopTyping() {
            this.__isTyping = false
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

        __handleSharedInputEvents() {

            this.__inputManager.on('focus', () => {
                this.__startTyping();
            })

            this.__inputManager.on('input', () => {
                if (this.__isTyping) {
                    this.__open();
                }
            });

            this.__inputManager.on('blur', () => {
                this.__stopTyping();
            });

            this.__inputManager.on('keydown', (e: KeyboardEvent) => {

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
                    case 'Escape':
                        e.preventDefault(); e.stopPropagation();

                        this.__close();

                        this.$nextTick(() => this.$refs?.__input?.focus({ preventScroll: true }))
                        break;
                    default:
                        break;
                }
            });

            // this.$refs.__input.addEventListener('focus', () => {
            //     // on flat variant we need to activate the first key as
            //     //  soon as the user focus the input
            //     this.__startTyping();
            // })

            // this.$refs.__input.addEventListener('input', (e: InputEvent) => {
            //     e.stopPropagation();

            //     if (this.__isTyping) {
            //         this.__open();
            //     }
            // });

            // this.$refs.__input.addEventListener('blur', () => {
            //     this.__stopTyping();
            // });

            // this.$refs.__input.addEventListener('keydown', (e: KeyboardEvent) => {

            //     switch (e.key) {
            //         case 'ArrowDown':
            //             e.preventDefault(); e.stopPropagation();
            //             if (!this.__isOpen) {
            //                 this.__open()
            //                 break;
            //             }
            //             this.__activateNext();
            //             break;

            //         case 'ArrowUp':
            //             e.preventDefault(); e.stopPropagation();

            //             if (!this.__isOpen) {
            //                 this.__open()
            //                 break;
            //             }

            //             this.__activatePrev();
            //             break;

            //         case 'Enter':
            //             e.preventDefault(); e.stopPropagation();

            //             this.__selectActive()

            //             this.__stopTyping()

            //             if (!this.__isMultiple) {
            //                 this.__close()
            //                 this.__resetInput()
            //             }

            //             break;
            //         default:
            //             if (this.__static) return;

            //             this.__open();

            //             break;
            //     }
            // });
        },
        destroy() {
            this.__inputManager?.destroy();
        }
    }
}