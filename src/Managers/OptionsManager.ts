import { OPTION_SLOT_NAME } from "src/constants"
import { OptionsManager, RoverRootContext } from "src/types"
import { bindListener } from "./utils"

export function createOptionsManager(
    root: RoverRootContext
): OptionsManager {
    const cleanup: (() => void)[] = []

    const findClosestOption = (el: Element | undefined): HTMLElement | undefined => {
        if (!el) return undefined

        return Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME && node.hasAttribute("x-rover:option")) as HTMLElement | undefined
    }


    const optionsEl = root.$el.querySelector('[x-rover\\:options]') as HTMLInputElement | undefined

    if (!optionsEl) {
        console.warn(String.raw`Input element with [x-rover\\:options] not found`)
    }

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (
                event: HTMLElementEventMap[K],
                optionEl: HTMLElement | undefined,
                activeKey: string | null
            ) => void
        ) {
            if (!optionsEl) return

            const listener = (event: HTMLElementEventMap[K]) => {

                const target = event.target as Element | undefined

                const optionEl = findClosestOption(target);

                const activeKey = root.__activatedKey ?? null

                handler(event, optionEl, activeKey)
            }

            bindListener(optionsEl, eventKey, listener, cleanup)
        },

        findClosestOption,

        registerSharedEventListerns() {
            // example
            // this.on("mouseover", (event, optionEl) => { ... })
        },

        destroy() {
            cleanup.forEach(fn => fn())
        }
    }
}
