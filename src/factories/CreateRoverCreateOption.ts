import { RoverCreateOptionContext, RoverCreateOptionData } from 'src/types';

// Per-option component approach: negligible memory/erformnece cost, massive morphdom win.
// Measurements show zero difference vs shared component, minimal memory overhead.
// The tradeoff: automatic lifecycle integration with morphdom core
// init registers options, destroy cleans them up. Critical for remote search
// where the DOM changes frequently and options come/go dynamically.
export default function CreateRoverOption(): RoverCreateOptionData {
    return {
        init(this: RoverCreateOptionContext) {
            this.$nextTick(() => {
                
             })
        },
        destroy() {
            // if create option is active when it leaves, deactivate
        }
    }
}