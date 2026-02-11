import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionData, RoverOptionContext } from 'src/types';

export const SLOT_NAME = 'rover-option';

/**
 * OPTIMIZED VERSION - NO INDIVIDUAL WATCHERS
 * 
 * All reactive logic moved to CreateRoverRoot for better performance
 * This version just sets up the option and adds it to the collection
 */
export default function CreateRoverOption(Alpine: AlpineType, id: number): RoverOptionData {
    return {
        __uniqueKey: 'option-' + id,
        __isVisible: true,

        init(this: RoverOptionContext) {
            // Setup element
            this.$el.dataset.slot = SLOT_NAME;
            this.$el.dataset.key = this.__uniqueKey;

            // Extract props
            let value = Alpine.extractProp(this.$el, 'value', '') as string;
            let disabled = Alpine.extractProp(this.$el, 'disabled', false, false) as boolean;

            this.$el.dataset.value = value;

            // Add to collection
            this.__add(this.__uniqueKey, value, disabled);
            this.__pushOptionToItems(String(id));

            // ❌ REMOVED: All watchers moved to CreateRoverRoot
            // ❌ No more: this.$watch('__activatedKey', ...)
            // ❌ No more: this.$watch('__searchQuery', ...)
            // ❌ No more: this.$watch('__selectedKeys', ...)
            // ❌ No more: this.$watch('__isVisible', ...)

            // Set disabled attribute if needed
            this.$nextTick((): void => {
                if (disabled) {
                    this.$el.setAttribute('tabindex', '-1');
                }
            });
        },

        destroy() {
            this.__forget(this.__uniqueKey);
            // No watchers to clean up!
        }
    }
}