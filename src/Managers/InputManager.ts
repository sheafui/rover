import { InputManager, RoverRootContext } from "../types"
import { bindListener } from "./utils"

export function createInputManager(
    root: RoverRootContext
): InputManager {

    const cleanup: (() => void)[] = [];

    const inputEl = root.$el.querySelector('[x-rover\\:input]') as HTMLInputElement | null

    if (!inputEl) {
        console.warn("Input element not found")
    }

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (
                event: HTMLElementEventMap[K],
                activeKey: string | null
            ) => void
        ) {
            if (!inputEl) return

            const listener = (event: HTMLElementEventMap[K]) => {
                const activeKey = root.__activatedKey ?? null
                handler(event, activeKey)
            }

            bindListener(inputEl, eventKey, listener, cleanup)
        },

        get value(): string {
            return inputEl ? inputEl.value : ""
        },

        set value(val: string) {
            if (inputEl) {
                inputEl.value = val
            }
        },

        registerSharedEventListerns() { },

        destroy() {
            cleanup.forEach(fn => fn())
        }
    }
}

