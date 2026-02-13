import { OptionManager, RoverRootContext } from "../types";

export function createOptionManager(root: RoverRootContext): OptionManager {
    const cleanup: (() => void)[] = [];

    return {

        on(eventKey, handler) {
            root.$nextTick(() => {
                const inputEl = root.$refs.__input as HTMLElement | undefined;

                if (!inputEl) return;

                const listener = (event: HTMLElementEventMap[typeof eventKey]) => {
                    const activeKey = root.__activatedKey ?? null;
                    handler(event, activeKey);
                };

                inputEl.addEventListener(eventKey, listener);

                cleanup.push(() => {
                    inputEl.removeEventListener(eventKey, listener);
                });
            });
        },

        // set value(val: string) {
        //     root.$nextTick(() => {
        //         const inputEl = root.$refs.__input as HTMLInputElement | undefined;
        //         if (inputEl) {
        //             inputEl.value = val;
        //         }
        //     });
        // },

        // get value() {
        //     const inputEl = root.$refs.__input as HTMLInputElement | undefined;
        //     return inputEl ? inputEl.value : '';
        // },

        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}