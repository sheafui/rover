import { OptionManager, RoverRootContext } from "../types";

export function createOptionManager(root: RoverRootContext): OptionManager {
    const cleanup: (() => void)[] = [];

    return {

        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (
                event: HTMLElementEventMap[K],
                activeKey: string | undefined
            ) => void
        ) {
            root.$nextTick(() => {
                const inputEl = root.$refs.__input as HTMLElement | undefined;

                if (!inputEl) return;

                const listener = (event: HTMLElementEventMap[typeof eventKey]) => {
                    const activeKey = root.__activatedKey ?? undefined;
                    handler(event, activeKey);
                };

                inputEl.addEventListener(eventKey, listener);

                cleanup.push(() => {
                    inputEl.removeEventListener(eventKey, listener);
                });
            });
        },


        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}