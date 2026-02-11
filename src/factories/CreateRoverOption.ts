import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

export const SLOT_NAME = 'rover-option';

export default function CreateRoverOption(Alpine: AlpineType, id: number): RoverOptionData {
    return {
        __uniqueKey: 'option-' + id,
        __isVisible: true,

        init(this: RoverOptionContext) {

            this.$el.dataset.slot = SLOT_NAME;

            let value = Alpine.extractProp(this.$el, 'value', '') as string;

            this.$el.dataset.key = this.__uniqueKey;

            this.$el.dataset.value = value;

            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            this.__add(this.__uniqueKey, value, disabled);

            this.__pushOptionToItems(String(id));

            // thisis clean approach but I am not sure if this is the most acheivable of
            //  clean/efficient tradeoff but I will investigate further
            this.$watch('__activatedKey', (activeKey: string) => {
                if (activeKey === this.__uniqueKey) {
                    this.$el.setAttribute('data-active', 'true');

                    this.$el.scrollIntoView({ behavior: "smooth", block: 'nearest' });
                } else {
                    this.$el.removeAttribute('data-active');
                }
            });

            this.$watch('__searchQuery', () => {
                this.__isVisible = this.__filteredKeys !== null
                    ? this.__filteredKeys.includes(this.__uniqueKey)
                    : true;
            });

            this.$watch('__selectedKeys', (selectedKeys: string | string[]) => {
                let selected = false;

                if (!this.__isMultiple) {
                    selected = selectedKeys === this.__uniqueKey;
                } else {
                    selected = Array.isArray(selectedKeys) && selectedKeys.includes(this.__uniqueKey);
                }

                if (selected) {
                    this.$el.setAttribute('aria-selected', 'true');
                    this.$el.setAttribute('data-selected', 'true');
                } else {
                    this.$el.setAttribute('aria-selected', 'false');
                    this.$el.removeAttribute('data-selected');
                }
            });

            this.$watch('__isVisible', (visibility) => {
                this.$el.hidden = !visibility;
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