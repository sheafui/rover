import { ButtonManager, RoverRootContext } from "src/types";
import { bindListener } from "./utils";


export function createButtonManager(root: RoverRootContext): ButtonManager {

    const buttonEl = root.$el.querySelector('[x-rover\\:button]') as HTMLButtonElement;

    return {
        controller: new AbortController(),

        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K], activeKey: string | undefined) => void
        ) {

            if (!buttonEl) return;

            const listener = (event: HTMLElementEventMap[K]) => {
                const activeKey = root.__activatedKey ?? undefined;

                handler(event, activeKey);
            };
            bindListener(buttonEl, eventKey, listener, this.controller);
        },

        destroy() {
            this.controller.abort();
        }
    };
}
