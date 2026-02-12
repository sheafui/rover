import { RoverRootContext } from "./types"

export type InputManager = { on: (eventKey: string, handler: (event: KeyboardEvent, key: string | null) => void) => void }

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