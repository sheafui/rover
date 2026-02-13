import { OPTION_SLOT_NAME } from "src/constants";
import { OptionManager, RoverRootContext } from "src/types";
import { bindListener } from "./utils";


export function createOptionManager(root: RoverRootContext): OptionManager {

    const optionsEls = Array.from(root.$el.querySelectorAll('[x-rover\\:option]')) as HTMLElement[];

    if (!optionsEls) console.warn("no individual option element has been found");


    return {
        controller: new AbortController(),

        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K], activeKey: string | undefined) => void
        ) {
            if (!optionsEls) return;

            const listener = (event: HTMLElementEventMap[K]) => {
                const activeKey = root.__activatedKey ?? undefined;

                handler(event, activeKey);
            };

            optionsEls.forEach((option) => {
                bindListener(option, eventKey, listener, this.controller);

            })
        },

        destroy() {
            this.controller.abort();
        }
    };
}
