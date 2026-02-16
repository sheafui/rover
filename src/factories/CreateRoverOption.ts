import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

export default function CreateRoverOption(Alpine: AlpineType): RoverOptionData {
    return {
        init(this: RoverOptionContext) {

            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            let value = Alpine.extractProp(this.$el, 'value', '') as string;

            const rawSearch = Alpine.extractProp(this.$el, 'data-search', value) as string;

            const normalizedSearch = String(rawSearch).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

            this.$el.dataset.value = value;

            // it may fails redudant when the search it self is the value, but anyway 
            // we need to normalize each item at search time for better i18n support,
            // as well as it's highly required feature for adding better search actually 
            // even when the search query isn't in the label there
            this.__add(value, normalizedSearch, disabled);

            this.$nextTick(() => {
                if (disabled) {
                    this.$el.setAttribute('tabindex', '-1');
                }
            });
        }
        ,

        destroy() {
            this.__forget(this.__uniqueKey);
        }
    }
}