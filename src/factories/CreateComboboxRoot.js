import ComboboxCollection from "../core/ComboboxCollection";

export default function CreateComboboxRoot({ el, effect }) {

    const collection = new ComboboxCollection();
    
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

        // search 
        __searchQuery: '',

        __add: (k, v, d) => collection.add(k, v, d),
        __forget: (k) => collection.forget(k),
        __activate: (k) => collection.activate(k),
        __isActive: (k) => collection.isActivated(k),
        __deactivate: () => collection.deactivate(),
        __getValueByKey: (k) => collection.getValueByKey(k),
        __getElementByKey: (k) => collection.getElementByKey(k),

        // navigation:
        __activateNext: () => collection.activateNext(),
        __activatePrev: () => collection.activatePrev(),
        __activateFirst: () => collection.activateFirst(),
        __activateLast: () => collection.activateLast(),

        // visibilty
        __isVisible(key) {

            // if the search isn't active always show all options
            if (this.__searchQuery === '') return true;

            if (!this.__filteredKeys) return true;

            return this.__filteredKeys.includes(key);
        },

        init() {

            effect(() => {
                this.__isLoading = collection.pending.state;
            });

            effect(() => {
                this.__activedKey = collection.getKeyByIndex(collection.activeIndex.value);
            })

            effect(() => {

                let results = collection.search(this.__searchQuery).map((result) => result.key);

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



            this.__isMultiple = Alpine.extractProp(el, 'multiple', false)

            this.__isDisabled = Alpine.extractProp(el, 'disabled', false)

            if (this.__isMultiple) {
                this.__selectedKeys = [];
            } else {
                this.__selectedKeys = null;
            }

            this.__compareBy = Alpine.extractProp(el, 'by')

            let defaultValue = Alpine.extractProp(el, 'default-value', this.__isMultiple ? [] : null)

            this.__state = defaultValue;

            this.__registerEventsDelector();
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

                    // Scroll into the view'ss container port... @todo
                    return;
                }
            }

            collection.activateFirst();
        },

        __close() {

            this.__isOpen = false;

            this.__deactivate()
        },

        __handleSelection(key) {
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
                    // this.__close();
                }

                return;
            }

            if (!Array.isArray(this.__selectedKeys)) {
                this.__selectedKeys = [];
            }

            if (!Array.isArray(this.__state)) {
                this.__state = [];
            }

            let index = this.__state.findIndex(j => this.__compare(j, value));

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

        __compare(a, b) {

            let by = this.__compareBy;

            if (!by) by = (a, b) => Alpine.raw(a) === Alpine.raw(b)

            if (typeof by === 'string') {
                let property = by
                by = (a, b) => {
                    if ((!a || typeof a !== 'object') || (!b || typeof b !== 'object')) {
                        return Alpine.raw(a) === Alpine.raw(b)
                    }


                    return a[property] === b[property];
                }
            }

            return by(a, b)
        },

        __nextId() {
            return ++this.__uid;
        },

        __registerEventsDelector() {

            const findClosestOption = (el) => Alpine.findClosest(el, node => node.dataset.slot === 'option');

            const delegate = (handler) => {
                return function (e) {
                    e.stopPropagation();

                    const optionEl = findClosestOption(e.target);

                    if (!optionEl) return;

                    handler(optionEl);
                };
            };

            this.$nextTick(() => {

                this.__optionsEl = this.$refs.__options;


                if (!this.__optionsEl) return;

                this.__optionsEl.addEventListener('click',
                    delegate((optionEl) => {

                        this.__handleSelection(optionEl.dataset.key);

                        if (!this.__isMultiple && !this.__static) {
                            this.__close()
                            this.__resetInput()
                        }

                        this.$nextTick(() => this.$refs.__input.focus({ preventScroll: true }))
                    })
                );

                this.__optionsEl.addEventListener('mouseover',
                    delegate((optionEl) => {
                        this.__activate(optionEl.dataset.key);
                    })
                );

                this.__optionsEl.addEventListener('mousemove',
                    delegate((optionEl) => {
                        if (this.__isActive()) return;

                        this.__activate(optionEl.dataset.key);
                    })
                );

                this.__optionsEl.addEventListener('mouseout',
                    delegate(() => {

                        if (this.__keepActivated) return;

                        this.__deactivate();
                    })
                );
            });
        },
    }
}
