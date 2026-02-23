import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

// Per-option component approach: negligible memory/erformnece cost, massive morphdom win.
// Measurements show zero difference vs shared component, minimal memory overhead.
// The tradeoff: automatic lifecycle integration with morphdom core
// init registers options, destroy cleans them up. Critical for remote search
// where the DOM changes frequently and options come/go dynamically.
export default function CreateRoverOption(Alpine: AlpineType): RoverOptionData {
    return {
        __value: undefined,
        init(this: RoverOptionContext) {
            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            let value = this.__value = Alpine.extractProp(this.$el, 'value', '') as string;

            const rawSearch = Alpine.extractProp(this.$el, 'data-search', value) as string;

            // Normalize search string for i18n: strip diacritics, lowercase, trim.
            // Enables consistent matching across accented characters and case variations.
            const normalizedSearch = String(rawSearch).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

            this.$el.dataset.value = value;

            this.__add(value, normalizedSearch, disabled);

            this.$nextTick(() => {
                if (disabled) {
                    this.$el.setAttribute('tabindex', '-1');
                }
            });
        },

        destroy() {
            this.__forget(this.__value);
        }
    }
}