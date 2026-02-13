import { InputManager, RoverRootContext } from "../types"
import { bindListener } from "./utils"

export function createInputManager(
    root: RoverRootContext
): InputManager {

    const cleanup: (() => void)[] = [];

    const inputEl = root.$el.querySelector('[x-rover\\:input]') as HTMLInputElement | undefined

    if (!inputEl) {
        console.warn(String.raw`Input element with [x-rover\\:input] not found`)
    }

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (
                event: HTMLElementEventMap[K],
                activeKey: string | undefined
            ) => void
        ) {
            if (!inputEl) return

            const listener = (event: HTMLElementEventMap[K]) => {
                const activeKey = root.__activatedKey ?? undefined
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

