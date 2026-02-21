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
            if (!optionsEl) return;

            optionsEl.tabIndex = 0;


            if (!disabledEvents.includes('mouseover')) {
                this.on('mouseover', (_event: MouseEvent, optionEl: HTMLElement) => {

                    if (!optionEl?.dataset.value) return;
                    
                    root.__activate(optionEl.dataset.value);
                });
            }

            if (!disabledEvents.includes('mousemove')) {
                this.on('mousemove', (_event: MouseEvent, optionEl: HTMLElement) => {
                    if (!optionEl?.dataset.value) return;
                    if (root.__isActive(optionEl.dataset.value)) return;

                    root.__activate(optionEl.dataset.value);
                });
            }

            if (!disabledEvents.includes('mouseout')) {
                this.on('mouseout', () => {
                    if (root.__keepActivated) return;
                    root.__deactivate();
                });
            }

            if (!disabledEvents.includes('keydown')) {
                this.on('keydown', (event: KeyboardEvent) => {
                    event.stopPropagation();

                    switch (event.key) {
                        case 'ArrowDown':
                            event.preventDefault();
                            root.__activateNext();
                            break;

                        case 'ArrowUp':
                            event.preventDefault();
                            root.__activatePrev();
                            break;

                        case 'Home':
                            event.preventDefault();
                            root.__activateFirst();
                            break;

                        case 'End':
                            event.preventDefault();
                            root.__activateLast();
                            break;

                        case 'Escape':
                            event.preventDefault();
                            root.__deactivate();
                            break;

                        case 'Tab':
                            root.__deactivate();
                            break;
                    }
                });
            }

        },

        get all() {
            let allOptions = root.__optionsEls;

            if (!allOptions) return []

            return Array.from(allOptions);
        },
        flush() {
            root.__flush();
        },
        destroy() {
            this.controller.abort();
        }
    };
}
