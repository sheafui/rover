import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionsContext, RoverOptionsData } from 'src/types';

export default function CreateRoverOptions(Alpine: AlpineType): RoverOptionsData {

    const SLOT_NAME = 'rover-options';

    return {
        init(this: RoverOptionsContext) {

            this.$data.__static = Alpine.extractProp(this.$el, 'static', false) as boolean;

            if (Alpine.bound(this.$el, 'keepActivated')) {
                this.__keepActivated = true;
            }


            return this.$el.dataset.slot = SLOT_NAME;
        },

        __handleClickAway(this: RoverOptionsContext, event: MouseEvent) {
            if (this.__static) return;

            let target = event.target as HTMLElement;
            
            if (
                target.hasAttribute('data-slot') &&
                target.getAttribute('data-slot') === 'control'
            ) {
                return;
            }

            this.__close();
        }
    }
}