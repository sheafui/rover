import type { Alpine as AlpineType } from 'alpinejs';
import { RoverOptionsContext, RoverOptionsData } from 'src/types';

export default function CreateRoverOptions(Alpine: AlpineType): RoverOptionsData {

    return {
        init(this: RoverOptionsContext) {
    
            this.$data.__static = Alpine.extractProp(this.$el, 'static', false) as boolean;

            if (Alpine.bound(this.$el, 'keepActivated')) {
                this.__keepActivated = true;
            }

            return this.$el.dataset.slot = 'options';
        }
    }
}