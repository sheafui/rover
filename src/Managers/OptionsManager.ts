import { OptionsManager, RoverRootContext } from "src/types";
import { bindListener } from "./utils";


export function createOptionsManager(root: RoverRootContext): OptionsManager {

    const optionsEl = root.$el.querySelector('[x-rover\\:options]') as HTMLElement;

    if (!optionsEl) console.warn("Options container not found");

    const findClosestOption = (el: EventTarget | null): HTMLElement | undefined => {

        if (!el || !(el instanceof HTMLElement)) return

        return Alpine.findClosest(el, node => node.hasAttribute("x-rover:option")) as HTMLElement | undefined;
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
                
                handler(event, optionEl, root.__activatedValue ?? null);
            };

            bindListener(optionsEl, eventKey, listener, this.controller);
        },

        findClosestOption,

        enableDefaultOptionsHandlers(disabledEvents: string[] = []) {
            const events = {
                click: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.value) return;
                    root.$nextTick(() => root.$refs.__input?.focus({ preventScroll: true }));
                },
                mouseover: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.value) return;
                    root.__activate(optionEl.dataset.value);
                },
                mousemove: (optionEl: HTMLElement) => {
                    if (!optionEl.dataset.value || root.__isActive(optionEl.dataset.value)) return;
                    root.__activate(optionEl.dataset.value);
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
