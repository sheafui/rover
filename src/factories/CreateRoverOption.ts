import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

export default function CreateRoverOption(Alpine: AlpineType, nextId: string): RoverOptionData {

    const SLOT_NAME = 'rover-option';

    return {
        __uniqueKey: 'option-' + nextId,

        init(this: RoverOptionContext) {

            this.$el.dataset.slot = SLOT_NAME;

            let value = Alpine.extractProp(this.$el, 'value', '') as string;

            this.$el.dataset.key = this.__uniqueKey;

            this.$el.dataset.value = value;

            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            this.__add(this.__uniqueKey, value, disabled);

            this.$watch('__activedKey', (activeKey: string) => {
                if (activeKey === this.__uniqueKey) {
                    this.$el.setAttribute('data-active', 'true');
                } else {
                    this.$el.removeAttribute('data-active');
                }
            });

            this.$watch('__selectedKeys', (selectedKeys: string | string[]) => {

                let thisElHasBeenSelected = false;

                if (!this.__isMultiple) {
                    thisElHasBeenSelected = selectedKeys === this.__uniqueKey;
                } else {
                    thisElHasBeenSelected = Array.isArray(selectedKeys) && selectedKeys.includes(this.__uniqueKey);
                }

                if (thisElHasBeenSelected) {
                    this.$el.setAttribute('aria-selected', 'true');
                    this.$el.setAttribute('data-selected', 'true');
                } else {
                    this.$el.setAttribute('aria-selected', 'false');
                    this.$el.removeAttribute('data-selected');
                }
            });

            this.$nextTick((): void => {
                if (disabled) {
                    this.$el.setAttribute('tabindex', '-1');
                }
            });
        },

        destroy() {
            this.__forget(this.__uniqueKey);
        }
    }
}