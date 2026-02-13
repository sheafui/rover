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

    return {
        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (
                event: HTMLElementEventMap[K],
                optionEl: HTMLElement | undefined,
                activeKey: string | null
            ) => void
        ) {
            root.$nextTick(() => {
                const container = root.$refs.__options as HTMLElement | undefined
                if (!container) return

                const listener = (event: HTMLElementEventMap[K]) => {

                    const target = event.target as Element | undefined

                    const optionEl = findClosestOption(target);

                    const activeKey = root.__activatedKey ?? null

                    handler(event, optionEl, activeKey)
                }

                bindListener(container, eventKey, listener, cleanup)
            })
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
