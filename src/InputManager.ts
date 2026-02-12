import { InputManager, RoverRootContext } from "./types";

export function createInputManager(root: RoverRootContext): InputManager {
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
        
        destroy() {
            cleanup.forEach(fn => fn());
        }
    };
}