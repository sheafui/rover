export default function CreateComboboxOption(Alpine, nextId, effect) {

    const SLOT_NAME = 'option';

    return {
        __uniqueKey: 'option-' + nextId,

        init() {

            this.$el.dataset.slot = SLOT_NAME;

            let value = Alpine.extractProp(this.$el, 'value');
            
            this.$el.dataset.key = this.__uniqueKey;

            this.$el.dataset.value = value;

            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false);

            this.__add(this.__uniqueKey, value, disabled);

            // I am not sure if this is the most efficient way to detect if this is the active or selected element
            // but I will keep as @todo while I am building this project... 
            // let's continue the implementation fist
            this.$watch('__activedKey', (activeKey) => {
                if (activeKey === this.__uniqueKey) {
                    this.$el.setAttribute('data-active', true);
                } else {
                    this.$el.removeAttribute('data-active');
                }
            });

            this.$watch('__selectedKeys', (selectedKeys) => {

                let thisElHasBeenSelected = false;

                if (!this.__isMultiple) {
                    thisElHasBeenSelected = selectedKeys === this.__uniqueKey;
                } else {
                    thisElHasBeenSelected = selectedKeys.includes(this.__uniqueKey);
                }

                if (thisElHasBeenSelected) {
                    this.$el.setAttribute('aria-selected', true);
                    this.$el.setAttribute('data-selected', true);
                } else {
                    this.$el.setAttribute('aria-selected', false);
                    this.$el.removeAttribute('data-selected');

                }
            })

            this.$nextTick(() => {
                if (disabled) {
                    this.$el.setAttribute('tabindex', -1);
                }
            })
        },

        destroy() {
            this.__forget(this.__uniqueKey);
        }
    }
}