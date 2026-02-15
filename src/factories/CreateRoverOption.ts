import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

export default function CreateRoverOption(Alpine: AlpineType): RoverOptionData {
    return {
        init(this: RoverOptionContext) {

            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            let value = Alpine.extractProp(this.$el, 'value', '') as string;
            
            this.$el.dataset.value = value;

            // Add to collection
            this.__add(value, disabled);

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