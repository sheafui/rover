import { OPTION_SLOT_NAME } from "src/constants"
import { OptionsManager, RoverRootContext } from "src/types"
import { bindListener } from "./utils"

export function createOptionsManager(
    rootDataStack: RoverRootContext
): OptionsManager {
    const cleanup: (() => void)[] = []

    const findClosestOption = (el: Element | undefined): HTMLElement | undefined => {
        if (!el) return undefined

        return Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME && node.hasAttribute("x-rover:option")) as HTMLElement | undefined
    }


    const optionsEl = rootDataStack.$el.querySelector('[x-rover\\:options]') as HTMLInputElement | undefined

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

                const activeKey = rootDataStack.__activatedKey ?? null

                handler(event, optionEl, activeKey)
            }

            bindListener(optionsEl, eventKey, listener, cleanup)
        },

        findClosestOption,

        enableDefaultInputHandlers(disabledEvents) {
            // example
            // this.on("mouseover", (event, optionEl) => { ... })
        },

        // @ts-ignore
        __registerEventsDelector() {
            const findClosestOption = (el: Element) => Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME);

            const delegate = (handler: (optionEl: HTMLElement) => void) => {
                return function (e: Event) {
                    e.stopPropagation();

                    if (!(e.target instanceof Element)) return;

                    const optionEl = findClosestOption(e.target);

                    if (!optionEl) return;

                    handler(optionEl as HTMLElement);
                };
            };

            this.$nextTick(() => {
                this.__optionsEl = this.$refs.__options;

                if (!this.__optionsEl) return;

                this.__optionsEl.addEventListener('click',
                    delegate((optionEl) => {
                        if (!optionEl.dataset.key) return;

                        this.$nextTick(() => this.$refs?.__input?.focus({ preventScroll: true }))
                    })
                );

                this.__optionsEl.addEventListener('mouseover',
                    delegate((optionEl) => {
                        if (!optionEl.dataset.key) return;
                        this.__activate(optionEl.dataset.key);
                    })
                );

                this.__optionsEl.addEventListener('mousemove',
                    delegate((optionEl) => {
                        if (this.__isActive(optionEl.dataset.key || '')) return;
                        if (!optionEl.dataset.key) return;
                        this.__activate(optionEl.dataset.key);
                    })
                );

                this.__optionsEl.addEventListener('mouseout',
                    delegate(() => {
                        if (this.__keepActivated) return;
                        this.__deactivate();
                    })
                );
            });
        },


        close() {

        },
        open() {

        },
        destroy() {
            cleanup.forEach(fn => fn())
        }
    }
}
