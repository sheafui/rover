import { OptionManager, RoverRootContext } from "src/types";
import { bindListener } from "./utils";


export function createOptionManager(root: RoverRootContext): OptionManager {

    // this is lazy to make sure even options constucted by `x-for` get collected
    const getAllOptions = () => Array.from(root.$el.querySelectorAll('[x-rover\\:option]')) as HTMLElement[];


    return {
        controller: new AbortController(),

        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K], activeKey: string | undefined) => void
        ) {

            root.$nextTick(() => {
                const optionsEls = getAllOptions();

                if (!optionsEls) return;

                const listener = (event: HTMLElementEventMap[K]) => {
                    const activeKey = root.__activatedKey ?? undefined;

                    handler(event, activeKey);
                };

                optionsEls.forEach((option) => {
                    bindListener(option, eventKey, listener, this.controller);
                })
            })
        },

        destroy() {
            this.controller.abort();
        }
    };
}
