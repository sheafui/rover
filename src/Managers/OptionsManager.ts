import { OPTION_SLOT_NAME } from "src/constants";
import { OptionsManager, RoverRootContext } from "src/types";
import { bindListener } from "./utils";


export function createOptionsManager(root: RoverRootContext): OptionsManager {

    const optionsEl = root.$el.querySelector('[x-rover\\:options]') as HTMLElement;

    if (!optionsEl) console.warn("Options container not found");

    const findClosestOption = (el: EventTarget | null): HTMLElement | undefined => {

        if (!el || !(el instanceof HTMLElement)) return

        return Alpine.findClosest(el, node => node.dataset.slot === OPTION_SLOT_NAME && node.hasAttribute("x-rover:option")) as HTMLElement | undefined;
    };

    return {
        controller: new AbortController(),

        on<K extends keyof HTMLElementEventMap>(
            eventKey: K,
            handler: (event: HTMLElementEventMap[K],
                optionEl: HTMLElement | undefined,
                activeKey: string | null
            ) => void
        ) {
            if (!optionsEl) return;

            const listener = (event: HTMLElementEventMap[K]) => {
                const optionEl = findClosestOption(event.target);
                const activeKey = root.__activatedKey ?? null;
                handler(event, optionEl, activeKey);
            };

            bindListener(optionsEl, eventKey, listener, this.controller);
        },

        findClosestOption,

        enableDefaultOptionsHandlers(disabledEvents: string[] = []) {
            const events = {
                click: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.key) return;
                    root.$nextTick(() => root.$refs.__input?.focus({ preventScroll: true }));
                },
                mouseover: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.key) return;
                    root.__activate(optionEl.dataset.key);
                },
                mousemove: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.key || root.__isActive(optionEl.dataset.key)) return;
                    root.__activate(optionEl.dataset.key);
                },
                mouseout: () => {
                    if (root.__keepActivated) return;
                    root.__deactivate();
                }
            };

            Object.entries(events).forEach(([key, handler]) => {
                if (!disabledEvents.includes(key)) {
                    this.on(key, (event: Event, optionEl: HTMLElement) => {
                        event.stopPropagation();

                        if (!optionEl) return;

                        handler(optionEl);
                    }
                    );
                }
            });

        },

        get all() {
            let allOptions = root.__optionsEls;

            if (!allOptions) return []

            return Array.from(allOptions);
        },
        destroy() {
            this.controller.abort();
        }
    };
}
