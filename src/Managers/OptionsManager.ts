import { OptionsManager, RoverRootContext } from "../types";

export function createOptionsManager(root: RoverRootContext): OptionsManager {
    const cleanup: (() => void)[] = [];

    return {

        on(eventKey, handler) {
            root.$nextTick(() => {
                const inputEl = root.$refs.__options as HTMLElement | undefined;

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

        registerSharedEventListerns() {
            this.on('')
        },

        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}