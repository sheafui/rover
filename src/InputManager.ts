import { InputManager, RoverRootContext } from "./types"
export function createInputManager(root: RoverRootContext): InputManager {
    return {
        on(eventKey, handler) {
            root.$nextTick(() => {
                const inputEl = root.$refs.__input as HTMLElement | undefined;

                if (!inputEl) return;

                console.log('Adding event listener for', eventKey, 'on input element', inputEl);

                inputEl.addEventListener(eventKey, (event: KeyboardEvent) => {
                    const activeKey = root.__activatedKey ?? null
                    handler(event, activeKey)
                })
            })
        }
    }
}