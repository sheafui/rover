import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

export const SLOT_NAME = 'rover-option';

export default function CreateRoverOption(Alpine: AlpineType, id: number, dirValue: string | null): RoverOptionData {
    return {
        __uniqueKey: 'option-' + id,
        __isVisible: true,

        init(this: RoverOptionContext) {
            // Setup element
            this.$el.dataset.slot = SLOT_NAME;
            this.$el.dataset.key = this.__uniqueKey;

            // Extract props
            let value;

            if (dirValue !== null) {
                value = dirValue;
            } else {
                value = Alpine.extractProp(this.$el, 'value', '') as string;
            }

            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            this.$el.dataset.value = value;

            // Add to collection
            this.__add(this.__uniqueKey, value, disabled);
            this.__pushOptionToItems(String(id));

            // Set disabled attribute if needed
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